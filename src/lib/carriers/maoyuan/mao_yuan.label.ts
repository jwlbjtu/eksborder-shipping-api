import { ApiFinalResult } from '../../../types/carriers/api';
import { Rate } from '../../../types/carriers/carrier';
import {
  MaoYuanLabelPackageDocument,
  MaoYuanLabelRepFedex,
  MaoYuanLabelRepUps,
  maoYuanLabelReqBody,
  MaoYuanLabelReqData
} from '../../../types/carriers/mao_yuan';
import { IService, IShipping } from '../../../types/record.types';
import { DistanceUnit, WeightUnit } from '../../constants';
import { roundToTwoDecimal } from '../../utils/helpers';
import convertlib from 'convert-units';
import { logger } from '../../logger';
import axios from 'axios';
import util from 'util';

export const buildMaoYuanLabelReqBody = (
  shipmentData: IShipping,
  rate: Rate
): maoYuanLabelReqBody => {
  const maoYuanLabelReqData: MaoYuanLabelReqData = {
    orderTransactionId: shipmentData.orderId,
    shipperName: shipmentData.sender!.name!,
    shipperCompany: shipmentData.sender!.company || '',
    shipperTax: '',
    shipperExtension: '',
    shipperEmail: shipmentData.sender!.email || '',
    shipperPhone: shipmentData.sender!.phone!,
    shipperCountry: shipmentData.sender!.country,
    shipperAddrOne: shipmentData.sender!.street1,
    shipperAddrTwo: shipmentData.sender!.street2 || '',
    shipperAddrThree: '',
    shipperPostalCode: shipmentData.sender!.zip,
    shipperProvince: shipmentData.sender!.state!,
    shipperCity: shipmentData.sender!.city,
    isResidence: '0',
    recipientName: shipmentData.toAddress.name!,
    recipientCompany: shipmentData.toAddress.company || '',
    recipientTax: '',
    recipientPhone: shipmentData.toAddress.phone!,
    recipientExtension: '',
    recipientEmail: shipmentData.toAddress.email || '',
    recipientCountry: shipmentData.toAddress.country,
    recipientAddrOne: shipmentData.toAddress.street1,
    recipientAddrTwo: shipmentData.toAddress.street2 || '',
    recipientAddrThree: '',
    recipientPostalCode: shipmentData.toAddress.zip,
    recipientProvince: shipmentData.toAddress.state!,
    recipientCity: shipmentData.toAddress.city,
    isResidencetwo: '1',
    packing: 'YOUR_PACKAGING',
    paymentFedex: '',
    packingContent: shipmentData.packageList.map((p, index) => {
      const unitOfMeasure = p.weight.unitOfMeasure;
      const weight = p.weight.value;
      const maoYuanWeight = roundToTwoDecimal(
        convertlib(weight).from(unitOfMeasure).to(WeightUnit.LB)
      );
      const dimension = p.dimensions;
      const l = dimension?.length || 0;
      const w = dimension?.width || 0;
      const h = dimension?.height || 0;
      const dUnitOfMeasure = dimension?.unitOfMeasure;

      return {
        reference: `${shipmentData.orderId}-${index + 1}`,
        name: index + 1,
        weight: maoYuanWeight,
        unit: 'LB',
        long: l
          ? roundToTwoDecimal(
              convertlib(l).from(dUnitOfMeasure!).to(DistanceUnit.IN)
            )
          : 1,
        width: w
          ? roundToTwoDecimal(
              convertlib(w).from(dUnitOfMeasure!).to(DistanceUnit.IN)
            )
          : 1,
        height: h
          ? roundToTwoDecimal(
              convertlib(h).from(dUnitOfMeasure!).to(DistanceUnit.IN)
            )
          : 1,
        longunit: 'IN'
      };
    })
  };

  return {
    channelId: Number(rate.serviceId),
    row: maoYuanLabelReqData
  };
};

export const callMaoYuanLabelEndpoint = async (
  apiUrl: string,
  reqBody: maoYuanLabelReqBody,
  token: string,
  path: string,
  service: IService
): Promise<ApiFinalResult> => {
  logger.info('Calling MaoYuan label endpoint');
  logger.info(`${apiUrl}${path}`);
  const url = `${apiUrl}${path}`;
  try {
    const response = await axios.post(url, reqBody, {
      headers: {
        'Content-Type': 'application/json',
        token
      }
    });
    logger.info('Mao Yuan Label API Response:');
    logger.info(util.inspect(response.data, false, null, true));
    if (response.data.code === 1) {
      return processMaoYuanLabelResponse(response.data, service.name);
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const processMaoYuanLabelResponse = (
  response: MaoYuanLabelRepFedex,
  serviceName: string
): ApiFinalResult => {
  const [carrier] = serviceName.split(' ');
  let packDocs: MaoYuanLabelPackageDocument[] = [];
  response.data.list.forEach(
    (ele) => (packDocs = packDocs.concat(ele.packageDocuments))
  );
  const reuslt: ApiFinalResult = {
    invoiceUrl: '',
    labelUrlList: [],
    trackingNum: response.data.masterTrackingNumber,
    rOrderId: response.data.customerTransactionId,
    turnChanddelId: carrier,
    turnServiceType: serviceName,
    shippingRate: [
      { rate: response.data.actualAmount, currency: response.data.currency }
    ],
    forms: [],
    labels: packDocs.map((ele) => {
      return {
        carrier: carrier,
        service: serviceName,
        tracking: response.data.masterTrackingNumber,
        createdOn: new Date(),
        data: ele.encodedLabel,
        format: ele.docType,
        encodeType: ele.contentType || '--',
        isTest: false
      };
    })
  };
  logger.info('Mao Yuan FEDEX Label API Result:');
  logger.info(util.inspect(reuslt, false, null, true));
  return reuslt;
};

const processUpsResponse = (
  response: MaoYuanLabelRepUps,
  serviceName: string
): ApiFinalResult => {
  const [carrier] = serviceName.split(' ');
  let packDocs: MaoYuanLabelPackageDocument[] = [];
  response.data.list.forEach(
    (ele) => (packDocs = packDocs.concat(ele.packageDocuments))
  );
  const result: ApiFinalResult = {
    invoiceUrl: '',
    labelUrlList: [],
    trackingNum: response.data.masterTrackingNumber,
    rOrderId: '',
    turnChanddelId: carrier,
    turnServiceType: serviceName,
    shippingRate: [
      {
        rate: Number(response.data.actualAmount),
        currency: response.data.currency
      }
    ],
    forms: [],
    labels: packDocs.map((ele) => {
      return {
        carrier: carrier,
        service: serviceName,
        tracking: response.data.masterTrackingNumber,
        createdOn: new Date(),
        data: ele.encodedLabel,
        format: ele.docType,
        encodeType: ele.contentType || '--',
        isTest: false
      };
    })
  };
  logger.info('Mao Yuan UPS Label API Result:');
  logger.info(util.inspect(result, false, null, true));
  return result;
};
