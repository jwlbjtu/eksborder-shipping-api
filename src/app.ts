import express, { Application } from 'express';
import IIterateParams from './interfaces/IIterateParams.interface';
import mongoose from 'mongoose';
import path from 'path';
import { logger } from './lib/logger';
import ItemSchema from './models/item.model';
import CustomerItemSchema from './models/customItem.model';

mongoose.Promise = global.Promise;

interface IAppInit {
  middleWares: any;
  routes: any;
}

interface DBOptions {
  useFindAndModify: boolean;
  useCreateIndex: boolean;
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
  autoIndex?: boolean;
}

class App {
  public app: Application;

  constructor(appInit: IAppInit) {
    this.app = express();

    this.middlewares(appInit.middleWares);
    this.routes(appInit.routes);
    this.assets();
    // this.template();

    this.connect();
  }

  private middlewares(middleWares: IIterateParams) {
    middleWares.forEach((middleWare) => {
      this.app.use(middleWare);
    });
    // @ts-expect-error: ignore
    this.app.use((err, req, res, next) => {
      console.log(err);
    });
  }

  private assets() {
    this.app.use('/static', express.static(path.join('static')));
    this.app.use(
      '/static/images',
      express.static(path.join('static', 'images'))
    );
  }

  // private template() {
  //     this.app.set('view engine', 'pug')
  // }

  private routes(routes: IIterateParams) {
    routes.forEach((route) => {
      this.app.use('/', route.router);
    });
  }

  private async connect() {
    // Connect to the database
    const options: DBOptions = {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true
    };

    if (process.env.NODE_ENV == 'development') {
      options.autoIndex = false;
      mongoose.set('debug', process.env.NODE_ENV === 'development');
    }

    try {
      // @ts-expect-error: ignore
      await mongoose.connect(process.env.DB_CONNECTION, options);
      logger.info(await ItemSchema.countDocuments({}));
      logger.info(await CustomerItemSchema.countDocuments({}));
      console.log('Connect to Database!');
    } catch (error) {
      console.log(
        `!!!!! ERROR !!!!! ***** Could not connect to database! ***** !!!!! ERROR !!!!!\n\t${error.stack}`
      );
    }
  }
}

export default App;
