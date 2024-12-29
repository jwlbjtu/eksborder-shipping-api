import express from 'express';
import { USER_ROLES } from '../../lib/constants';
import AuthHandler from '../../lib/auth/auth.handler';
import {
  cancelShipmentForUser,
  createShipment,
  getShipmentsForUser,
  getShippingRateForClient,
  getUserShippingRate,
  importCsvData,
  preloadCsvFile,
  purchaseLabel,
  searchShipmentsForUser,
  updateShipments
} from '../../controllers/client/shipment.controller';
import {
  createShipmentValidator,
  csvImportValidator,
  shipmentRequestValidator
} from '../validators/client/shipment.validators';
import { csvFileUpload } from '../../middleware/file-upload';

class ClientShipmentRoute {
  public path = '/clientShipment';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      searchShipmentsForUser
    );

    this.router.put(
      this.path + '/update',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      cancelShipmentForUser
    );

    // this.router.post(
    //   this.path,
    //   this.authJwt.authenticateJWT,
    //   this.authJwt.checkSingleRole(USER_ROLES.API_USER),
    //   createShipmentValidator,
    //   createShipment
    // );

    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      shipmentRequestValidator,
      updateShipments
    );

    this.router.post(
      this.path + '/label',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      shipmentRequestValidator,
      purchaseLabel
    );

    this.router.post(
      this.path + '/preload',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      csvFileUpload.single('csv_file'),
      preloadCsvFile
    );

    this.router.post(
      this.path + '/csv',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      csvImportValidator,
      importCsvData
    );

    this.router.post(
      this.path + '/rate',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      getUserShippingRate
    );

    this.router.post(
      this.path + '/rate/:userId',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.ADMIN_SUPER),
      getShippingRateForClient
    );
  }
}

export default ClientShipmentRoute;
