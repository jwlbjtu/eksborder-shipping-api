import axios, { AxiosResponse } from 'axios';
import {
  CARRIERS,
  UPS_SERVICES,
  UPS_SERVICE_IDS,
  UPS_WEIGHT_UNITS,
  WeightUnit
} from '../../constants';

import {
  computeTotalShipmentWeight,
  roundToTwoDecimal
} from '../../utils/helpers';
import { buildUpsPackages, convertToUPSAddress } from './ups.helpers';
import util from 'util';
import convertlib from 'convert-units';
import {
  UPSProductRequest,
  UPSProductResponse,
  UPSRatedShipment,
  UPSShipper
} from '../../../types/carriers/ups';
import { IShipping } from '../../../types/record.types';
import { IAccount } from '../../../types/user.types';
import { Rate } from '../../../types/carriers/carrier';
import { logger } from '../../logger';
import { isShipmentInternational } from '../carrier.helper';

// const endpoint = '/ship/v1801/rating/Shop';
const rateEndpoint = '/ship/v1801/rating/Rate';

export const buildUpsProductReqBody = (
  shipmentData: IShipping,
  shipperInfo: UPSShipper
): UPSProductRequest => {
  const totalWeight = computeTotalShipmentWeight(shipmentData);
  const packages = buildUpsPackages(shipmentData);

  const upsProdRequest: UPSProductRequest = {
    RateRequest: {
      Shipment: {
        DeliveryTimeInformation: {
          PackageBillType: '03' // Non-Document Packages
        },
        Shipper: shipperInfo,
        ShipTo: {
          Name: shipmentData.toAddress.company || shipmentData.toAddress.name!,
          Address: convertToUPSAddress(shipmentData.toAddress)
        },
        ShipFrom: {
          Name: shipmentData.sender!.company || shipmentData.sender!.name!,
          Address: convertToUPSAddress(shipmentData.sender!)
        },
        Service: {
          Code: shipmentData.service!.id!,
          Description: shipmentData.service!.name
        },
        ShipmentRatingOptions: {
          NegotiatedRatesIndicator: ''
        },
        ShipmentTotalWeight: {
          UnitOfMeasurement: {
            Code: UPS_WEIGHT_UNITS[totalWeight.unitOfMeasure]
          },
          Weight: roundToTwoDecimal(totalWeight.value).toString()
        },
        Package: packages
      }
    }
  };

  if (
    shipmentData.service &&
    shipmentData.service.id === UPS_SERVICE_IDS.UPS_SUREPOST_LIGHT &&
    !(shipmentData.morePackages && shipmentData.morePackages.length > 0)
  ) {
    const ozsWeight = convertlib(totalWeight.value)
      .from(totalWeight.unitOfMeasure)
      .to(WeightUnit.OZ);
    upsProdRequest.RateRequest.Shipment.ShipmentTotalWeight = {
      UnitOfMeasurement: {
        Code: UPS_WEIGHT_UNITS[WeightUnit.OZ]
      },
      Weight: roundToTwoDecimal(ozsWeight).toString()
    };
    upsProdRequest.RateRequest.Shipment.Package[0].PackageWeight = {
      UnitOfMeasurement: { Code: UPS_WEIGHT_UNITS[WeightUnit.OZ] },
      Weight: roundToTwoDecimal(ozsWeight).toString()
    };
  }

  return upsProdRequest;
};

export const callUpsProductsEndpoint = async (
  apiUrl: string,
  shipperInfo: UPSShipper,
  headers: Record<string, string>,
  shipmentData: IShipping,
  isTest: boolean,
  clientCarrier: IAccount | undefined
): Promise<{ rates: Rate[]; errors: string[] }> => {
  if (!clientCarrier) return { rates: [], errors: [] };
  logger.info(
    `UPS response for User ${shipmentData.userRef} with Order ${shipmentData._id}`
  );
  const response = await requestUPSSingleRate(
    shipmentData,
    shipperInfo,
    apiUrl,
    headers
  );

  const rates: Rate[] = [];
  const errors: string[] = [];
  if (typeof response === 'string') {
    errors.push(response);
  } else {
    const upsProdResponse: UPSProductResponse = response.data;
    if (upsProdResponse.RateResponse) {
      const ratedShipment = upsProdResponse.RateResponse.RatedShipment;
      if (Array.isArray(ratedShipment)) {
        for (const item of ratedShipment) {
          const upsRate = convertUpsRatedShipmentToRate(
            item,
            isShipmentInternational(shipmentData),
            isTest,
            clientCarrier
          );
          if (upsRate) rates.push(upsRate);
        }
      } else {
        const upsRate = convertUpsRatedShipmentToRate(
          ratedShipment,
          isShipmentInternational(shipmentData),
          isTest,
          clientCarrier
        );
        if (upsRate) rates.push(upsRate);
      }
    }

    if (upsProdResponse.response) {
      for (const item of upsProdResponse.response.errors) {
        errors.push(`${CARRIERS.UPS} Error: ${item.message}`);
      }
    }
  }

  logger.info('Return data from UPS [Rating] endpoint');
  logger.info(util.inspect(rates, true, null));
  logger.info(util.inspect(errors, true, null));
  return { rates: rates, errors };
};

// export const requestUPSRates = async (
//   order: IOrder,
//   shipperInfo: UPSShipper,
//   apiUrl: string,
//   headers: Record<string, string>,
//   orderRegion: string
// ): Promise<AxiosResponse<any> | string> => {
//   try {
//     const reqBody = buildUpsProductReqBody(order, shipperInfo, false);
//     const config: Record<string, Record<string, string>> = { headers: headers };
//     if (orderRegion === CARRIER_REGIONS.US_DOMESTIC) {
//       config.params = { additionalinfo: 'timeintransit' };
//     }
//     logger.info(`Request UPS generate service rates`);
//     const response = await axios.post(apiUrl + endpoint, reqBody, config);
//     logger.info(`UPS response for generate service rates`);
//     logger.info(util.inspect(response.data, true, null));
//     return response;
//   } catch (error) {
//     if (error.response) {
//       console.log(error.response.data.response);
//       logger.error(util.inspect(error.response.data.response, true, null));
//       return `${CARRIERS.UPS} ERROR: ${error.response.data.response.errors[0].message}`;
//     } else {
//       console.log(error);
//       logger.error(util.inspect(error.message, true, null));
//       return `${CARRIERS.UPS} ERROR: ${error.message}`;
//     }
//   }
// };

export const requestUPSSingleRate = async (
  shipmentData: IShipping,
  shipperInfo: UPSShipper,
  apiUrl: string,
  headers: Record<string, string>
): Promise<AxiosResponse<any> | string> => {
  try {
    const reqBody = buildUpsProductReqBody(shipmentData, shipperInfo);
    const config: Record<string, Record<string, string>> = { headers: headers };
    if (
      shipmentData.service!.id !== UPS_SERVICE_IDS.UPS_SUREPOST_LIGHT &&
      shipmentData.service!.id !== UPS_SERVICE_IDS.UPS_SUREPOST &&
      shipmentData.service!.id !== UPS_SERVICE_IDS.UPS_WORLDWIDE_EXPEDITED &&
      shipmentData.service!.id !== UPS_SERVICE_IDS.UPS_WORLDWIDE_EXPRESS &&
      shipmentData.service!.id !== UPS_SERVICE_IDS.UPS_WORLDWIDE_SAVER
    ) {
      config.params = { additionalinfo: 'timeintransit' };
    }
    logger.info(`Request UPS rate`);
    const response = await axios.post(apiUrl + rateEndpoint, reqBody, config);
    logger.info(`UPS response of rate`);
    logger.info(util.inspect(response.data, true, null));
    return response;
  } catch (error) {
    if ((error as any).response) {
      console.log((error as any).response.data.response);
      logger.error(
        util.inspect((error as any).response.data.response, true, null)
      );
      return `${CARRIERS.UPS} ERROR: ${
        (error as any).response.data.response.errors[0].message
      }`;
    } else {
      console.log(error);
      logger.error(util.inspect((error as any).message, true, null));
      return `${CARRIERS.UPS} ERROR: ${(error as any).message}`;
    }
  }
};

export const convertUpsRatedShipmentToRate = (
  upsProduct: UPSRatedShipment,
  isInternational: boolean,
  isTest: boolean,
  clientCarrier: IAccount
): Rate | undefined => {
  const upsRateObj = upsProduct.NegotiatedRateCharges
    ? upsProduct.NegotiatedRateCharges.TotalCharge
    : upsProduct.TotalCharges;
  if (
    upsProduct.Service.Code === UPS_SERVICE_IDS.UPS_SUREPOST_LIGHT ||
    upsProduct.Service.Code === UPS_SERVICE_IDS.UPS_SUREPOST ||
    upsProduct.Service.Code === UPS_SERVICE_IDS.UPS_WORLDWIDE_EXPEDITED ||
    upsProduct.Service.Code === UPS_SERVICE_IDS.UPS_WORLDWIDE_EXPRESS ||
    upsProduct.Service.Code === UPS_SERVICE_IDS.UPS_WORLDWIDE_SAVER
  ) {
    const serviceObj = UPS_SERVICES[upsProduct.Service.Code];
    const rate: Rate = {
      carrier: CARRIERS.UPS,
      serviceId: upsProduct.Service.Code,
      service: serviceObj.service,
      rate: parseFloat(upsRateObj.MonetaryValue),
      currency: upsRateObj.CurrencyCode,
      eta: serviceObj.eta,
      isTest,
      clientCarrierId: clientCarrier.id.toString()
    };
    return rate;
  } else if (!isInternational) {
    const rate: Rate = {
      carrier: CARRIERS.UPS,
      serviceId: upsProduct.Service.Code,
      service: upsProduct.TimeInTransit.ServiceSummary.Service.Description,
      rate: parseFloat(upsRateObj.MonetaryValue),
      currency: upsRateObj.CurrencyCode,
      eta: `${
        upsProduct.TimeInTransit.ServiceSummary.EstimatedArrival
          .BusinessDaysInTransit
      }${
        upsProduct.TimeInTransit.ServiceSummary.EstimatedArrival
          .BusinessDaysInTransit === '1'
          ? ' day'
          : ' days'
      }`,
      isTest,
      clientCarrierId: clientCarrier.id.toString()
    };
    return rate;
  } else {
    return undefined;
  }
};
