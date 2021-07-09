import express from 'express';
import {
  createOrderItem,
  deleteOrderItem,
  updateOrderItem
} from '../controllers/client/item.controller';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import {
  createItemValidator,
  deleteOrderItemValidator,
  updateOrderItemValidator
} from './validators/item.validators';

class ItemRoute {
  public path = '/items';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      createItemValidator,
      createOrderItem
    );

    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      updateOrderItemValidator,
      updateOrderItem
    );

    this.router.delete(
      this.path + '/:id/:isCustom',
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      deleteOrderItemValidator,
      deleteOrderItem
    );
  }
}

export default ItemRoute;
