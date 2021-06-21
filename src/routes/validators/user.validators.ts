import { check, body } from 'express-validator';
import { logger } from '../../lib/logger';
import User from '../../models/user.model';
import { REST_ERROR_CODE } from '../../lib/constants';
import validateLib from 'validator';

export const userPasswordResetValidator = [
  body('email').custom(async (value) => {
    const user = await User.findOne({ email: value });
    if (!user) {
      logger.error(`Email ${value} is not found`);
      throw new Error(REST_ERROR_CODE.EMAIL_NOT_FOUND);
    }
    return true;
  })
];

export const resetPasswordValidator = [
  check(['token', 'password', 'confirmPassword']).notEmpty(),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      logger.error('Password confirmation does not match password');
      throw new Error(REST_ERROR_CODE.PASSWORD_MISMATCH);
    }
    if (!validateLib.isStrongPassword(req.body.password)) {
      //throw new Error('Password is not strong enough');
    }
    return true;
  })
];
