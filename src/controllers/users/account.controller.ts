import * as express from "express";
import {NextFunction, Request, Response} from "express";

import AuthController from "../../lib/auth/auth.handler"
import ICRUDControllerBase from "../../interfaces/ICRUDControllerBase.interface";
import LRes from "../../lib/lresponse.lib";
import Account from "../../models/account.model";
import { IAccount } from "../../types/user.types";

class AccountController implements ICRUDControllerBase {
    public path = "/account";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get(this.path, this.authJwt.authenticateJWT, this.authJwt.checkRole("admin"), this.readGet);
        this.router.get(this.path + "/:accountName", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin"), this.readOneGet);
        this.router.post(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("admin"), this.createPost);
        this.router.put(this.path + "/:accountName", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin"), this.updatePut);
        this.router.delete(this.path + "/:accountName", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin"), this.delDelete);
    };

    public readGet: any = async (req: Request, res: Response) => {
        try {
            const accounts = await Account.find()
                            .populate({path: 'carrierRef'})
                            .populate({path: 'pickupRef'})
                            .populate({path: 'facilityRef'})
                            .populate({path: 'userRef'});
            return LRes.resOk(res, accounts);
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };

    public readOneGet: any = async (req: Request, res: Response, next: NextFunction) => {
        const accountName: string = req.params.accountName;
        try {
            const account = await Account.findOne({accountName: accountName})
                                    .populate({path: 'carrierRef'})
                                    .populate({path: 'pickupRef'})
                                    .populate({path: 'facilityRef'})
                                    .populate({path: 'userRef'});
            return LRes.resOk(res, account);
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };

    public createPost: any = async (req: Request, res: Response) => {
        const account: IAccount = req.body;
        try {
            const createdAccount: IAccount= new Account(account);
            await createdAccount.save();
            return LRes.resOk(res, createdAccount);
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };

    public updatePut: any = async (req: Request, res: Response) => {
        const accountName: string = req.params.accountName;
        const accountOne: IAccount = req.body;
        try {
            const updatedAccount = await Account.findOneAndUpdate({ accountName: accountName }, accountOne, {new: true});
            return LRes.resOk(res, updatedAccount);
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };

    public delDelete: any = async (req: Request, res: Response) => {
        const accountName: string = req.params.accountName;
        try {
            await Account.findOneAndDelete({ accountName: accountName });
            return res.send();
        } catch (error) {
            return LRes.resErr(res, 500, error);
        }
    };
}

export default AccountController;
