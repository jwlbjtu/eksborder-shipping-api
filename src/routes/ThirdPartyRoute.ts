import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import {
  createThirdPartyValidator,
  deleteThirdPartyValidator,
  fetchThirdparyAccountsValidator,
  updateThirdPartyValidator
} from './validators/thirdparty.validators';
import { csvFileUpload } from '../middleware/file-upload';
import {
  createThirdPartyAccount,
  delteThridPartyAccount,
  fetchThirdpartyAccounts,
  updateThirdPartyAccount,
  uploadThirdpartyPrice,
  uploadThirdpartyPriceZoneMap
} from '../controllers/carrier/thirdparty.controller';

class ThirdPartyRoute {
  public path = '/thirdparties';
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
      fetchThirdparyAccountsValidator,
      fetchThirdpartyAccounts
    );

    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      createThirdPartyValidator,
      createThirdPartyAccount
    );

    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      updateThirdPartyValidator,
      updateThirdPartyAccount
    );

    this.router.post(
      this.path + '/csv',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      csvFileUpload.single('price_csv'),
      uploadThirdpartyPrice
    );

    this.router.post(
      this.path + '/zone',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      csvFileUpload.single('zone_csv'),
      uploadThirdpartyPriceZoneMap
    );

    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      deleteThirdPartyValidator,
      delteThridPartyAccount
    );
  }
}

export default ThirdPartyRoute;
