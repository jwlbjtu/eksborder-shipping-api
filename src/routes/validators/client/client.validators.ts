import { check } from 'express-validator';

export const clientLoginValidator = [
  check('email').not().isEmpty().normalizeEmail().isEmail().trim(),
  check('password').not().isEmpty()
];

export const clientUpdateValidator = [
  check('id').not().isEmpty(),
  check('firstName').not().isEmpty(),
  check('lastName').not().isEmpty(),
  check('companyName').not().isEmpty(),
  check('countryCode').not().isEmpty(),
  check('phone').not().isEmpty(),
  check('password').not().isEmpty()
];
