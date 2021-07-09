import express from 'express';
import {
  createManifests,
  getManifests,
  getManifestShipmentsForUser,
  getTrackingInfo,
  refreshManifest
} from '../controllers/carrier/manifest.controller';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import {
  createManifestsValidator,
  getManifestsValidator,
  getShipmentsForUserValidator,
  refreshManifestValidator,
  trackingValidator
} from './validators/manifest.validators';

class ManifestRoute {
  public path = '/manifest';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.get(
      this.path + '/shipments',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      getShipmentsForUserValidator,
      getManifestShipmentsForUser
    );

    this.router.get(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      getManifestsValidator,
      getManifests
    );

    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      createManifestsValidator,
      createManifests
    );

    this.router.get(
      this.path + '/refresh_manifest',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      refreshManifestValidator,
      refreshManifest
    );

    this.router.get(
      this.path + '/tracking',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      trackingValidator,
      getTrackingInfo
    );
  }
}

export default ManifestRoute;
