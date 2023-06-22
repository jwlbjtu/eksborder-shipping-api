import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import { getRateInfo } from '../controllers/shipping/rate.controller';

class RateRoute {
  public path = '/rate';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    // Get Rate Info
    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      getRateInfo
    );
  }
}

export default RateRoute;
