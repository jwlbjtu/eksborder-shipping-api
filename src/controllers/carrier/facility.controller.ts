import * as express from "express";
import {NextFunction, Request, Response} from "express";
import Facility from "../../models/facility.model";

import AuthController from "../../lib/auth/auth.handler"
import ICRUDControllerBase from "../../interfaces/ICRUDControllerBase.interface";
import LRes from "../../lib/lresponse.lib";
import { IFacility } from "../../types/record.types";


class FacilityController implements ICRUDControllerBase {
    public path = "/facility";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get(this.path, this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.readGet);
        this.router.get(this.path + "/:id", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.readOneGet);
        this.router.post(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.createPost);
        this.router.put(this.path + "/:id", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.updatePut);
        this.router.delete(this.path + "/:id", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.delDelete);
    };

    public readGet: any = async (req: Request, res: Response) => {
        try {
            const facility = await Facility.find();
            return LRes.resOk(res, facility);
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };

    public readOneGet: any = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            const facility = await Facility.findById(id);
            return LRes.resOk(res, facility);
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };

    public createPost: any = async (req: Request, res: Response) => {
        const facility: IFacility = req.body;
        try {
            const createdFacility: IFacility= new Facility(facility);
            await createdFacility.save();
            return LRes.resOk(res, createdFacility);
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };

    public updatePut: any = async (req: Request, res: Response) => {
        const id = req.params.id;
        const facilityOne: IFacility = req.body;
        try {
            const updatedFacility = await Facility.findByIdAndUpdate(id, facilityOne, {new: true});
            return LRes.resOk(res, updatedFacility);
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };

    public delDelete: any = async (req: Request, res: Response) => {
        const id = req.params.id;
        try {
            await Facility.findByIdAndDelete(id);
            return res.send();
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };
}

export default FacilityController;
