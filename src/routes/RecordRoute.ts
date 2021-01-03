import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import { getShippingRecordsForClient } from '../controllers/users/record.controller';

class RecordRoute {
  public path = '/records';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    // Get all shipping recods for a client
    this.router.get(
      this.path + '/:userId',
      //TODO this.authJwt.authenticateJWT,
      //TODO this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      getShippingRecordsForClient
    );
  }
}

export default RecordRoute;
