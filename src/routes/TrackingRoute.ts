import * as express from 'express';
import AuthController from '../lib/auth/auth.handler';
import { USER_ROLES } from '../lib/constants';
import { getTrackingInfo } from '../controllers/shipping/tracking.controller';

class TrackingRoute {
  public path = '/tracking';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    // Get Tracking Info
    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkSingleRole(USER_ROLES.API_USER),
      getTrackingInfo
    );
  }
}

export default TrackingRoute;
