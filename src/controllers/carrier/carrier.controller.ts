import * as express from "express";
import {NextFunction, Request, Response} from "express";
import Carrier, {ICarrier} from "../../models/carrier.model";

import AuthController from "../auth/auth.controller"
import ICRUDControllerBase from "../../interfaces/ICRUDControllerBase.interface";
import LRes from "../../lib/lresponse.lib";

class CarrierController implements ICRUDControllerBase {
    public path = "/carrier";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get(this.path + "", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.readGet);
        this.router.get(this.path + "/:code", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.readOneGet);
        this.router.post(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.createPost);
        this.router.put(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.updatePut);
        this.router.delete(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.delDelete);
    };

    public readOneGet: any = async (req: Request, res: Response, next: NextFunction) => {
        const _code: string = req.params.code;
        await Carrier.findOne({accountCode: _code})
            .populate({path: 'pickupRef'})
            .populate({path: 'facilityRef'})
            .then(async (carrierOne: ICarrier | null) => {
                LRes.resOk(res,carrierOne);
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public readGet: any = async (req: Request, res: Response) => {
        await Carrier.find()
            .populate({path: 'pickupRef'})
            .populate({path: 'facilityRef'})
            .populate({path: 'userRef'})
            .then(async (carrierLists: ICarrier[]) => {
                LRes.resOk(res,carrierLists);
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public createPost: any = async (req: Request, res: Response) => {
        const carrier: ICarrier = req.body;

        const createdCarrier: ICarrier= new Carrier(carrier);
        await createdCarrier.save()
            .then(async (result:ICarrier) => {
                LRes.resOk(res, result.toJSON());
            }).catch((err: Error) => {
                LRes.resErr(res, 500, err);
            });
    };

    public updatePut: any = async (req: Request, res: Response) => {
        const carrierOne: ICarrier = req.body;
        if (carrierOne.hasOwnProperty('accountCode') && carrierOne.accountCode.length > 0) {
            const filter: Object = {
                accountCode: carrierOne.accountCode,
            };

            await Carrier.findOneAndUpdate(filter, carrierOne, {new: true})
                .then(async (result: ICarrier | null) => {
                    LRes.resOk(res, result);
                }).catch((err: Error) => {
                    LRes.resErr(res, 500, err);
                });
        } else {
            LRes.resErr(res, 404, "incorrect accountCode");
        }
    };

    public delDelete: any = async (req: Request, res: Response) => {
        const carrierOne: ICarrier = req.body;
        if (carrierOne.hasOwnProperty('accountCode') && carrierOne.accountCode.length > 0) {
            const filter: Object = {
                accountCode: carrierOne.accountCode,
            };

            await Carrier.findOneAndDelete(filter)
                .then(async (result: ICarrier | null) => {
                    LRes.resOk(res, result);
                }).catch((err: Error) => {
                    LRes.resErr(res, 500, err);
                });
        } else {
            LRes.resErr(res, 404, "incorrect accountCode");
        }
    };
}

export default CarrierController;
