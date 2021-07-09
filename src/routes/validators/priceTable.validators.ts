import { check } from 'express-validator';

export const fetchPriceTableValidator = [check('carrierId').notEmpty()];

export const createPriceTableValidator = [
  check(['name', 'carrier', 'service', 'condition', 'carrierRef']).notEmpty()
];

export const updatePriceTableValidator = [
  check([
    'id',
    'name',
    'carrier',
    'service',
    'condition',
    'carrierRef'
  ]).notEmpty()
];

export const deletePriceTableValidator = [check('id').notEmpty()];
