import * as express from "express";
import {NextFunction, Request, Response} from "express";

import AuthController from "../auth/auth.controller"
import ICRUDControllerBase from "../../interfaces/ICRUDControllerBase.interface";
import LRes from "../../lib/lresponse.lib";
import Account, {IAccount} from "../../models/account.model";


class AccountController implements ICRUDControllerBase {
    public path = "/account";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get(this.path + "", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_account"), this.readGet);
        this.router.get(this.path + "/:code", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_account"), this.readOneGet);
        this.router.post(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_account"), this.createPost);
        this.router.put(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_account"), this.updatePut);
        this.router.delete(this.path , this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_account"), this.delDelete);
    };

    public readOneGet: any = async (req: Request, res: Response, next: NextFunction) => {
        const _code: string = req.params.code;
        await Account.findOne({accountName: _code})
            .populate({path: 'carrierRef'})
            .populate({path: 'pickupRef'})
            .populate({path: 'facilityRef'})
            .populate({path: 'userRef'})
            .then(async (accountOne: IAccount | null) => {
                LRes.resOk(res,accountOne);
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public readGet: any = async (req: Request, res: Response) => {
        await Account.find()
            .populate({path: 'carrierRef'})
            .populate({path: 'pickupRef'})
            .populate({path: 'facilityRef'})
            .populate({path: 'userRef'})
            .then(async (accountLists: IAccount[]) => {
                LRes.resOk(res,accountLists);
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public createPost: any = async (req: Request, res: Response) => {
        const account: IAccount = req.body;

        const createdAccount: IAccount= new Account(account);
        await createdAccount.save()
            .then(async (result:IAccount) => {
                LRes.resOk(res, result.toJSON());
            }).catch((err: Error) => {
                LRes.resErr(res, 500, err);
            });
    };

    public updatePut: any = async (req: Request, res: Response) => {
        const accountOne: IAccount = req.body;
        if (accountOne.hasOwnProperty('accountName') && accountOne.accountName.length > 0) {
            const filter: Object = {
                accountName: accountOne.accountName,
            };

            await Account.findOneAndUpdate(filter, accountOne, {new: true})
                .then(async (result: IAccount | null) => {
                    LRes.resOk(res, result);
                }).catch((err: Error) => {
                    LRes.resErr(res, 500, err);
                });
        } else {
            LRes.resErr(res, 404, "incorrect accountName");
        }
    };

    public delDelete: any = async (req: Request, res: Response) => {
        const accountOne: IAccount = req.body;
        if (accountOne.hasOwnProperty('accountName') && accountOne.accountName.length > 0) {
            const filter: Object = {
                accountName: accountOne.accountName,
            };

            await Account.findOneAndDelete(filter)
                .then(async (result: IAccount | null) => {
                    LRes.resOk(res, result);
                }).catch((err: Error) => {
                    LRes.resErr(res, 500, err);
                });
        } else {
            LRes.resErr(res, 404, "incorrect accountName");
        }
    };
}

export default AccountController;
