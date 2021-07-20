import { ICarrierAPI } from '../../types/carriers/carrier';
import { IAccount } from '../../types/user.types';
import { CARRIERS } from '../constants';
import DhlEcommerceAPI from './dhl_ecommerce/dhl_ecommerce.api';
import FedexAPI from './fedex/fedex.api';
import UpsAPI from './ups/ups.api';
import UspsAPI from './usps/usps.api';

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
      default:
        return undefined;
    }
  }
}

export default CarrierFactory;
