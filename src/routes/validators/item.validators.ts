import { check } from 'express-validator';
import {
  COUNTRIES_LIST,
  WEIGHT_UNIT_LIST,
  CURRENCY_LIST
} from '../../lib/constants';
export const createItemValidator = [
  check([
    'orderId',
    'itemTitle',
    'quantity',
    'itemWeight',
    'totalWeight',
    'itemWeightUnit',
    'itemValue',
    'totalValue',
    'itemValueCurrency',
    'country',
    'isCustom'
  ]).notEmpty(),
  check('itemWeightUnit').isIn(WEIGHT_UNIT_LIST),
  check('itemValueCurrency').isIn(CURRENCY_LIST),
  check('country').isIn(COUNTRIES_LIST)
];

export const updateOrderItemValidator = [
  check('id').notEmpty(),
  ...createItemValidator
];

export const deleteOrderItemValidator = [check(['id', 'isCustom']).notEmpty()];
