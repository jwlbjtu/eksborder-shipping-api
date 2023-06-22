import {
  CARRIERS,
  Currency,
  DistanceUnit,
  USPS_CLASSID,
  USPS_CLASSID_TO_SERVICE,
  USPS_INTL_ID_TO_SERVICE,
  USPS_INTL_SERVICE_IDS,
  USPS_PRODUCTS_APIS,
  WeightUnit,
  COUNTRY_NAMES,
  USPS_LABEL_SERVICES
} from '../../constants';
import dayjs from 'dayjs';
import axios from 'axios';
import uniqid from 'uniqid';
import convertlib from 'convert-units';
import { roundToTwoDecimal } from '../../utils/helpers';
import fastParser from 'fast-xml-parser';
import util from 'util';
import { IShipping, ShipmentData } from '../../../types/record.types';
import {
  UspsDomasticProductRequest,
  UspsDomasticProductResponse,
  UspsInternationalPackage,
  UspsInternationalProductRequest,
  UspsInternationalProductResponse,
  UspsIntlService,
  UspsPackage,
  UspsPostage
} from '../../../types/carriers/usps';
import { IAccount } from '../../../types/user.types';
import { Rate } from '../../../types/carriers/carrier';
import { logger } from '../../logger';

export const buildUspsProductReqBody = (
  shipment: IShipping | ShipmentData,
  userId: string,
  isInternational: boolean
): UspsDomasticProductRequest | UspsInternationalProductRequest => {
  if (!isInternational) {
    return createDomesticRequest(shipment, userId);
  } else {
    return createInternationalRequest(shipment, userId);
  }
};

const createDomesticRequest = (
  shipment: IShipping | ShipmentData,
  userId: string
): UspsDomasticProductRequest => {
  const packageInfo = shipment.packageInfo!;
  const dimentions = packageInfo.dimentions!;
  const packageObj: UspsPackage = {
    '@_ID': uniqid(),
    Service: USPS_CLASSID_TO_SERVICE[shipment.service!.id!].serviceId,
    FirstClassMailType:
      shipment.service!.id! === USPS_CLASSID.FIRST_CLASS
        ? 'PACKAGE SERVICE'
        : '',
    ZipOrigination: shipment.sender.zip!,
    ZipDestination: shipment.toAddress.zip!,
    Pounds: roundToTwoDecimal(
      convertlib(packageInfo.weight.value)
        .from(packageInfo.weight.unitOfMeasure)
        .to(WeightUnit.LB)
    ),
    Ounces: 0,
    Container: {},
    Size: {},
    Width: roundToTwoDecimal(
      convertlib(dimentions.width)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Length: roundToTwoDecimal(
      convertlib(dimentions.length)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Height: roundToTwoDecimal(
      convertlib(dimentions.height)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Girth: {},
    Machinable: false,
    ShipDate: {
      '@_Option': 'HFP',
      '#text': dayjs(shipment.shipmentOptions.shipmentDate).format('YYYY-MM-DD')
    }
  };

  const request: UspsDomasticProductRequest = {
    RateV4Request: {
      '@_USERID': userId,
      Revision: '2',
      Package: [packageObj]
    }
  };
  return request;
};

export const createInternationalRequest = (
  shipment: IShipping | ShipmentData,
  userId: string
): UspsInternationalProductRequest => {
  const packageInfo = shipment.packageInfo!;
  const dimentions = packageInfo.dimentions!;
  const customItems = shipment.customItems!;

  const packageObj: UspsInternationalPackage = {
    '@_ID': uniqid(),
    Pounds: roundToTwoDecimal(
      convertlib(packageInfo.weight.value)
        .from(packageInfo.weight.unitOfMeasure)
        .to(WeightUnit.LB)
    ),
    Ounces: 0,
    Machinable: false,
    MailType: 'Package',
    ValueOfContents: parseFloat(
      customItems
        .reduce(
          (acumulator, ele) => acumulator + ele.quantity * ele.itemValue,
          0
        )
        .toFixed(2)
    ),
    Country: COUNTRY_NAMES[shipment.toAddress.country],
    Container: {},
    Size: {},
    Width: roundToTwoDecimal(
      convertlib(dimentions.width)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Length: roundToTwoDecimal(
      convertlib(dimentions.length)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Height: roundToTwoDecimal(
      convertlib(dimentions.height)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Girth: {},
    OriginZip: shipment.sender.zip!,
    CommercialFlag: 'Y'
  };

  const request: UspsInternationalProductRequest = {
    IntlRateV2Request: {
      '@_USERID': userId,
      Revision: '2',
      Package: [packageObj]
    }
  };

  return request;
};

export const callUspsProductsEndpoint = async (
  apiUrl: string,
  isInternational: boolean,
  prodReqBody: UspsDomasticProductRequest | UspsInternationalProductRequest,
  shipment: IShipping | ShipmentData,
  isTest: boolean,
  clientCarrier: IAccount | undefined
): Promise<{ rates: Rate[]; errors: string[] }> => {
  if (!clientCarrier) return { rates: [], errors: [] };
  let api = USPS_PRODUCTS_APIS.US_DOMESTIC;
  if (isInternational) {
    api = USPS_PRODUCTS_APIS.US_INTERNATIONAL;
  }

  const Parser = fastParser.j2xParser;

  const config = {
    params: {
      API: api,
      XML: new Parser({ ignoreAttributes: false }).parse(prodReqBody)
    }
  };

  const response = await axios.get(apiUrl, config);
  logger.info(`USPS response for User ${shipment.userRef}`);
  logger.info(util.inspect(response.data, true, null));

  const options = {
    ignoreAttributes: false,
    allowBooleanAttributes: true,
    parseTrueNumberOnly: true
  };

  const uspsProdResponse = fastParser.parse(response.data, options);
  // Process Domestic Product Response
  if (!isInternational) {
    const result = processUspsDomesticProductResponse(
      uspsProdResponse as UspsDomasticProductResponse,
      isTest,
      clientCarrier
    );
    return result;
  } else {
    const result = processUspsInternationalProductResponse(
      shipment,
      uspsProdResponse as UspsInternationalProductResponse,
      isTest,
      clientCarrier
    );
    return result;
  }
};

const processUspsDomesticProductResponse = (
  uspsProdResponse: UspsDomasticProductResponse,
  isTest: boolean,
  clientCarrier: IAccount
) => {
  const rates: Rate[] = [];
  const errors: string[] = [];
  if (uspsProdResponse.RateV4Response) {
    const postages = uspsProdResponse.RateV4Response.Package.Postage;
    const error = uspsProdResponse.RateV4Response.Package.Error;

    if (error) {
      errors.push(`${CARRIERS.USPS} ERROR: ${error.Description}`);
    } else {
      if (Array.isArray(postages)) {
        for (let i = 0; i < postages.length; i += 1) {
          const postage = postages[i];
          const classId = postage['@_CLASSID'];
          if (
            classId === USPS_CLASSID.FIRST_CLASS ||
            classId === USPS_CLASSID.PRIORITY ||
            classId === USPS_CLASSID.PRIORITY_EXPRESS
          ) {
            rates.push(
              convertUspsProductToRate(postage, isTest, clientCarrier)
            );
          }
        }
      } else {
        rates.push(convertUspsProductToRate(postages, isTest, clientCarrier));
      }
    }
  }

  if (uspsProdResponse.Error) {
    errors.push(
      `${CARRIERS.USPS} ERROR: ${uspsProdResponse.Error.Description}`
    );
  }

  return { rates, errors };
};

const processUspsInternationalProductResponse = (
  shipment: IShipping | ShipmentData,
  uspsProdResponse: UspsInternationalProductResponse,
  isTest: boolean,
  clientCarrier: IAccount
) => {
  const rates: Rate[] = [];
  const errors: string[] = [];
  if (uspsProdResponse.IntlRateV2Response) {
    if (uspsProdResponse.IntlRateV2Response.Package.Error) {
      errors.push(
        `${CARRIERS.USPS} ERROR: ${uspsProdResponse.IntlRateV2Response.Package.Error.Description}`
      );
    } else {
      const services = uspsProdResponse.IntlRateV2Response.Package.Service;
      for (const item of services) {
        const serviceId = item['@_ID'];
        if (
          serviceId === USPS_INTL_SERVICE_IDS.EXPRESS_INTL ||
          serviceId === USPS_INTL_SERVICE_IDS.PRIORITY_INTL
        ) {
          if (serviceId === shipment.service!.id) {
            rates.push(
              convertUspsIntlProductToRate(item, isTest, clientCarrier)
            );
          }
        }
      }
    }
  }

  if (uspsProdResponse.Error) {
    errors.push(
      `${CARRIERS.USPS} ERROR: ${uspsProdResponse.Error.Description}`
    );
  }

  return { rates, errors };
};

const convertUspsProductToRate = (
  postage: UspsPostage,
  isTest: boolean,
  clientCarrier: IAccount
): Rate => {
  const itemRate = parseFloat(postage.CommercialRate || postage.Rate);
  const serviceInfo = USPS_CLASSID_TO_SERVICE[postage['@_CLASSID']];
  let serviceEta = serviceInfo.eta;
  if (postage.Commitment) {
    let commitment = postage.Commitment;
    if (Array.isArray(postage.Commitment)) {
      commitment = postage.Commitment[0];
    }
    const etaDays = parseInt(commitment.CommitmentName.split('-')[0]);
    if (etaDays > 1) {
      serviceEta = etaDays + ' days';
    } else {
      serviceEta = etaDays + ' day';
    }
  }
  const rate: Rate = {
    carrier: CARRIERS.USPS,
    serviceId: USPS_LABEL_SERVICES[serviceInfo.serviceId],
    service: serviceInfo.serviceName,
    rate: itemRate,
    currency: Currency.USD,
    isTest,
    clientCarrierId: clientCarrier.id.toString(),
    eta: serviceEta
  };
  return rate;
};

const convertUspsIntlProductToRate = (
  service: UspsIntlService,
  isTest: boolean,
  clientCarrier: IAccount
): Rate => {
  const serviceInfo = USPS_INTL_ID_TO_SERVICE[service['@_ID']];
  const rate: Rate = {
    carrier: CARRIERS.USPS,
    serviceId: service['@_ID'],
    service: serviceInfo.service,
    rate: service.CommercialPostage,
    currency: Currency.USD,
    isTest,
    clientCarrierId: clientCarrier.id.toString(),
    eta: serviceInfo.eta
  };
  return rate;
};
