import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import {
  getAllCarriers,
  getCarrierById,
  createCarrier,
  updateCarrier,
  deleteCarrierById
} from '../controllers/carrier/carrier.controller';
import { USER_ROLES } from '../lib/constants';

class CarrierRoute {
  public path = '/carrier';
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
      getAllCarriers
    );

    this.router.get(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      getCarrierById
    );

    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      createCarrier
    );

    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      updateCarrier
    );

    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      deleteCarrierById
    );
  }
}

export default CarrierRoute;
