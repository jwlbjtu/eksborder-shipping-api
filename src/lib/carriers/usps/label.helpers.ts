import {
  CARRIERS,
  COUNTRY_NAMES,
  DistanceUnit,
  TYPE_OF_CONTENT,
  USPS_INTL_ID_TO_API,
  USPS_INTL_SERVICE_IDS,
  USPS_LABEL_APIS,
  USPS_LABEL_TEST_APIS,
  USPS_INTL_ID_TO_TEST_API,
  WeightUnit
} from '../../constants';
import { roundToTwoDecimal, getPoundAndOunces } from '../../utils/helpers';
import convertlib from 'convert-units';
import axios from 'axios';
import fastParser from 'fast-xml-parser';
import util from 'util';
import _ from 'lodash';
import dayjs from 'dayjs';
import {
  FormData,
  IShipping,
  LabelData,
  ShippingRate
} from '../../../types/record.types';
import { Rate } from '../../../types/carriers/carrier';
import {
  ImageParameters,
  UspsDomesticLabelReqBody,
  UspsDomesticLabelResponse,
  UspsDomesticRequestObj,
  USPSIntlPMExpressLabelReqBody,
  USPSIntlPMExpressLabelResponse,
  UspsIntlPMExpressRequestObj,
  UspsIntlPriorityMailLabelRequestBody,
  UspsIntlPriorityMailLabelResponse,
  UspsIntlPriorityMailRequestObj,
  UspsIntlShippingItem
} from '../../../types/carriers/usps';
import { logger } from '../../logger';
import { ApiFinalResult } from '../../../types/carriers/api';

export const buildUspsLabelReqBody = (
  shipment: IShipping,
  userId: string,
  rate: Rate,
  isInternational: boolean
):
  | UspsDomesticLabelReqBody
  | USPSIntlPMExpressLabelReqBody
  | UspsIntlPriorityMailLabelRequestBody
  | undefined => {
  if (!isInternational) {
    return buildUspsDomesticLabelReqBody(shipment, userId, rate);
  } else {
    if (rate.serviceId === USPS_INTL_SERVICE_IDS.EXPRESS_INTL) {
      return buildUspsIntlPMExpressLabelReqBody(shipment, userId, rate.isTest);
    } else if (rate.serviceId === USPS_INTL_SERVICE_IDS.PRIORITY_INTL) {
      return buildUspsIntlPriorityMailLabelReqBody(
        shipment,
        userId,
        rate.isTest
      );
    } else {
      return undefined;
    }
  }
};

const buildUspsIntlPriorityMailLabelReqBody = (
  shipment: IShipping,
  userId: string,
  isTest: boolean
): UspsIntlPriorityMailLabelRequestBody => {
  const sender = shipment.sender!;
  const senderNames = sender.name!.split(' ');
  const recipient = shipment.toAddress;
  const recipientNames = recipient.name!.split(' ');
  const packageInfo = shipment.packageInfo!;
  const dimentions = packageInfo.dimentions!;

  const [packagePound, packageOunce] = getPoundAndOunces(
    packageInfo.weight.value,
    packageInfo.weight.unitOfMeasure
  );

  const imageParameters: ImageParameters = {
    ImageParameter: '4x6LABELP'
  };

  const requestObj: UspsIntlPriorityMailRequestObj = {
    '@_USERID': userId,
    Option: {},
    Revision: '2',
    ImageParameters: imageParameters,
    FromFirstName: senderNames[0],
    FromMiddleInitial: senderNames.length > 2 ? senderNames[1] : undefined,
    FromLastName: senderNames[senderNames.length - 1],
    FromFirm: sender.company || '',
    FromAddress1: sender.street2,
    FromAddress2: sender.street1,
    FromCity: sender.city,
    FromState: sender.state!,
    FromZip5: sender.zip!,
    FromPhone: sender.phone!,
    ToFirstName: recipientNames[0],
    ToLastName: recipientNames[1],
    ToFirm: recipient.company || '',
    ToAddress1: recipient.street2,
    ToAddress2: recipient.street1,
    ToCity: recipient.city,
    ToProvince: recipient.state,
    ToCountry: COUNTRY_NAMES[recipient.country],
    ToPostalCode: recipient.zip!,
    ToPOBoxFlag: 'N',
    ShippingContents: {
      ItemDetail: shipment.customItems!.map((ele) => {
        const [pound, ounce] = getPoundAndOunces(
          ele.itemWeight,
          ele.itemWeightUnit
        );

        const item: UspsIntlShippingItem = {
          Description: ele.itemTitle,
          Quantity: ele.quantity,
          Value: roundToTwoDecimal(ele.itemValue),
          NetPounds: pound,
          NetOunces: ounce,
          HSTariffNumber: ele.hsTariffNumber,
          CountryOfOrigin: COUNTRY_NAMES[ele.country!].toUpperCase()
        };
        return item;
      })
    },
    GrossPounds: packagePound,
    GrossOunces: packageOunce,
    ContentType: shipment.customDeclaration!.typeOfContent.toUpperCase(),
    ContentTypeOther:
      shipment.customDeclaration!.typeOfContent === TYPE_OF_CONTENT.OTHER
        ? shipment.customDeclaration!.typeOfContentOther
        : undefined,
    Agreement: 'Y',
    Comments: shipment.customDeclaration?.notes,
    LicenseNumber: shipment.customDeclaration?.license,
    CertificateNumber: shipment.customDeclaration?.certificate,
    InvoiceNumber: shipment.customDeclaration?.invoice,
    ImageType: 'PDF',
    ImageLayout: 'ONEPERFILE',
    CustomerRefNo: '',
    CustomerRefNo2: '',
    LabelDate: dayjs().format('MM/DD/YYYY'),
    HoldForManifest: 'N',
    Length: roundToTwoDecimal(
      convertlib(dimentions.length)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Width: roundToTwoDecimal(
      convertlib(dimentions.width)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Height: roundToTwoDecimal(
      convertlib(dimentions.height)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Girth: {},
    ImportersReferenceType: shipment.customDeclaration?.taxIdType,
    Machinable: false,
    DestinationRateIndicator: 'N'
  };

  if (isTest) {
    const request: UspsIntlPriorityMailLabelRequestBody = {
      eVSPriorityMailIntlCertifyRequest: requestObj
    };
    return request;
  } else {
    const request: UspsIntlPriorityMailLabelRequestBody = {
      eVSPriorityMailIntlRequest: requestObj
    };
    return request;
  }
};

const buildUspsIntlPMExpressLabelReqBody = (
  shipment: IShipping,
  userId: string,
  isTest: boolean
): USPSIntlPMExpressLabelReqBody => {
  const sender = shipment.sender!;
  const senderNames = sender.name!.split(' ');
  const recipient = shipment.toAddress;
  const recipientNames = recipient.name!.split(' ');
  const packageInfo = shipment.packageInfo!;
  const dimentions = packageInfo.dimentions!;

  const [packagePound, packageOunce] = getPoundAndOunces(
    packageInfo.weight.value,
    packageInfo.weight.unitOfMeasure
  );

  const imageParameters: ImageParameters = {
    ImageParameter: '4x6LABELP'
  };

  const requestObj: UspsIntlPMExpressRequestObj = {
    '@_USERID': userId,
    Option: {},
    Revision: '2',
    ImageParameters: imageParameters,
    FromFirstName: senderNames[0],
    FromMiddleInitial: senderNames.length > 2 ? senderNames[1] : undefined,
    FromLastName: senderNames[senderNames.length - 1],
    FromFirm: sender.company || '',
    FromAddress1: sender.street2,
    FromAddress2: sender.street1,
    FromCity: sender.city,
    FromState: sender.state!,
    FromZip5: sender.zip!,
    FromPhone: sender.phone!,
    ToFirstName: recipientNames[0],
    ToLastName: recipientNames[1],
    ToFirm: recipient.company || '',
    ToAddress1: recipient.street2,
    ToAddress2: recipient.street1,
    ToCity: recipient.city,
    ToProvince: recipient.state,
    ToCountry: COUNTRY_NAMES[recipient.country],
    ToPostalCode: recipient.zip!,
    ToPOBoxFlag: 'N',
    ShippingContents: {
      ItemDetail: shipment.customItems!.map((ele) => {
        const [pound, ounce] = getPoundAndOunces(
          ele.itemWeight,
          ele.itemWeightUnit
        );
        const item: UspsIntlShippingItem = {
          Description: ele.itemTitle,
          Quantity: ele.quantity,
          Value: roundToTwoDecimal(ele.itemValue),
          NetPounds: pound,
          NetOunces: ounce,
          HSTariffNumber: ele.hsTariffNumber,
          CountryOfOrigin: COUNTRY_NAMES[ele.country!].toUpperCase()
        };
        return item;
      })
    },
    GrossPounds: packagePound,
    GrossOunces: packageOunce,
    ContentType: shipment.customDeclaration!.typeOfContent.toUpperCase(),
    ContentTypeOther:
      shipment.customDeclaration!.typeOfContent === TYPE_OF_CONTENT.OTHER
        ? shipment.customDeclaration!.typeOfContentOther
        : undefined,
    Agreement: 'Y',
    Comments: shipment.customDeclaration?.notes,
    LicenseNumber: shipment.customDeclaration?.license,
    CertificateNumber: shipment.customDeclaration?.certificate,
    InvoiceNumber: shipment.customDeclaration?.invoice,
    ImageType: 'PDF',
    ImageLayout: 'ONEPERFILE',
    CustomerRefNo: '',
    CustomerRefNo2: '',
    LabelDate: dayjs().format('MM/DD/YYYY'),
    HoldForManifest: 'N',
    Length: roundToTwoDecimal(
      convertlib(dimentions.length)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Width: roundToTwoDecimal(
      convertlib(dimentions.width)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Height: roundToTwoDecimal(
      convertlib(dimentions.height)
        .from(dimentions.unitOfMeasure)
        .to(DistanceUnit.IN)
    ),
    Girth: {},
    LabelTime: dayjs().format('HH:mm:ss'),
    ImportersReferenceType: shipment.customDeclaration?.taxIdType,
    Machinable: false,
    DestinationRateIndicator: 'N'
  };

  if (isTest) {
    const request: USPSIntlPMExpressLabelReqBody = {
      eVSExpressMailIntlCertifyRequest: requestObj
    };
    return request;
  } else {
    const request: USPSIntlPMExpressLabelReqBody = {
      eVSExpressMailIntlRequest: requestObj
    };
    return request;
  }
};

const buildUspsDomesticLabelReqBody = (
  shipment: IShipping,
  userId: string,
  rate: Rate
): UspsDomesticLabelReqBody => {
  const sender = shipment.sender!;
  const recipient = shipment.toAddress;
  const packageInfo = shipment.packageInfo!;
  const dimentions = packageInfo.dimentions!;

  const imageParameters: ImageParameters = {
    ImageParameter: '4x6LABELP',
    XCoordinate: 0,
    YCoordinate: 900
  };

  const requestObj: UspsDomesticRequestObj = {
    '@_USERID': userId,
    Option: '',
    Revision: '',
    ImageParameters: imageParameters,
    FromName: _.escape(sender.name),
    FromFirm: sender.company ? _.escape(sender.company) : '',
    FromAddress1: sender.street2 ? sender.street2 : '',
    FromAddress2: sender.street1,
    FromCity: sender.city,
    FromState: sender.state!,
    FromZip5: sender.zip!.split('-')[0],
    FromZip4: '',
    FromPhone: sender.phone ? sender.phone : '',
    AllowNonCleansedOriginAddr: true,
    ToName: _.escape(recipient.name),
    ToFirm: recipient.company ? _.escape(recipient.company) : '',
    ToAddress1: recipient.street2 ? recipient.street2 : '',
    ToAddress2: recipient.street1,
    ToCity: recipient.city,
    ToState: recipient.state!,
    ToZip5: recipient.zip!.split('-')[0],
    ToZip4: '',
    ToPhone: recipient.phone ? recipient.phone : '',
    AllowNonCleansedDestAddr: false, // TODO: programable set this value
    WeightInOunces: roundToTwoDecimal(
      convertlib(packageInfo.weight.value)
        .from(packageInfo.weight.unitOfMeasure)
        .to(WeightUnit.OZ)
    ),
    ServiceType: rate.serviceId,
    Container: 'RECTANGULAR',
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
    Machinable: {},
    CustomerRefNo: '', // TODO: consider how to use these two ref
    CustomerRefNo2: '',
    ExtraServices: {
      ExtraService: []
    },
    ReceiptOption: 'None',
    ImageType: 'PDF',
    HoldForManifest: 'Y',
    PrintCustomerRefNo: false,
    PrintCustomerRefNo2: false
  };

  if (rate.isTest) {
    const request: UspsDomesticLabelReqBody = {
      eVSCertifyRequest: requestObj
    };
    return request;
  } else {
    const request: UspsDomesticLabelReqBody = {
      eVSRequest: requestObj
    };
    return request;
  }
};

export const callUspsLabelEndpoint = async (
  apiUrl: string,
  serviceId: string,
  isInternational: boolean,
  labelReqBody:
    | UspsDomesticLabelReqBody
    | USPSIntlPMExpressLabelReqBody
    | UspsIntlPriorityMailLabelRequestBody,
  isTest: boolean
): Promise<ApiFinalResult> => {
  let api = isTest
    ? USPS_LABEL_TEST_APIS.US_DOMESTIC
    : USPS_LABEL_APIS.US_DOMESTIC;
  if (isInternational) {
    api = isTest
      ? USPS_INTL_ID_TO_TEST_API[serviceId]
      : USPS_INTL_ID_TO_API[serviceId];
  }

  const Parser = fastParser.j2xParser;
  const config = {
    params: {
      API: api,
      XML: new Parser({ ignoreAttributes: false }).parse(labelReqBody)
    }
  };

  const response = await axios.get(apiUrl, config);

  const options = {
    ignoreAttributes: false,
    allowBooleanAttributes: true,
    parseTrueNumberOnly: true
  };

  if (!isInternational) {
    const uspsLabelResponse = fastParser.parse(
      response.data,
      options
    ) as UspsDomesticLabelResponse;
    const responseObj = isTest
      ? uspsLabelResponse.eVSCertifyResponse
      : uspsLabelResponse.eVSResponse;
    if (responseObj) {
      const labelResponse: LabelData = {
        carrier: CARRIERS.USPS,
        service: serviceId,
        tracking: responseObj.BarcodeNumber,
        createdOn: new Date(),
        data: responseObj.LabelImage.replace(/\n/g, ''),
        format: 'PDF',
        encodeType: 'BASE64',
        isTest: isTest
      };

      let postage = responseObj.Postage;
      const extraServices = responseObj.ExtraServices?.ExtraService;
      if (extraServices) {
        if (Array.isArray(extraServices)) {
          extraServices.forEach((item) => {
            postage += item.Price;
          });
        } else {
          postage += extraServices.Price;
        }
      }
      const shippingRate = {
        rate: postage,
        currency: 'USD'
      };

      logger.info('Return data from USPS [Label] endpoint');
      return {
        labels: [labelResponse],
        forms: undefined,
        shippingRate: [shippingRate],
        labelUrlList: [],
        invoiceUrl: '',
        trackingNum: labelResponse.tracking,
        rOrderId: '',
        turnChanddelId: CARRIERS.USPS,
        turnServiceType: serviceId
      };
    } else {
      logger.error(util.inspect(uspsLabelResponse.Error));
      throw new Error(uspsLabelResponse.Error?.Description);
    }
  } else if (serviceId === USPS_INTL_SERVICE_IDS.EXPRESS_INTL) {
    const uspsLabelResponse = fastParser.parse(
      response.data,
      options
    ) as USPSIntlPMExpressLabelResponse;
    const responseObj = isTest
      ? uspsLabelResponse.eVSExpressMailIntlCertifyResponse
      : uspsLabelResponse.eVSExpressMailIntlResponse;
    if (responseObj) {
      const labelData: LabelData[] = [
        {
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.LabelImage.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        }
      ];

      if (responseObj.Page2Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page2Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }
      if (responseObj.Page3Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page3Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }
      if (responseObj.Page4Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page4Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }
      if (responseObj.Page5Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page5Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }
      if (responseObj.Page6Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page6Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }

      const shippingRate = {
        rate: responseObj.Postage,
        currency: 'USD'
      };

      return {
        labels: labelData,
        forms: undefined,
        shippingRate: [shippingRate],
        labelUrlList: [],
        invoiceUrl: '',
        trackingNum: labelData[0].tracking,
        rOrderId: '',
        turnChanddelId: CARRIERS.USPS,
        turnServiceType: serviceId
      };
    } else {
      logger.error(util.inspect(uspsLabelResponse.Error));
      throw new Error(uspsLabelResponse.Error?.Description);
    }
  } else if (serviceId === USPS_INTL_SERVICE_IDS.PRIORITY_INTL) {
    const uspsLabelResponse = fastParser.parse(
      response.data,
      options
    ) as UspsIntlPriorityMailLabelResponse;
    const responseObj = isTest
      ? uspsLabelResponse.eVSPriorityMailIntlCertifyResponse
      : uspsLabelResponse.eVSPriorityMailIntlResponse;
    if (responseObj) {
      const labelData: LabelData[] = [
        {
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.LabelImage.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        }
      ];

      if (responseObj.Page2Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page2Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }
      if (responseObj.Page3Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page3Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }
      if (responseObj.Page4Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page4Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }
      if (responseObj.Page5Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page5Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }
      if (responseObj.Page6Image.replace(/\n/g, '').length > 0) {
        labelData.push({
          carrier: CARRIERS.USPS,
          service: serviceId,
          tracking: responseObj.BarcodeNumber,
          createdOn: new Date(),
          data: responseObj.Page6Image.replace(/\n/g, ''),
          format: 'PDF',
          encodeType: 'BASE64',
          isTest
        });
      }

      const shippingRate = {
        rate: responseObj.Postage,
        currency: 'USD'
      };

      return {
        labels: labelData,
        forms: undefined,
        shippingRate: [shippingRate],
        labelUrlList: [],
        invoiceUrl: '',
        trackingNum: labelData[0].tracking,
        rOrderId: '',
        turnChanddelId: CARRIERS.USPS,
        turnServiceType: serviceId
      };
    } else {
      logger.error(util.inspect(uspsLabelResponse.Error));
      throw new Error(uspsLabelResponse.Error?.Description);
    }
  } else {
    logger.error(
      `${CARRIERS.USPS} Error: Unsupported USPS Service ${serviceId}`
    );
    throw new Error(`${CARRIERS.USPS} Error: Unsupported USPS Service`);
  }
};
