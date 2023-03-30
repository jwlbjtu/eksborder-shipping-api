import { check } from 'express-validator';

export const fetchCustomServiceAccountsValidator = [
  check('carrierId').notEmpty()
];

export const createCustomServiceValidator = [
  check(['name', 'carrierId', 'services']).notEmpty()
];

export const updateCustomServiceValidator = [
  check(['_id', 'active', 'services']).notEmpty()
];

export const deleteCustomServiceValidator = [check('id').notEmpty()];
