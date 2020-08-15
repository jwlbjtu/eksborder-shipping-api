import * as express from "express";
import {NextFunction, Request, Response} from "express";
import Facility, {IFacility} from "../../models/facility.model";

import AuthController from "../auth/auth.controller"
import ICRUDControllerBase from "../../interfaces/ICRUDControllerBase.interface";
import LRes from "../../lib/lresponse.lib";


class FacilityController implements ICRUDControllerBase {
    public path = "/facility";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get(this.path + "", this.authJwt.authenticateJWT, this.authJwt.checkRole("carrier"), this.readGet);
        this.router.get(this.path + "/:code", this.authJwt.authenticateJWT, this.authJwt.checkRole("carrier"), this.readOneGet);
        this.router.post(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("carrier"), this.createPost);
        this.router.put(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("carrier"), this.updatePut);
        this.router.delete(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("carrier"), this.delDelete);
    };

    public readOneGet: any = async (req: Request, res: Response, next: NextFunction) => {
        const _code: string = req.params.code;
        await Facility.findOne({facilityNumber: _code})
            .populate({path: 'carrierRef'})
            .then(async (facilityOne: IFacility | null) => {
                LRes.resOk(res,facilityOne);
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public readGet: any = async (req: Request, res: Response) => {
        await Facility.find()
            .populate({path: 'carrierRef'})
            .then(async (facilityLists: IFacility[]) => {
                LRes.resOk(res,facilityLists);
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public createPost: any = async (req: Request, res: Response) => {
        const facility: IFacility = req.body;

        const createdFacility: IFacility= new Facility(facility);
        await createdFacility.save()
            .then(async (result:IFacility) => {
                LRes.resOk(res, result.toJSON());
            }).catch((err: Error) => {
                LRes.resErr(res, 500, err);
            });
    };

    public updatePut: any = async (req: Request, res: Response) => {
        const facilityOne: IFacility = req.body;
        if (facilityOne.hasOwnProperty('facilityNumber') && facilityOne.facilityNumber.length > 0) {
            const filter: Object = {
                facilityNumber: facilityOne.facilityNumber,
            };

            await Facility.findOneAndUpdate(filter, facilityOne, {new: true})
                .then(async (result: IFacility | null) => {
                    LRes.resOk(res, result);
                }).catch((err: Error) => {
                    LRes.resErr(res, 500, err);
                });
        } else {
            LRes.resErr(res, 404, "incorrect facilityNumber");
        }
    };

    public delDelete: any = async (req: Request, res: Response) => {
        const facilityOne: IFacility = req.body;
        if (facilityOne.hasOwnProperty('facilityNumber') && facilityOne.facilityNumber.length > 0) {
            const filter: Object = {
                facilityNumber: facilityOne.facilityNumber,
            };

            await Facility.findOneAndDelete(filter)
                .then(async (result: IFacility | null) => {
                    LRes.resOk(res, result);
                }).catch((err: Error) => {
                    LRes.resErr(res, 500, err);
                });
        } else {
            LRes.resErr(res, 404, "incorrect facilityNumber");
        }
    };
}

export default FacilityController;
