import express from 'express';
import { searchBillingRecordForUser } from '../../controllers/client/billing.controller';
import AuthHandler from '../../lib/auth/auth.handler';
import { USER_ROLES } from '../../lib/constants';
import { searchBillingRecord } from '../../controllers/users/billing.controller';

class ClientBillingRoute {
  public path = '/clientBillings';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      searchBillingRecordForUser
    );
  }
}

export default ClientBillingRoute;
