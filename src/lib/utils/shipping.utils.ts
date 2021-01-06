import { IAccount, IUser } from '../../types/user.types';
import CarrierFactory from '../carrier.factory';
import ICarrierAPI from '../carriers/ICarrierAPI.interface';
import {
  IProductRequest,
  IProduct,
  IProductResponse
} from '../../types/shipping.types';
import { DHL_FLAT_PRICES, DHL_ECOMMERCE } from '../constants';
import lresponseLib from '../lresponse.lib';
import { IAdminProductRequest } from '../../types/admin.types';
import { ICarrier } from '../../types/record.types';

class ShippingUtil {
  static initCF = async (
    account: IAccount,
    user: IUser
  ): Promise<ICarrierAPI> => {
    const api = CarrierFactory.getCarrierAPI(account.carrierRef.carrierName, {
      user,
      account
    });
    await api.auth();
    return api;
  };

  static getDhlEcommerceFlat = (weight: number, carrier: string) => {
    const flatPrice = DHL_FLAT_PRICES[Math.ceil(weight).toString()];
    const product: IProduct = {
      carrier: carrier,
      service: 'FLAT',
      productName: 'DHL eCommerce Flat Mail',
      rate: {
        amount: flatPrice,
        currency: 'USD',
        rateComponents: [
          {
            amount: flatPrice,
            description: 'Base Price'
          }
        ]
      }
    };
    return product;
  };

  static getProducts = async (
    account: IAccount,
    user: IUser,
    productRequest: IProductRequest,
    weight: number,
    carrier: string,
    service?: string
  ) => {
    let callAPI = false;
    let getFlat = false;

    if (carrier === DHL_ECOMMERCE) {
      if (service) {
        if (service === 'FLAT') {
          getFlat = true;
        } else {
          callAPI = true;
        }
      } else {
        callAPI = true;
        if (weight <= 16) {
          getFlat = true;
        }
      }
    } else {
      callAPI = true;
    }

    let productResponse: IProductResponse | undefined = undefined;

    if (callAPI) {
      // Check price from Carrier Product Finder
      const api = await ShippingUtil.initCF(account, user); // TODO: refine carrier factory auth logic
      const response = await api.products(productRequest);

      if (response.hasOwnProperty('status') && response.status > 203) {
        return response;
      }

      productResponse = response;
    }

    if (getFlat) {
      if (weight > 16)
        return lresponseLib.getError(500, 'FLAT Mail cannot more than 16 oz');

      const product = ShippingUtil.getDhlEcommerceFlat(weight, carrier);

      if (!productResponse) {
        productResponse = { ...productRequest };
      }

      if (!productResponse.products) productResponse.products = [];

      productResponse.products.push(product);
    }

    return productResponse;
  };

  static buildIAccountForAdmin = (
    carrierRef: ICarrier,
    userRef: IUser,
    pickup?: string,
    distributionCenter?: string
  ) => {
    // @ts-expect-error: ignore
    const account: IAccount = {
      accountName: 'admin_account',
      billingType: 'amount',
      fee: 0,
      carrierRef,
      userRef,
      isActive: true
    };
    return account;
  };

  static buildIProductRequestForAdmin = (data: IAdminProductRequest) => {
    const result: IProductRequest = {
      ...data,
      carrierAccount: 'admin'
    };
    return result;
  };
}

export default ShippingUtil;
