import * as express from "express";
import {NextFunction, Request, Response} from "express";
import ICRUDControllerBase from "../../interfaces/ICRUDControllerBase.interface";
import User, {IUser, IUserLogin} from "../../models/user.model";
import LRes from "../../lib/lresponse.lib";

import passport from "passport";
import "../auth/passportHandler";
import '../../lib/env';
import AuthController from "../auth/auth.controller"


class UsersController implements ICRUDControllerBase {
    public path = "/user";
    public router = express.Router();
    private authJwt: AuthController =  new AuthController();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get(this.path + "/:id", this.authJwt.authenticateJWT, this.readOneGet);
        this.router.get(this.path, this.authJwt.authenticateJWT, this.readGet);
        this.router.post(this.path, this.authJwt.authenticateJWT, this.createPost);
        this.router.post(this.path+"/login", this.login);
        this.router.put(this.path, this.authJwt.authenticateJWT, this.updatePut);
        this.router.delete(this.path + '/:id', this.authJwt.authenticateJWT, this.delDelete);
    }

    public readOneGet: any = async (req: Request, res: Response, next: NextFunction) => {
        const _id: string = req.params.id;
        let result = await User.find({_id: _id})
            .limit(1)
            .then(async (dataList: IUser[]) => {
                if (dataList.length == 1) {
                    return dataList;
                }
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });

        if (!result) {
            LRes.resErr(res, 404, "Not found!");
        } else {
            LRes.resOk(res, result);
        }
    };

    public readGet: any = async (req: Request, res: Response) => {
        let result: any = null;
        await User.find()
            .then(async (dataList: IUser[]) => {
                if (dataList.length > 0) {
                    result = dataList;
                }
            })
            .catch((err: Error) => {
                LRes.resErr(res, 404, err);
            });
        LRes.resOk(res, result);
    };

    public createPost: any = async (req: Request, res: Response) => {
        const user: IUser = req.body;

        const createdUser = new User(user);
        await createdUser.save()
            .then(async (result: IUser) => {
                // @ts-ignore
                const authJson = createdUser.toAuthJSON();
                LRes.resOk(res, { 'email': createdUser.email, 'token': authJson.token });
            })
            .catch((err: Error | any) => {
                LRes.resErr(res, 500, err);
            });
    };

    public updatePut: any = async (req: Request, res: Response) => {
        const user: IUser = req.body;

        await User.findByIdAndUpdate(
            user._id,
            user,
            {runValidators: true}
        )
            .then(async (result) => {
                LRes.resOk(res, result);
            })
            .catch(async (err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };

    public delDelete: any = async (req: Request, res: Response) => {
        const id = req.params.id;
        await User.findByIdAndDelete(id)
            .then(async (result) => {
                if (result) {
                    LRes.resOk(res,200);
                } else {
                    LRes.resErr(res, 404, "Not Found");
                }
            })
            .catch(async (err: Error) => {
                LRes.resErr(res, 404, err);
            });
    };


    public login: any = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if(req.body.user.hasOwnProperty('password')) {
                await passport.authenticate('local', {session: false}, (err: Error, user: IUserLogin, info: any) => {
                    if (err) {
                        LRes.resErr(res, 404, err);
                    }
                    if (!user) {
                        LRes.resErr(res, 401, {code: "unauthorized"});
                    } else {
                        // @ts-ignore
                        const authJson = user.toAuthJSON();
                        LRes.resOk(res, authJson);
                    }
                })(req, res, next);
            }
        } catch (err) {
            LRes.resErr(res, 500, err);
        }
    };
}

export default UsersController;

