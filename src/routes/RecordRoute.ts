import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import {
  batchCancelShippingRecords,
  batchCancelSingleShippingRecord,
  batchRevertSingleShippingRecord,
  batchSearchShippingRecords,
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

    this.router.post(
      this.path + '/batch/search',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      batchSearchShippingRecords
    );

    this.router.post(
      this.path + '/batch/cancel',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      batchCancelShippingRecords
    );

    this.router.post(
      this.path + '/batch/singleRevert',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      batchRevertSingleShippingRecord
    );

    this.router.post(
      this.path + '/batch/singleCancel',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRoles([USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER]),
      batchCancelSingleShippingRecord
    );
  }
}

export default RecordRoute;
