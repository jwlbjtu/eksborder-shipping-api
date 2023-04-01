import stream from 'stream';
import { IShipping } from '../../types/record.types';
import ShipmentSchema from '../../models/shipping.model';
import AccountSchema from '../../models/account.model';
import { IAccount, IUser } from '../../types/user.types';
import { logger } from '../logger';
import {
  checkCustomService,
  isShipmentInternational,
  validateShipment
} from '../carriers/carrier.helper';
import CarrierFactory from '../carriers/carrier.factory';
import { Rate } from '../../types/carriers/carrier';

class TransformShipmentToProduct extends stream.Transform {
  user: IUser;

  constructor(options = {}, user: IUser) {
    super({ ...options, objectMode: true });
    this.user = user;
  }

  _transform(chunk: IShipping, encoding: any, callback: any): void {
    this.createCarrierProduct(chunk)
      .then((data) => {
        if (data) {
          this.push({ shipment: chunk, ...data });
          callback();
        } else {
          this.push(data);
          callback();
        }
      })
      .catch((error) => {
        logger.error(error);
        this.push(undefined);
        callback();
      });
  }

  createCarrierProduct = async (
    chunk: IShipping
  ): Promise<{ rate: Rate; carrierAccount: IAccount } | undefined> => {
    try {
      const shipment = await ShipmentSchema.findOne({
        _id: chunk._id,
        userRef: this.user._id
      });
      if (!shipment) return undefined;
      const carrierAccount = await AccountSchema.findOne({
        accountId: shipment.carrierAccount,
        isActive: true,
        userRef: this.user._id
      });
      if (!carrierAccount) return undefined;

      // Check if Custom Service is Used
      let isCustomService = false;
      const checkResult = await checkCustomService(shipment, carrierAccount);
      if (checkResult) {
        if (typeof checkResult === 'string') {
          return undefined;
        }
        shipment.service!.name = checkResult.name;
        shipment.service!.key = checkResult.code;
        isCustomService = true;
      }

      const valiResult = validateShipment(
        shipment,
        carrierAccount,
        isCustomService
      );
      if (valiResult) return undefined;
      const api = CarrierFactory.getCarrierAPI(
        carrierAccount,
        false,
        shipment.facility
      );
      if (!api) return undefined;
      await api.init();
      // call carrierAPI to get price
      const result = await api.products(
        shipment,
        isShipmentInternational(shipment)
      );
      if (
        typeof result === 'string' ||
        (result.errors && result.errors.length > 0)
      )
        return undefined;
      const rate = result.rates[0];
      if (rate.rate && rate.currency) {
        return { rate, carrierAccount };
      } else {
        return undefined;
      }
    } catch (error) {
      logger.error(error);
      return undefined;
    }
  };
}

export default TransformShipmentToProduct;
