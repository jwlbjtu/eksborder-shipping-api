import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import { csvFileUpload } from '../middleware/file-upload';
import {
  fetchAccountItenForRecord,
  fetchReconciliationRecords,
  searchAccountItem,
  uploadReconciliationCsv
} from '../controllers/users/accounting.controller';

class AccountingRoute {
  public path = '/accounting';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.get(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      fetchReconciliationRecords
    );

    this.router.get(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      fetchAccountItenForRecord
    );

    this.router.post(
      this.path + '/search/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      searchAccountItem
    );

    this.router.post(
      this.path + '/reconciliation_csv',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      csvFileUpload.single('reconciliation_csv'),
      uploadReconciliationCsv
    );
  }
}

export default AccountingRoute;
