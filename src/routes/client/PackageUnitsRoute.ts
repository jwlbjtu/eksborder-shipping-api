import express from 'express';
import { updatePackageSettings } from '../../controllers/client/packageUnits.controller';
import AuthHandler from '../../lib/auth/auth.handler';
import { USER_ROLES } from '../../lib/constants';
import { updatePackageSettingsValidator } from '../validators/client/packageUnits.validator';

class PackageUnitsRoute {
  public path = '/packageUnit';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.put(
      this.path + '/update',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      updatePackageSettingsValidator,
      updatePackageSettings
    );
  }
}

export default PackageUnitsRoute;
