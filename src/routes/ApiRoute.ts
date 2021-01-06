import * as express from 'express';
import AuthHandler from '../lib/auth/auth.handler';
import {
  generateApiToken,
  deleteApiToken
} from '../controllers/users/api.controller';
import { USER_ROLES } from '../lib/constants';

class APIRoute {
  public path = '/api';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    // Create and Refresh user API Token
    this.router.get(
      this.path + '/refresh/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      generateApiToken
    );

    // Revoke user API Token
    this.router.get(
      this.path + '/revoke/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      deleteApiToken
    );
  }
}

export default APIRoute;
