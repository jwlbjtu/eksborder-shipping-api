import { ICarrierAPI } from '../../types/carriers/carrier';
import { IAccount } from '../../types/user.types';
import { CARRIERS } from '../constants';
import USPS3API from './3usps/3usps.api';
import DhlEcommerceAPI from './dhl_ecommerce/dhl_ecommerce.api';
import FedexAPI from './fedex/fedex.api';
import MaoYuanAPI from './maoyuan/mao_yuan.api';
import RuiYunAPI from './rui_yun/rui_yun.api';
import UpsAPI from './ups/ups.api';
import UspsAPI from './usps/usps.api';
import DpdAPI from './dpd/dpd.api';

class CarrierFactory {
  static getCarrierAPI(
    carrierAccount: IAccount,
    isTest: boolean,
    facility: string | undefined
  ): ICarrierAPI | undefined {
    switch (carrierAccount.carrier) {
      case CARRIERS.DHL_ECOMMERCE:
        return new DhlEcommerceAPI(isTest, carrierAccount, facility!);
      case CARRIERS.USPS:
        return new UspsAPI(isTest, carrierAccount);
      case CARRIERS.UPS:
        return new UpsAPI(isTest, carrierAccount);
      case CARRIERS.FEDEX:
        return new FedexAPI(isTest, carrierAccount);
      case CARRIERS.RUI_YUN:
        return new RuiYunAPI(isTest, carrierAccount);
      case CARRIERS.USPS3:
        return new USPS3API(isTest, carrierAccount);
      case CARRIERS.MAO_YUAN:
        return new MaoYuanAPI(isTest, carrierAccount);
      case CARRIERS.DPD:
        return new DpdAPI(isTest, carrierAccount);
      default:
        return undefined;
    }
  }
}

export default CarrierFactory;
