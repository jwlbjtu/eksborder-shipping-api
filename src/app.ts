import express, {Application} from 'express';
import IIterateParams from "./interfaces/IIterateParams.interface";
import mongoose from 'mongoose';
import './lib/env';

mongoose.Promise = global.Promise;

interface IAppInit {
    port: number;
    middleWares: any;
    controllers: any;
}

class App {
    public app: Application;
    public port: number;

    constructor(appInit: IAppInit) {
        this.app = express();
        this.port = appInit.port;

        this.middlewares(appInit.middleWares);
        this.routes(appInit.controllers);
        // this.assets();
        // this.template();


        this.connect();

    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the http://localhost:${this.port}`)
        })
    }

    private middlewares(middleWares: IIterateParams) {
        middleWares.forEach(middleWare => {
            this.app.use(middleWare);
        });
        // @ts-ignore
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
        controllers.forEach(controller => {
            this.app.use(process.env.URL_PREFIX+'/', controller.router)
        })
    }

    private async connect() {
        // Connect to the database
        let options: {
            useFindAndModify: boolean;
            useCreateIndex: boolean;
            useNewUrlParser: boolean,
            useUnifiedTopology: boolean,
            autoIndex?: boolean };
        options = {
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
            // @ts-ignore
            await mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true});
        } catch (error) {
            console.log(`!!!!! ERROR !!!!! ***** Could not connect to database! ***** !!!!! ERROR !!!!!\n\t${error.stack}`
            );
        }

    }
}

export default App
