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
        this.router.post(this.path + "/products/:type", this.authJwt.authenticateJWT, this.products);
        this.router.post(this.path + "/label/:type/:format", this.authJwt.authenticateJWT, this.label);
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

    public products: any = async (req: Request, res: Response) => {

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
                await this.initCF(req);
            }
            // @ts-ignore
            const cfFind = await this.cf.products(body);
            if (cfFind.hasOwnProperty('messages') || (cfFind.hasOwnProperty('status') && cfFind.status > 203)) {
                throw new Error(cfFind);
            }
            LRes.resOk(res, cfFind);

        } catch (err) {
            LRes.resErr(res, 401, err);
        }
    };

    public label: any = async (req: Request, res: Response) => {
        const body = req.body;
        const _type: string | null = req.params.type || null;
        const _format: string | null = req.params.format || null;

        if (_type !== null && _format !== null ) {

            try {
                if (this.cf == null) {
                    await this.initCF(req);
                }
                // @ts-ignore
                const cfLabel = await this.cf.label(body, _format);
                if (cfLabel.hasOwnProperty('messages') || (cfLabel.hasOwnProperty('status') && cfLabel.status > 203)) {
                    throw new Error(cfLabel);
                }
                LRes.resOk(res, cfLabel);

            } catch (err) {
                LRes.resErr(res, 401, err);
            }

        } else {
            LRes.resErr(res, 404, "not enough parameters");
        }

    }
}

export default ShippingController;
