import * as express from 'express';
import AuthHandler from '../lib/auth/auth.handler';
import {
  getUserBillingRecords,
  createBillingRecord,
  searchBillingRecord
} from '../controllers/users/billing.controller';
import { USER_ROLES } from '../lib/constants';

class BillingRoute {
  public path = '/billings';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    // Get Billing Records by User
    this.router.get(
      this.path + '/:userId',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      getUserBillingRecords
    );

    // Search Billing Record
    this.router.post(
      this.path + '/search',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      searchBillingRecord
    );

    // Create Billing Record
    this.router.post(
      this.path + '/:userId',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      createBillingRecord
    );
  }
}

export default BillingRoute;
