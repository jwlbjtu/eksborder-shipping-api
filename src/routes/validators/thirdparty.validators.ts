import { check } from 'express-validator';

export const fetchThirdparyAccountsValidator = [check('carrierId').notEmpty()];

export const createThirdPartyValidator = [
  check([
    'name',
    'carrier',
    'accountNum',
    'service',
    'condition',
    'carrierRef'
  ]).notEmpty()
];

export const updateThirdPartyValidator = [
  check([
    'id',
    'name',
    'carrier',
    'accountNum',
    'service',
    'condition',
    'carrierRef'
  ]).notEmpty()
];

export const deleteThirdPartyValidator = [check('id').notEmpty()];
