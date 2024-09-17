import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import {
  getShippingRecordsForClient,
  searchShippingRecordsForClient,
  updateShippingRecordStatus
} from '../controllers/users/record.controller';
import { USER_ROLES } from '../lib/constants';

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
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      getShippingRecordsForClient
    );

    // Search shipping records for a client
    this.router.post(
      this.path + '/search',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      searchShippingRecordsForClient
    );

    // Update shipping record status
    this.router.put(
      this.path + '/update',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      updateShippingRecordStatus
    );
  }
}

export default RecordRoute;
