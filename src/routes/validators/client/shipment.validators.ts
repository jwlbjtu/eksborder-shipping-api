import { check } from 'express-validator';
import { COUNTRIES_LIST } from '../../../lib/constants';

export const createShipmentValidator = [
  check([
    'sender.name',
    'sender.country',
    'sender.street1',
    'sender.city',
    'toAddress.name',
    'toAddress.country',
    'toAddress.street1',
    'toAddress.city'
  ]).notEmpty(),
  check(['sender.country', 'toAddress.country']).isIn(COUNTRIES_LIST)
];

export const shipmentRequestValidator = [check('id').notEmpty()];

export const csvImportValidator = [check(['map', 'name']).notEmpty()];
