import { Rate } from '../../../types/carriers/carrier';
import {
  FedexCredential,
  FedexProductReqBody,
  FedexRatesResponse,
  RequestedPackageLineItem,
  Version
} from '../../../types/carriers/fedex';
import { IShipping, ShipmentData } from '../../../types/record.types';
import { generateAuthentication } from './fedex.helpers';
import { createClientAsync, security } from 'soap';
import path from 'path';
import { logger } from '../../logger';
import util from 'util';
import { CARRIERS } from '../../constants';
import { IAccount } from '../../../types/user.types';
import { ceateFedexShipper } from './label.helper';
import { roundToTwoDecimal } from '../../utils/helpers';

const version: Version = {
  ServiceId: 'crs',
  Major: 28,
  Intermediate: 0,
  Minor: 0
};

const wsdl = path.join(
  __dirname,
  '../../../../static/wsdl/RateService_v28.wsdl'
);
const wsdlPro = path.join(
  __dirname,
  '../../../../static/wsdl/production/RateService_v28.wsdl'
);

const endpointPath = '/web-services';

export const buildFedexProductReqBody = (
  credential: FedexCredential,
  shipment: IShipping | ShipmentData
): FedexProductReqBody => {
  const fedexAuth = generateAuthentication(credential, version);
  const packages = generateFedexProductPackageItems(shipment);

  const result: FedexProductReqBody = {
    ...fedexAuth,
    ReturnTransitAndCommit: true,
    RequestedShipment: {
      DropoffType: 'REGULAR_PICKUP',
      ServiceType: shipment.service?.key,
      PackagingType: 'YOUR_PACKAGING',
      Shipper: ceateFedexShipper(shipment.sender),
      Recipient: ceateFedexShipper(shipment.toAddress),
      ShippingChargesPayment: {
        PaymentType: 'SENDER'
      }
    }
  };

  if (shipment.service?.key === 'SMART_POST') {
    result.RequestedShipment.SmartPostDetail = {
      ProcessingOptionsRequested: undefined,
      Indicia: 'PARCEL_SELECT',
      AncillaryEndorsement: 'ADDRESS_CORRECTION',
      HubId: credential.hubId
    };
  }

  result.RequestedShipment.PackageCount = packages.length;
  result.RequestedShipment.RequestedPackageLineItems = packages;

  return result;
};

export const generateFedexProductPackageItems = (
  shipment: IShipping | ShipmentData
): RequestedPackageLineItem[] => {
  const packageinfo = shipment.packageInfo!;
  const morePackages = shipment.morePackages;
  let packList = [packageinfo];
  if (morePackages && morePackages.length > 0) {
    packList = packList.concat(morePackages);
  }
  const result = packList.map((ele, index) => {
    const item: RequestedPackageLineItem = {
      SequenceNumber: index + 1,
      GroupPackageCount: 1,
      Weight: {
        Units: ele.weight.unitOfMeasure.toUpperCase(),
        Value: roundToTwoDecimal(ele.weight.value)
      },
      Dimensions: {
        Length: parseInt(ele.dimentions!.length.toFixed(0)),
        Width: parseInt(ele.dimentions!.width.toFixed(0)),
        Height: parseInt(ele.dimentions!.height.toFixed(0)),
        Units: ele.dimentions!.unitOfMeasure.toUpperCase()
      }
    };
    return item;
  });
  return result;
};

export const callFedexProductsEndpoint = async (
  apiUrl: string,
  prodReqBody: FedexProductReqBody,
  shipment: IShipping | ShipmentData,
  isTest: boolean,
  clientCarrier: IAccount
): Promise<{
  rates: Rate[];
  errors: string[];
}> => {
  const options = {
    endpoint: `${apiUrl}${endpointPath}`
  };

  const client = await createClientAsync(isTest ? wsdl : wsdlPro, options);
  const response = await client.getRatesAsync(prodReqBody);
  logger.info(`FedEx response for User ${shipment.userRef}`);
  logger.info(util.inspect(response[0], true, null));
  const data = response[0] as FedexRatesResponse;
  const result = processFedexProductsResponse(data, isTest, clientCarrier);
  logger.info('Return data from FEDEX [Rate Finder] endpoint');
  logger.info(util.inspect(result, true, null));
  return result;
};

export const processFedexProductsResponse = (
  response: FedexRatesResponse,
  isTest: boolean,
  clientCarrier: IAccount
): {
  rates: Rate[];
  errors: string[];
} => {
  const severity = response.HighestSeverity;
  let rates: Rate[] = [];
  let errors: string[] = [];

  if (severity === 'ERROR' || severity === 'FAILURE') {
    const notifications = response.Notifications;
    const eList = notifications.map((ele) => ele.Message);
    errors = errors.concat(eList);
  } else {
    console.log('Fedex service response...');
    console.log(response);
    const rList = response.RateReplyDetails.map((ele) => {
      const serviceDescription = ele.ServiceDescription;
      const shipmentRateDetail = ele.RatedShipmentDetails[0].ShipmentRateDetail;
      const rate: Rate = {
        carrier: CARRIERS.FEDEX,
        service: serviceDescription.Description,
        serviceId: serviceDescription.ServiceType,
        rate: shipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount,
        currency: shipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Currency,
        isTest,
        clientCarrierId: clientCarrier.id.toString()
      };
      return rate;
    });
    rates = rates.concat(rList);
  }

  return { rates, errors };
};
