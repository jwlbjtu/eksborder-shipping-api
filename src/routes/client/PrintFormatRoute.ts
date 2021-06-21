import express from 'express';
import { updatePrintFormat } from '../../controllers/client/printformat.controller';
import AuthHandler from '../../lib/auth/auth.handler';
import { USER_ROLES } from '../../lib/constants';
import { printFormatUpdateValidator } from '../validators/client/printformat.validator';

class PrintFormatRoute {
  public path = '/printFormat';
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
      printFormatUpdateValidator,
      updatePrintFormat
    );
  }
}

export default PrintFormatRoute;
