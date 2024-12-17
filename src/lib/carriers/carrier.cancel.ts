import { IShipping } from '../../types/record.types';
import UserSchema from '../../models/user.model';
import { logger } from '../logger';
import { validateCarrierAccount } from '../validation';
import CarrierFactory from './carrier.factory';

export const cancelByCarrierAPI = async (
  record: IShipping
): Promise<boolean> => {
  logger.info(
    `Canceling shipment from carrier ${record.carrier} API for tracking: ${record.trackingId}`
  );
  // Get client user by userRef
  const user = await UserSchema.findById(record.userRef);
  if (!user) {
    logger.error(`User not found for id ${record.userRef}`);
    return false;
  }
  const checkValues = await validateCarrierAccount(record.carrierAccount, user);
  const account = checkValues.account;
  // Create API
  const api = CarrierFactory.getCarrierAPI(account, false, record.facility);
  if (!api) {
    logger.error(`Carrier API not found for ${record.carrier}`);
    return false;
  }
  await api.init();
  if (!api.cancelLabel) {
    logger.error(`Cancel label not supported for carrier ${record.carrier}`);
    return false;
  }
  if (!record.trackingId) {
    logger.error(`Tracking ID not found for record ${record._id}`);
    return false;
  }
  try {
    await api.cancelLabel(record.trackingId);
    return true;
  } catch (error) {
    logger.error(`Failed to cancel label for record ${record._id}`);
    logger.error((error as Error).message);
    return false;
  }
};
