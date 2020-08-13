import * as express from "express";
import {NextFunction, Request, Response} from "express";
import LRes from "../../lib/lresponse.lib";
import AuthController from "../auth/auth.controller"

import CarrierFactory from "../../lib/carrier.factory";
import IControllerBase from "../../interfaces/IControllerBase.interface";
import ICarrierAPI from "../../lib/carriers/ICarrierAPI.interface";

class ShippingController implements IControllerBase, ICarrierAPI {
    public path = "/shipping";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();
    private cf: CarrierFactory | null = null;

    private carriersType: Array<string> = ['dhl', 'fedex', 'ups', 'usps'];

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.post(this.path + "/auth/:type", this.authJwt.authenticateJWT, this.auth);
        this.router.post(this.path + "/find/:type", this.authJwt.authenticateJWT, this.find);
    }

    public auth: any = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cfAuth = await this.initCF(req);
            LRes.resOk(res, cfAuth);
        } catch (err) {
            LRes.resErr(res, 401, err)
        }
    };

    private initCF: CarrierFactory | any = async (req: Request) => {
        const _type: string = req.params.type;
        if (_type !== undefined && _type.length > 0 && this.carriersType.includes(_type)) {
            this.cf = new CarrierFactory(_type);
            // @ts-ignore
            return  await this.cf.auth();;
        } else {
            throw Error("Bead type of carrier");
        }
    };

    public find: any = async (req: Request, res: Response) => {

        const body = req.body;

        if (!body.hasOwnProperty("pickup")) {
            // @ts-ignore
            body.pickup = req.user.pickupAccount;
        }
        if (!body.hasOwnProperty("distributionCenter")) {
            // @ts-ignore
            body.distributionCenter = req.user.facilityNumber;
        }

        try {
            if (this.cf == null) {
                await this.initCF(req)
            }
            // @ts-ignore
            const cfFind = await this.cf.find(body);
            if (cfFind.hasOwnProperty('messages')) {
                throw new Error(cfFind);
            }
            LRes.resOk(res, cfFind);

        } catch (err) {
            LRes.resErr(res, 401, err);
        }
    }
}

export default ShippingController;
