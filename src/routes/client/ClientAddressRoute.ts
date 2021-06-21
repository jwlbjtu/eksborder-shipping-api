import express from 'express';
import {
  createAddress,
  deleteAddress,
  getAddressesForUser,
  updateAddress
} from '../../controllers/client/address.controller';
import AuthHandler from '../../lib/auth/auth.handler';
import { USER_ROLES } from '../../lib/constants';
import {
  createAddressValidator,
  deleteAddressValidator,
  updateAddressValidator
} from '../validators/client/address.validators';

class ClientAddressRoute {
  public path = '/clientAddress';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.get(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      getAddressesForUser
    );

    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      createAddressValidator,
      createAddress
    );

    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      updateAddressValidator,
      updateAddress
    );

    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      deleteAddressValidator,
      deleteAddress
    );
  }
}

export default ClientAddressRoute;
