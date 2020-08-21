import * as express from "express";
import {NextFunction, Request, Response} from "express";
import LRes from "../../lib/lresponse.lib";
import AuthController from "../auth/auth.controller"

import CarrierFactory from "../../lib/carrier.factory";
import IControllerBase from "../../interfaces/IControllerBase.interface";
import ICarrierAPI from "../../lib/carriers/ICarrierAPI.interface";
import HelperLib from "../../lib/helper.lib";

class ShippingController implements IControllerBase, ICarrierAPI {
    public path = "/shipping";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();
    private cf: CarrierFactory | null = null;

    private carriersType: Array<string> = [];
    private account: Array<string> = [];

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.post(this.path + "/auth/:type", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.auth);
        this.router.post(this.path + "/products/:type", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.products);
        this.router.post(this.path + "/label/:type/:format", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.label);
        this.router.get(this.path + "/label/:type/:packageId/:dhlPackageId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getLabel);
        this.router.post(this.path + "/manifest/:type", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.manifest);
        this.router.get(this.path + "/manifest/:type/:requestId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getManifest);
    }

    public auth: any = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cfAuth = await this.initCF(req, req,);
            return LRes.resOk(res, cfAuth);
        } catch (err) {
            return LRes.resErr(res, 401, err)
        }
    };

    private initCF: CarrierFactory | any = async (req: Request, res: Response) => {
        const _type: string = req.params.type;
        this.carriersType = await HelperLib.getCarrierType();
        this.account = await HelperLib.getCurrentUserAccount(_type, req.user);
        // @ts-ignore
        if (_type !== undefined && _type.length > 0 && this.account !== null && _type == this.account.accountName && this.carriersType.includes(this.account.carrierRef.accountCode)) {
            // @ts-ignore
            this.cf = new CarrierFactory(this.account.carrierRef.accountCode, {user: req.user, account: this.account});
            // @ts-ignore
            return  await this.cf.auth();
        } else {
            return LRes.resErr(res, 401, "Bead type of carrier");
        }
    };

    public products: any = async (req: Request, res: Response) => {

        const body = req.body;

        try {
            if (this.cf == null) {
                await this.initCF(req, res);
            }
            // @ts-ignore
            const cfFind = await this.cf.products(body);
            if (cfFind.hasOwnProperty('messages') || (cfFind.hasOwnProperty('status') && cfFind.status > 203)) {
                return LRes.resErr(res, cfFind.status, cfFind.messages);
            }
            return LRes.resOk(res, cfFind);

        } catch (err) {
            return LRes.resErr(res, 401, err);
        }
    };

    public label: any = async (req: Request, res: Response) => {
        const body = req.body;
        const _type: string | null = req.params.type || null;
        const _format: string | null = req.params.format || null;

        if (_type !== null && _format !== null ) {

            try {
                if (this.cf == null) {
                    await this.initCF(req, res);
                }
                // @ts-ignore
                const cfLabel = await this.cf.label(body, _format);
                if (cfLabel.hasOwnProperty('messages') || (cfLabel.hasOwnProperty('status') && cfLabel.status > 203)) {
                    return LRes.resErr(res, cfLabel.status, cfLabel.messages);
                }
                return LRes.resOk(res, cfLabel);

            } catch (err) {
                return LRes.resErr(res, 401, err);
            }

        } else {
            return LRes.resErr(res, 404, "not enough parameters");
        }

    };

    public getLabel: any = async (req: Request, res: Response) => {
        const _packageId: string | null = req.params.packageId || null;
        const _dhlPackageId: string | null = req.params.dhlPackageId || null;

        if (_packageId !== null && _dhlPackageId !== null ) {

            try {
                if (this.cf == null) {
                    await this.initCF(req, res);
                }
                // @ts-ignore
                const cfLabel = await this.cf.getLabel(_packageId, _dhlPackageId);
                if (cfLabel.hasOwnProperty('messages') || (cfLabel.hasOwnProperty('status') && cfLabel.status > 203)) {
                    return LRes.resErr(res, cfLabel.status, cfLabel.messages);
                }
                return LRes.resOk(res, cfLabel);

            } catch (err) {
                return LRes.resErr(res, 401, err);
            }

        } else {
            return LRes.resErr(res, 404, "not enough parameters");
        }

    };

    public manifest: any = async (req: Request, res: Response) => {
        const body = req.body;
        const _type: string | null = req.params.type || null;

        if (_type !== null) {

            try {
                if (this.cf == null) {
                    await this.initCF(req, res);
                }
                // @ts-ignore
                const cfManifest = await this.cf.manifest(body);
                if (cfManifest.hasOwnProperty('messages') || (cfManifest.hasOwnProperty('status') && cfManifest.status > 203)) {
                    return LRes.resErr(res, cfManifest.status, cfManifest.messages);
                }
                return LRes.resOk(res, cfManifest);

            } catch (err) {
                return LRes.resErr(res, 401, err);
            }
        } else {
            return LRes.resErr(res, 404, "not enough parameters");
        }
    };

    public getManifest: any = async (req: Request, res: Response) => {
        const _requestId: string | null = req.params.requestId || null;

        if (_requestId !== null ) {

            try {
                if (this.cf == null) {
                    await this.initCF(req, res);
                }
                // @ts-ignore
                const cfManifest = await this.cf.getManifest(_requestId);
                if (cfManifest.hasOwnProperty('messages') || (cfManifest.hasOwnProperty('status') && cfManifest.status > 203)) {
                    return LRes.resErr(res, cfManifest.status, cfManifest.messages);
                }
                return LRes.resOk(res, cfManifest);

            } catch (err) {
                return LRes.resErr(res, 401, err);
            }

        } else {
            return LRes.resErr(res, 404, "not enough parameters");
        }

    };
}

export default ShippingController;
