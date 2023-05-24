import convert from 'convert-units';
import {
  FedexAccountNumber,
  FedexProductRequest,
  FedexProductRequestParams,
  FedexRestAddress,
  FedexRestPackageLineItem,
  FedexRestProductResponse,
  RequestedShipment
} from '../../../../types/carriers/fedex.rest';
import { IShipping } from '../../../../types/record.types';
import { IAddress } from '../../../../types/shipping.types';
import { IAccount } from '../../../../types/user.types';
import FedexAuthHelper from './auth.helper';
import axios from 'axios';
import { logger } from '../../../logger';
import util from 'util';
import { Rate } from '../../../../types/carriers/carrier';
import { CARRIERS, CURRENCY_LIST, Currency } from '../../../constants';

// const ACCOUNT_NUMBER_TEST = '740561073';
const productUrl = '/rate/v1/rates/quotes';

export const buildFedexRestRateRequest = (
  fedexAccount: string,
  shipment: IShipping,
  hubId: string,
  isTest: boolean
): FedexProductRequest => {
  // Build Account Number
  const accountNumber: FedexAccountNumber = {
    value: fedexAccount
  };
  // Build Rate Request Parameters
  const rateRequestControlParameters: FedexProductRequestParams = {
    returnTransitTimes: true
  };
  // Build Requested Shipment
  const packages = buildFedexRestRatePackageItems(shipment);

  const requestedShipment: RequestedShipment = {
    shipper: { address: generateFedexRestAddress(shipment.sender) },
    recipient: { address: generateFedexRestAddress(shipment.toAddress) },
    serviceType: isTest ? 'FIRST_OVERNIGHT' : shipment.service?.key,
    pickupType: 'CONTACT_FEDEX_TO_SCHEDULE',
    packagingType: 'YOUR_PACKAGING',
    rateRequestType: ['ACCOUNT'],
    totalPackageCount: packages.length,
    requestedPackageLineItems: packages
  };

  if (shipment.service?.key === 'SMART_POST') {
    const totalWeight = packages.reduce(
      (acc, curr) => acc + curr.weight.value,
      0
    );
    requestedShipment.smartPostInfoDetail = {
      ancillaryEndorsement: 'ADDRESS_CORRECTION',
      hubId,
      indicia: totalWeight < 1 ? 'PRESORTED_STANDARD' : 'PARCEL_SELECT'
    };
    requestedShipment.pickupType = 'USE_SCHEDULED_PICKUP';
  }

  const rateRequest: FedexProductRequest = {
    accountNumber,
    rateRequestControlParameters,
    requestedShipment
  };

  return rateRequest;
};

export const fedexRestRateService = async (
  apiUrl: string,
  apiKey: string,
  apiSecret: string,
  requestBody: FedexProductRequest,
  shipment: IShipping,
  isTest: boolean,
  clientCarrier: IAccount
): Promise<{
  rates: Rate[];
  errors: string[];
}> => {
  // Get auth token
  const token = await FedexAuthHelper.getToken(
    apiUrl,
    apiKey,
    apiSecret,
    isTest
  );
  // Send request
  const url = `${apiUrl}${productUrl}`;
  const res = await axios.post(url, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token?.access_token}`
    }
  });
  logger.info(
    `FedEx response for User ${shipment.userRef} with Order ${shipment._id}`
  );
  logger.info(util.inspect(res.data, true, null));
  const rateResponse = res.data;
  const result = processFedexRestRateResponse(
    rateResponse,
    isTest,
    clientCarrier
  );
  logger.info('Return data from FEDEX [Rate Finder] endpoint');
  logger.info(util.inspect(result, true, null));
  return result;
};

export const generateFedexRestAddress = (
  address: IAddress
): FedexRestAddress => {
  return {
    streetLines: address.street2
      ? [address.street1, address.street2]
      : [address.street1],
    city: address.city,
    stateOrProvinceCode: address.state,
    postalCode: address.zip,
    countryCode: address.country,
    residential: address.isResidential
  };
};

export const buildFedexRestRatePackageItems = (
  shipment: IShipping
): FedexRestPackageLineItem[] => {
  const packageInfo = shipment.packageInfo;
  if (!packageInfo) return [];
  const morePackages = shipment.morePackages;
  let packList = [packageInfo];
  if (morePackages && morePackages.length > 0) {
    packList = packList.concat(morePackages);
  }
  const result: FedexRestPackageLineItem[] = packList.map((item) => {
    const pack: FedexRestPackageLineItem = {
      subPackagingType: 'PACKAGE',
      groupPackageCount: 1,
      weight: {
        value: convert(item.weight.value)
          .from(item.weight.unitOfMeasure)
          .to('lb'),
        units: 'LB'
      },
      dimensions: {
        length: parseInt(item.dimentions!.length.toFixed(0)),
        width: parseInt(item.dimentions!.width.toFixed(0)),
        height: parseInt(item.dimentions!.height.toFixed(0)),
        units: item.dimentions!.unitOfMeasure.toUpperCase()
      }
    };
    return pack;
  });
  return result;
};

export const processFedexRestRateResponse = (
  data: FedexRestProductResponse,
  isTest: boolean,
  clientCarrier: IAccount
): {
  rates: Rate[];
  errors: string[];
} => {
  const rateDetails = data.output.rateReplyDetails;
  let rates: Rate[] = [];
  const errors: string[] = [];
  const rList = rateDetails.map((item) => {
    const rateDetail = item.ratedShipmentDetails.find(
      (ele) => ele.rateType === 'ACCOUNT'
    );
    const rate: Rate = {
      carrier: CARRIERS.FEDEX,
      service: item.serviceName,
      serviceId: item.serviceType,
      rate: rateDetail!.totalNetFedExCharge,
      currency: Currency.USD,
      isTest,
      clientCarrierId: clientCarrier._id
    };
    return rate;
  });
  rates = rates.concat(rList);
  return { rates, errors };
};
