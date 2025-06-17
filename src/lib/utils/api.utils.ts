import {
  ApiFinalResult,
  ApiLabelHandlerRequest,
  ApiLableResponse,
  ApiPackage
} from '../../types/carriers/api';
import { RuiYunLabelRequest } from '../../types/carriers/rui_yun';
import { IService, ShipmentData } from '../../types/record.types';
import { IUser } from '../../types/user.types';
import { ruiYunOrderShipHandler } from '../carriers/rui_yun/rui_yun.label';
import { DistanceUnit, ShipmentStatus, WeightUnit } from '../constants';
import IdGenerator from './IdGenerator';
import { logger } from '../logger';
import { IAddress, ILabelResponse } from '../../types/shipping.types';
import { Cache } from '../cache';
import AsyncLock from 'async-lock';
import ShipmentSchema from '../../models/shipping.model';
import util from 'util';

const lock = new AsyncLock();

export const validatePackageList = (
  packageList: ApiPackage[]
): { status: boolean; message: string } => {
  let i = 0;
  for (const p of packageList) {
    const weight = p.weight;
    const length = p.length;
    const width = p.width;
    const height = p.height;
    const count = p.count;

    if (!weight) {
      return { status: false, message: `packageList[${i}].weight 不能为空` };
    }
    if (typeof weight !== 'number') {
      return { status: false, message: `packageList[${i}].weight 必须是数字` };
    }
    if (length && typeof length !== 'number') {
      return { status: false, message: `packageList[${i}].length 必须是数字` };
    }
    if (width && typeof width !== 'number') {
      return { status: false, message: `packageList[${i}].width 必须是数字` };
    }
    if (height && typeof height !== 'number') {
      return { status: false, message: `packageList[${i}].height 必须是数字` };
    }
    if (count && typeof count !== 'number') {
      return { status: false, message: `packageList[${i}].count 必须是数字` };
    }
    i += 1;
  }
  return { status: true, message: '' };
};

export const createShipmentData = async (
  data: ApiLabelHandlerRequest,
  user: IUser,
  carrier: string,
  service: IService,
  facility: string,
  sender: IAddress
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
    sender,
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
        dimensions: {
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
  logger.info('Request Body:');
  logger.info(util.inspect(reqBody, false, null, true));
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

export const checkOrderIdProcessed = async (
  orderId: string,
  clientCode: string,
  clientId: string
) => {
  const key = `orderId:${clientCode}:${orderId}`;
  const result = await new Promise<{
    flag: boolean;
    data: ILabelResponse | undefined;
  }>((resolve, reject) => {
    lock.acquire(
      key,
      async (done) => {
        try {
          // Check if key is in cache
          const exist = Cache.has(key);
          // console.log('exist in cache', exist);
          if (!exist) {
            // Search from database
            const shipment = await ShipmentSchema.findOne({
              orderId,
              userRef: clientId,
              status: ShipmentStatus.FULFILLED
            });
            // console.log('search from database', shipments);
            if (!shipment) {
              done(null, { flag: false });
            } else {
              const response: ILabelResponse = {
                timestamp: new Date(),
                carrier: shipment.turnChanddelId,
                service: shipment.turnServiceType!,
                channelId: shipment.carrierAccount!,
                labels: shipment.labels!.map((ele) => {
                  return {
                    createdOn: new Date(),
                    trackingId: ele.tracking,
                    labelData: ele.data,
                    encodeType: ele.encodeType,
                    format: ele.format
                  };
                }),
                labelUrlList: shipment.labelUrlList!,
                trackingNumber: shipment.trackingId
              };
              Cache.set(key, response, 172800); // Cache for 2 days (48 hours) 60 * 60 * 48 = 172800
              done(null, { flag: true, data: response });
            }
          } else {
            done(null, { flag: true, data: Cache.get(key) });
          }
        } catch (error) {
          done(error as Error, null);
        }
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result as any);
      }
    );
  });
  return result;
};

export const cacheLabelResponseForOrderId = async (
  orderId: string,
  clientCode: string,
  data: ILabelResponse
) => {
  const key = `orderId:${clientCode}:${orderId}`;
  const result = await new Promise<boolean>((resolve, reject) => {
    lock.acquire(
      key,
      async (done) => {
        try {
          Cache.set(key, data, 172800); // Cache for 2 days (48 hours) 60 * 60 * 48 = 172800
          done(null, true);
        } catch (error) {
          done(error as Error, null);
        }
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result as any);
      }
    );
  });
  return result;
};

export const removeLabelResponseForOrderId = async (
  orderId: string,
  clientCode: string
) => {
  const key = `orderId:${clientCode}:${orderId}`;
  const result = await new Promise<boolean>((resolve, reject) => {
    lock.acquire(
      key,
      async (done) => {
        try {
          const exist = Cache.has(key);
          if (exist) {
            Cache.del(key);
          }
          done(null, true);
        } catch (error) {
          done(error as Error, null);
        }
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result as any);
      }
    );
  });
  return result;
};
