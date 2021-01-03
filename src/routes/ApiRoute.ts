import * as express from 'express';
import AuthHandler from '../lib/auth/auth.handler';
import {
  generateApiToken,
  deleteApiToken
} from '../controllers/users/api.controller';

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
      //TODO:   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      generateApiToken
    );

    // Revoke user API Token
    this.router.get(
      this.path + '/revoke/:id',
      //TODO:   this.authJwt.authenticateJWT,
      //TODO:   this.authJwt.checkRole('admin_super'),
      deleteApiToken
    );
  }
}

export default APIRoute;
