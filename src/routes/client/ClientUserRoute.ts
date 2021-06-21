import express from 'express';
import AuthHandler from '../../lib/auth/auth.handler';
import { USER_ROLES } from '../../lib/constants';
import {
  clientLoginValidator,
  clientUpdateValidator
} from '../validators/client/client.validators';
import {
  clientLogin,
  refreshClient,
  updateClientUser
} from '../../controllers/client/client.controller';

class ClientUserRoute {
  public path = '/clients';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    //Login Client User
    this.router.post(
      this.path + '/client_login',
      clientLoginValidator,
      clientLogin
    );
    // Update User
    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      clientUpdateValidator,
      updateClientUser
    );
    // Refresh User
    this.router.get(
      this.path + '/refresh',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      refreshClient
    );
    // Forgot Password Email
    // Reset Password
  }
}

export default ClientUserRoute;
