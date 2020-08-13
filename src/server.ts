import App from './app';

import * as bodyParser from 'body-parser';
import cors from "cors";
import loggerMiddleware from './middleware/logger';

import HomeController from './controllers/home/home.controller';
import './lib/env';
import errorHandler from './middleware/errorHandler';
import UsersController from "./controllers/users/users.controller";
import ShippingController from "./controllers/shipping/shipping.controller";


let envPort: number = 5000;
if (process.env.PORT) {
    envPort = +process.env.PORT;
}

const app = new App({
    port: envPort,
    controllers: [
        new HomeController(),
        new UsersController(),
        new ShippingController()
    ],
    middleWares: [
        bodyParser.json(),
        bodyParser.urlencoded({ extended: true }),
        loggerMiddleware,
        errorHandler,
        cors()
    ]
})

app.listen();
