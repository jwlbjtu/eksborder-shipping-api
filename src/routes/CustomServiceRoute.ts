import * as express from 'express';
import {
  createCustomServiceAccount,
  deleteCustomServiceAccount,
  fetchCustomServiceAccounts,
  updateCustomServiceAccount
} from '../controllers/carrier/customService.controller';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import {
  createCustomServiceValidator,
  deleteCustomServiceValidator,
  fetchCustomServiceAccountsValidator,
  updateCustomServiceValidator
} from './validators/customService.validators';

class CustomServiceRoute {
  public path = '/customService';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.get(
      this.path + '/:carrierId',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      fetchCustomServiceAccountsValidator,
      fetchCustomServiceAccounts
    );

    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      createCustomServiceValidator,
      createCustomServiceAccount
    );

    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      updateCustomServiceValidator,
      updateCustomServiceAccount
    );

    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      deleteCustomServiceValidator,
      deleteCustomServiceAccount
    );
  }
}

export default CustomServiceRoute;
