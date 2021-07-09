import * as express from 'express';
import {
  fetchPriceTableAccounts,
  createPriceTableAccount,
  updatePriceTableAccount,
  uploadPriceTablePrice,
  deltePriceTableAccount
} from '../controllers/carrier/priceTable.controller';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import { csvFileUpload } from '../middleware/file-upload';
import {
  createPriceTableValidator,
  fetchPriceTableValidator,
  deletePriceTableValidator,
  updatePriceTableValidator
} from './validators/priceTable.validators';

class PriceTableRoute {
  public path = '/priceTable';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.get(
      this.path + '/:carrierId',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      fetchPriceTableValidator,
      fetchPriceTableAccounts
    );

    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      createPriceTableValidator,
      createPriceTableAccount
    );

    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      updatePriceTableValidator,
      updatePriceTableAccount
    );

    this.router.post(
      this.path + '/csv',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      csvFileUpload.single('price_csv'),
      uploadPriceTablePrice
    );

    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      deletePriceTableValidator,
      deltePriceTableAccount
    );
  }
}

export default PriceTableRoute;
