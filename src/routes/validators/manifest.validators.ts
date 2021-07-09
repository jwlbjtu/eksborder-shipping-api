import { body, check } from 'express-validator';
import { logger } from '../../lib/logger';

export const getShipmentsForUserValidator = [
  check(['date', 'carrierAccount']).notEmpty()
];

export const createManifestsValidator = [
  check(['carrierAccount', 'shipmentIds']).notEmpty(),
  body('shipmentIds').custom((value) => {
    if (value.length === 0) {
      logger.error('Tracking id numbers cannot be empty!');
      throw new Error('Tracking id numbers cannot be empty!');
    }
    return true;
  })
];

export const getManifestsValidator = [check(['date', 'carrierRef']).notEmpty()];
export const refreshManifestValidator = [check('manifestId').notEmpty()];
export const trackingValidator = [check('shipmentId').notEmpty()];
