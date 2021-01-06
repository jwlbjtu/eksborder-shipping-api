import App from './app';

import * as bodyParser from 'body-parser';
import cors from 'cors';
import loggerMiddleware from './middleware/logger';

import errorHandler from './middleware/errorHandler';
import UserRoute from './routes/UserRoute';
import AccountRoute from './routes/AccountRoute';
import BillingRoute from './routes/BillingRoute';
import APIRoute from './routes/ApiRoute';
import RecordRoute from './routes/RecordRoute';
import ShippingRoute from './routes/ShippingRoute';
import CarrierRoute from './routes/CarrierRoute';

const app = new App({
  routes: [
    new UserRoute(),
    new AccountRoute(),
    new BillingRoute(),
    new APIRoute(),
    new RecordRoute(),
    new ShippingRoute(),
    new CarrierRoute()
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
