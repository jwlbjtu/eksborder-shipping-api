import { check } from 'express-validator';
import { COUNTRIES_LIST } from '../../../lib/constants';

export const createAddressValidator = [
  check(['name', 'street1', 'city', 'country']).notEmpty(),
  check('country').isIn(COUNTRIES_LIST)
];

export const updateAddressValidator = [
  check('id').notEmpty(),
  ...createAddressValidator
];

export const deleteAddressValidator = [check('id').notEmpty()];
