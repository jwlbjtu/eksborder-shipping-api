import express from 'express';
import { fetchClientAccounts } from '../../controllers/client/account.controllers';
import AuthHandler from '../../lib/auth/auth.handler';
import { USER_ROLES } from '../../lib/constants';

class ClientAccountsRoute {
  public path = '/clientAccounts';
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
      fetchClientAccounts
    );
  }
}

export default ClientAccountsRoute;
