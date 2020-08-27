import * as express from "express";
import {NextFunction, Request, Response} from "express";
import Pickup, {IPickup} from "../../models/pickup.model";

import AuthController from "../auth/auth.controller"
import ICRUDControllerBase from "../../interfaces/ICRUDControllerBase.interface";
import LRes from "../../lib/lresponse.lib";


class PickupController implements ICRUDControllerBase {
    public path = "/pickup";
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
        await Pickup.findOne({pickupAccount: _code})
            .populate({path: 'carrierRef'})
            .then(async (pickupOne: IPickup | null) => {
                LRes.resOk(res,pickupOne);
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public readGet: any = async (req: Request, res: Response) => {
        await Pickup.find()
            .populate({path: 'carrierRef'})
            .then(async (pickupLists: IPickup[]) => {
                LRes.resOk(res,pickupLists);
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public createPost: any = async (req: Request, res: Response) => {
        const pickup: IPickup = req.body;

        const createdPickup: IPickup= new Pickup(pickup);
        await createdPickup.save()
            .then(async (result:IPickup) => {
                LRes.resOk(res, result.toJSON());
            }).catch((err: Error) => {
                LRes.resErr(res, 500, err);
            });
    };

    public updatePut: any = async (req: Request, res: Response) => {
        const pickupOne: IPickup = req.body;
        if (pickupOne.hasOwnProperty('pickupAccount') && pickupOne.pickupAccount.length > 0) {
            const filter: Object = {
                pickupAccount: pickupOne.pickupAccount,
            };

            await Pickup.findOneAndUpdate(filter, pickupOne, {new: true})
                .then(async (result: IPickup | null) => {
                    LRes.resOk(res, result);
                }).catch((err: Error) => {
                    LRes.resErr(res, 500, err);
                });
        } else {
            LRes.resErr(res, 404, "incorrect pickupAccount");
        }
    };

    public delDelete: any = async (req: Request, res: Response) => {
        const pickupOne: IPickup = req.body;
        if (pickupOne.hasOwnProperty('pickupAccount') && pickupOne.pickupAccount.length > 0) {
            const filter: Object = {
                pickupAccount: pickupOne.pickupAccount,
            };

            await Pickup.findOneAndDelete(filter)
                .then(async (result: IPickup | null) => {
                    LRes.resOk(res, result);
                }).catch((err: Error) => {
                    LRes.resErr(res, 500, err);
                });
        } else {
            LRes.resErr(res, 404, "incorrect pickupAccount");
        }
    };
}

export default PickupController;
