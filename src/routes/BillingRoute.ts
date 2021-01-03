import * as express from 'express';
import AuthHandler from '../lib/auth/auth.handler';
import {
  getUserBillingRecords,
  createBillingRecord
} from '../controllers/users/billing.controller';

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
      //TODO   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      getUserBillingRecords
    );

    // Create Billing Record
    this.router.post(
      this.path + '/:userId',
      //TODO   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      createBillingRecord
    );
  }
}

export default BillingRoute;
