import App from './app';

import * as bodyParser from 'body-parser';
import cors from 'cors';
import loggerMiddleware from './middleware/logger';
import morgan from 'morgan';

import errorHandler from './middleware/errorHandler';
import UserRoute from './routes/UserRoute';
import AccountRoute from './routes/AccountRoute';
import BillingRoute from './routes/BillingRoute';
import APIRoute from './routes/ApiRoute';
import RecordRoute from './routes/RecordRoute';
import ShippingRoute from './routes/ShippingRoute';
import CarrierRoute from './routes/CarrierRoute';
import { logStream } from './lib/logger';
import ThirdPartyRoute from './routes/ThirdPartyRoute';
import ClientUserRoute from './routes/client/ClientUserRoute';
import PrintFormatRoute from './routes/client/PrintFormatRoute';
import PackageUnitsRoute from './routes/client/PackageUnitsRoute';
import ClientAddressRoute from './routes/client/ClientAddressRoute';
import ClientAccountsRoute from './routes/client/ClientCarrierRoute';
import ClientBillingRoute from './routes/client/ClientBillingRoute';

const app = new App({
  routes: [
    new UserRoute(),
    new AccountRoute(),
    new BillingRoute(),
    new APIRoute(),
    new RecordRoute(),
    new ShippingRoute(),
    new CarrierRoute(),
    new ThirdPartyRoute(),
    new ClientUserRoute(),
    new PrintFormatRoute(),
    new PackageUnitsRoute(),
    new ClientAddressRoute(),
    new ClientAccountsRoute(),
    new ClientBillingRoute()
  ],
  middleWares: [
    morgan('combined', { stream: logStream }),
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    loggerMiddleware,
    errorHandler,
    cors()
  ]
});

export default app.app;
