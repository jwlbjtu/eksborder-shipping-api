import {
  ApiFinalResult,
  ApiLabelHandlerRequest,
  ApiLableResponse
} from '../../types/carriers/api';
import { RuiYunLabelRequest } from '../../types/carriers/rui_yun';
import { IService, ShipmentData } from '../../types/record.types';
import { IUser } from '../../types/user.types';
import { ruiYunOrderShipHandler } from '../carriers/rui_yun/rui_yun.label';
import { DistanceUnit, ShipmentStatus, WeightUnit } from '../constants';
import IdGenerator from './IdGenerator';
import { logger } from '../logger';

export const createShipmentData = async (
  data: ApiLabelHandlerRequest,
  user: IUser,
  carrier: string,
  service: IService,
  facility: string
): Promise<ShipmentData> => {
  const username = user.userName;
  const result: ShipmentData = {
    orderId: data.orderId
      ? data.orderId
      : `${username
          .substring(0, 2)
          .toUpperCase()}${await IdGenerator.generateId(username)}`,
    carrierAccount: data.channelId,
    carrier,
    service,
    facility,
    sender: data.sender
      ? {
          name: data.sender.name,
          company: data.sender.companyName,
          street1: data.sender.address1,
          street2: data.sender.address2,
          city: data.sender.city,
          state: data.sender.state,
          zip: data.sender.zipCode,
          country: data.sender.country,
          phone: data.sender.phone,
          email: data.sender.email,
          taxNumber: data.sender.taxNumber
        }
      : undefined,
    toAddress: {
      name: data.shipTo.name,
      company: data.shipTo.companyName,
      street1: data.shipTo.address1,
      street2: data.shipTo.address2,
      city: data.shipTo.city,
      state: data.shipTo.state,
      country: data.shipTo.country,
      zip: data.shipTo.zipCode,
      phone: data.shipTo.phone,
      email: data.shipTo.email,
      taxNumber: data.shipTo.taxNumber
    },
    signature: data.signature,
    description: data.description,
    referenceNumber: data.referenceNumber,
    specialRemarks: data.specialRemarks,
    fretaxdutyType: data.fretaxdutyType,
    taxdutyType: data.taxdutyType,
    shipmentOptions: {
      shipmentDate: new Date()
    },
    invoice: data.invoice,
    packageList: data.packageList.map((p) => {
      return {
        packageType: data.packageType,
        weight: { value: p.weight, unitOfMeasure: WeightUnit.LB },
        dimension: {
          length: p.length,
          width: p.width,
          height: p.height,
          unitOfMeasure: DistanceUnit.IN
        },
        count: p.count
      };
    }),
    status: ShipmentStatus.PENDING,
    manifested: false,
    userRef: user._id
  };
  return result;
};

export const createApiFailedResponse = (
  message: string,
  errors: any[] = []
): Partial<ApiLableResponse> => {
  return {
    result: false,
    message,
    errors
  };
};

export const callRuiYunLabelEndpoint = async (
  apiUrl: string,
  reqBody: RuiYunLabelRequest
): Promise<ApiFinalResult> => {
  logger.info('Calling RuiYun label endpoint');
  logger.info(apiUrl);
  const response = await ruiYunOrderShipHandler(reqBody, apiUrl);
  const resultFlag = response.return.result;
  if (resultFlag) {
    let orderResult = response.return.orderResult;
    if (Array.isArray(orderResult)) {
      orderResult = orderResult[0];
    }
    return {
      invoiceUrl: orderResult.invoiceUrl,
      labelUrlList: Array.isArray(orderResult.labeUrlList)
        ? orderResult.labeUrlList
        : [orderResult.labeUrlList],
      rOrderId: orderResult.rOrderId,
      trackingNum: orderResult.trackingNumCha,
      turnChanddelId: orderResult.turnChannelId,
      turnServiceType: orderResult.turnServiceType,
      labels: [],
      forms: [],
      shippingRate: []
    };
  } else {
    throw new Error(response.return.message);
  }
};
