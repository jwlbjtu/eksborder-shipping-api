import express, { Application } from 'express';
import IIterateParams from './interfaces/IIterateParams.interface';
import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

interface IAppInit {
  middleWares: any;
  controllers: any;
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
    this.routes(appInit.controllers);
    // this.assets();
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

  // private assets() {
  //     this.app.use(express.static('public'))
  //     this.app.use(express.static('views'))
  // }
  //
  // private template() {
  //     this.app.set('view engine', 'pug')
  // }

  private routes(controllers: IIterateParams) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
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
      console.log('Connect to Database!');
    } catch (error) {
      console.log(
        `!!!!! ERROR !!!!! ***** Could not connect to database! ***** !!!!! ERROR !!!!!\n\t${error.stack}`
      );
    }
  }
}

export default App;
