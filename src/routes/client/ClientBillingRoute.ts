import express from 'express';
import { fetchClientBillings } from '../../controllers/client/billing.controller';
import AuthHandler from '../../lib/auth/auth.handler';
import { USER_ROLES } from '../../lib/constants';

class ClientBillingRoute {
  public path = '/clientBillings';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.get(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      fetchClientBillings
    );
  }
}

export default ClientBillingRoute;
