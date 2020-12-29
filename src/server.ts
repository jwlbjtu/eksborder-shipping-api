import App from './app';

import * as bodyParser from 'body-parser';
import cors from 'cors';
import loggerMiddleware from './middleware/logger';

import errorHandler from './middleware/errorHandler';
import UsersController from './controllers/users/users.controller';
import ShippingController from './controllers/shipping/shipping.controller';
import CarrierController from './controllers/carrier/carrier.controller';
import PickupController from './controllers/carrier/pickup.controller';
import FacilityController from './controllers/carrier/facility.controller';
import AccountController from './controllers/users/account.controller';
import APIController from './controllers/api/api.controller';

const app = new App({
  controllers: [
    new UsersController(),
    new ShippingController(),
    new CarrierController(),
    new PickupController(),
    new FacilityController(),
    new AccountController(),
    new APIController()
  ],
  middleWares: [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    loggerMiddleware,
    errorHandler,
    cors()
  ]
});

export default app.app;
