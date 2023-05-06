import { ICarrierAPI } from '../../types/carriers/carrier';
import { IAccount } from '../../types/user.types';
import { CARRIERS } from '../constants';
import DhlEcommerceAPI from './dhl_ecommerce/dhl_ecommerce.api';
import FedexAPI from './fedex/fedex.api';
import UpsAPI from './ups/ups.api';
import UspsAPI from './usps/usps.api';
import CarrierSchema from '../../models/carrier.model';
import FedexRestAPI from './fedex/rest/fedex.rest.api';

class CarrierFactory {
  static async getCarrierAPI(
    carrierAccount: IAccount,
    isTest: boolean,
    facility: string | undefined
  ): Promise<ICarrierAPI | undefined> {
    switch (carrierAccount.carrier) {
      case CARRIERS.DHL_ECOMMERCE:
        return new DhlEcommerceAPI(isTest, carrierAccount, facility!);
      case CARRIERS.USPS:
        return new UspsAPI(isTest, carrierAccount);
      case CARRIERS.UPS:
        return new UpsAPI(isTest, carrierAccount);
      case CARRIERS.FEDEX:
        const carrierData = await CarrierSchema.findOne({
          _id: carrierAccount.carrierRef
        });
        if (carrierData?.isNewAPI) {
          return new FedexRestAPI(isTest, carrierAccount);
        } else {
          return new FedexAPI(isTest, carrierAccount);
        }
      default:
        return undefined;
    }
  }
}

export default CarrierFactory;
