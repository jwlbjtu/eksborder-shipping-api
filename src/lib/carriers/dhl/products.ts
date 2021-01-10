import {
  IDHLeCommercePackageDetail,
  IDHLeCommerceProduct,
  IDHLeCommerceProductRequest,
  IDHLeCommerceProductResponse
} from '../../../types/carriers/dhl.ecommerce';
import { IDHLeCommerceError, IError } from '../../../types/error.types';
import {
  IProduct,
  IProductRequest,
  IProductResponse
} from '../../../types/shipping.types';
import AxiosapiLib from '../../axiosapi.lib';
import { saveLog } from '../../../lib/log.handler';
import { IAccount, IUser } from '../../../types/user.types';
import { IFacility } from '../../../types/record.types';
import convertToDHLAddress from './common';
import uniqid from 'uniqid';

export const callDHLeComProductsAPI = async (
  api_url: string,
  prodReqBody: IDHLeCommerceProductRequest,
  headers: any,
  props: { account: IAccount; user: IUser },
  data: IProductRequest
): Promise<any> => {
  try {
    const response = await AxiosapiLib.doCall(
      'post',
      api_url + '/shipping/v4/products',
      prodReqBody,
      headers
    );
    await saveLog(
      'product',
      prodReqBody,
      response,
      props.account.id,
      props.account.userRef.id
    );

    if (response.hasOwnProperty('status') && response.status > 203) {
      console.log('Failed to call DHL eCommerce [Product Finder] endpoint');
      const dhlError: IDHLeCommerceError = response.data;
      const prodError: IError = {
        status: response.status,
        title: dhlError.title,
        carrier: data.carrier,
        error: dhlError.invalidParams
      };
      return prodError;
    }

    const dhlProdResponse: IDHLeCommerceProductResponse = response;
    const prodResponse: IProductResponse = {
      ...data,
      products: dhlProdResponse.products
        ? dhlProdResponse.products.map(
            (item: IDHLeCommerceProduct): IProduct => {
              return convertIDHLeCommerceProductToIProduct(item);
            }
          )
        : undefined
    };
    console.log('Return data from DHL eCommerce [Product Finder] endpoint');
    return prodResponse;
  } catch (error) {
    console.log(error);
    await saveLog(
      'product',
      prodReqBody,
      error,
      props.account.id,
      props.account.userRef.id,
      true
    );
    return error;
  }
};

const convertIDHLeCommerceProductToIProduct = (
  dhlProduct: IDHLeCommerceProduct
): IProduct => {
  let newRate = undefined;
  if (dhlProduct.rate) {
    newRate = {
      amount: dhlProduct.rate.amount,
      currency: dhlProduct.rate.currency,
      rateComponents: dhlProduct.rate.rateComponents.map((component) => {
        return {
          description: component.description,
          amount: component.amount
        };
      })
    };
  }

  let newMessages = undefined;
  if (dhlProduct.messages) {
    newMessages = dhlProduct.messages.map((message) => {
      return { messageText: message.messageText };
    });
  }

  return {
    service: dhlProduct.orderedProductId,
    productName: dhlProduct.productName,
    description: dhlProduct.description,
    trackingAvailable: dhlProduct.trackingAvailable,
    rate: newRate,
    estimatedDeliveryDate: dhlProduct.estimatedDeliveryDate,
    messages: newMessages
  };
};

export const buildDHLProductReqBody = (
  data: IProductRequest,
  facilityObj: IFacility | undefined,
  account: IAccount
): IDHLeCommerceProductRequest => {
  const dhlPackageDetail: IDHLeCommercePackageDetail = {
    packageId: data.packageDetail.packageId || uniqid('EK'),
    packageDescription: data.packageDetail.packageDescription,
    weight: data.packageDetail.weight,
    dimension: data.packageDetail.dimension,
    billingReference1: data.packageDetail.billingReference1,
    billingReference2: data.packageDetail.billingReference2
  };

  const prodReqBody: IDHLeCommerceProductRequest = {
    // @ts-expect-error: ignore
    pickup: facilityObj?.pickup,
    // @ts-expect-error: ignore
    distributionCenter: facilityObj?.facility,
    orderedProductId: data.service,
    consigneeAddress: convertToDHLAddress(data.toAddress),
    returnAddress: convertToDHLAddress(account.carrierRef.returnAddress),
    packageDetail: dhlPackageDetail,
    rate: data.rate,
    estimatedDeliveryDate: data.estimatedDeliveryDate
  };

  return prodReqBody;
};
