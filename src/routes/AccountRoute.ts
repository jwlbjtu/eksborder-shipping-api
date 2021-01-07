import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import {
  getAllClientCarrierAccounts,
  getClientCarrierAccountsByUser,
  getClientCarrierAccount,
  createClientCarrierAccount,
  updateClientCarrierAccount,
  deleteClientCarrierAccount
} from '../controllers/users/account.controller';
import { USER_ROLES } from '../lib/constants';

class AccountRoute {
  public path = '/account';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    // Get all client carrier accounts
    this.router.get(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      getAllClientCarrierAccounts
    );

    // Get Client Carrier Accounts for User
    this.router.get(
      this.path + '/:userId',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      getClientCarrierAccountsByUser
    );

    // // Get a Client Account
    // this.router.get(
    //   this.path + '/:accountName',
    //   this.authJwt.authenticateJWT,
    //   this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
    //   getClientCarrierAccount
    // );

    // Create Client Carrier Account
    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      createClientCarrierAccount
    );

    // Update Client Carrier Account
    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      updateClientCarrierAccount
    );

    // Delete Client Carrier Account
    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      deleteClientCarrierAccount
    );
  }
}

export default AccountRoute;
