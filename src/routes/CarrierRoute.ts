import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import {
  getAllCarriers,
  getCarrierById,
  createCarrier,
  updateCarrier,
  deleteCarrierById
} from '../controllers/carrier/carrier.controller';

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
      //TODO: this.authJwt.authenticateJWT,
      //TODO: this.authJwt.checkRole('admin_super'),
      getAllCarriers
    );

    this.router.get(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      getCarrierById
    );

    this.router.post(
      this.path,
      //TODO this.authJwt.authenticateJWT,
      //TODO this.authJwt.checkRole('admin_super'),
      createCarrier
    );

    this.router.put(
      this.path,
      // TODO this.authJwt.authenticateJWT,
      // TODO this.authJwt.checkRole('admin_super'),
      updateCarrier
    );

    this.router.delete(
      this.path + '/:id',
      //TODO this.authJwt.authenticateJWT,
      //TODO this.authJwt.checkRole('admin_super'),
      deleteCarrierById
    );
  }
}

export default CarrierRoute;
