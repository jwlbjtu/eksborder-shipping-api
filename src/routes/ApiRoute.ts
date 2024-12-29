import * as express from 'express';
import AuthHandler from '../lib/auth/auth.handler';
import {
  generateApiToken,
  deleteApiToken,
  apiLabelHandler,
  apiRateHandler,
  apiCancelHandler
} from '../controllers/users/api.controller';
import { USER_ROLES } from '../lib/constants';
import {
  apiCancelHandlerValidator,
  apiLabelHandlerValidator,
  apiRateHandlerValidator
} from './validators/api.validators';

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
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      generateApiToken
    );

    // Revoke user API Token
    this.router.get(
      this.path + '/revoke/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      deleteApiToken
    );

    // Shipping label API
    this.router.post(
      this.path + '/label',
      apiLabelHandlerValidator,
      apiLabelHandler
    );

    // Shipping rate API
    this.router.post(
      this.path + '/rate',
      apiRateHandlerValidator,
      apiRateHandler
    );

    // Shipping cancel API
    this.router.post(
      this.path + '/cancel',
      apiCancelHandlerValidator,
      apiCancelHandler
    );
  }
}

export default APIRoute;
