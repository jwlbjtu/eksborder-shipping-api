import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import {
  createShippingLabel,
  GetLabelByShippingId,
  createManifest,
  downloadManifest
} from '../controllers/shipping/shipping.controller';

/**
 * @class ShippingRoute
 * @description Routes for shipping API serivces
 */
class ShippingRoute {
  public path = '/shipping';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    // Create Shipping Label
    this.router.post(
      this.path + '/label',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      createShippingLabel
    );

    // Get Shipping Label by ShippingId
    this.router.get(
      this.path + '/label/:shippingId',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      GetLabelByShippingId
    );

    // Create Manifest
    this.router.post(
      this.path + '/manifest',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      createManifest
    );

    // Get Manifest
    this.router.get(
      this.path + '/manifest/:carrierAccount/:facility/:requestId/:test',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      downloadManifest
    );

    // TODO: Add Carrier Rules
    // this.router.get(
    //   this.path + '/admin/rules',
    //   this.authJwt.authenticateJWT,
    //   this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
    //   this.rules
    // );

    // Get Carrier Products
    // this.router.post(
    //   this.path + '/admin/products',
    //   this.authJwt.authenticateJWT,
    //   this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
    //   this.products
    // );

    // Get Shipping Label from Carrier
    // this.router.get(
    //   this.path + '/label/:carrierAccount/:carrier/:shippingId',
    //   this.authJwt.authenticateJWT,
    //   this.authJwt.checkRole('customer'),
    //   this.getLabel
    // );
  }
}

export default ShippingRoute;
