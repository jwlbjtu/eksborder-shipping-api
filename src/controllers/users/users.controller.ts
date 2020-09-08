import * as express from "express";
import {NextFunction, Request, Response} from "express";
import multer from "multer";
import sharp from "sharp";
import ICRUDControllerBase from "../../interfaces/ICRUDControllerBase.interface";
import User, {IUser, IUserLogin} from "../../models/user.model";
import LRes from "../../lib/lresponse.lib";

import passport from "passport";
// import "../auth/passportHandler";
import '../../lib/env';
import AuthController from "../auth/auth.controller"

import CarrierFactory from "../../lib/carrier.factory";

const upload = multer({
    limits: {
        fileSize: 1000000 // 1MB
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png)$/)) {
            return cb(new Error("File must ba in png format"));
        }
        cb(null, true);
    }
})

class UsersController implements ICRUDControllerBase {
    public path = "/user";
    public router = express.Router();
    private authJwt: AuthController =  new AuthController();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get(this.path + "/logout", this.authJwt.authenticateJWT, this.logout);
        this.router.get(this.path + "/:id", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.readOneGet);
        this.router.get(this.path, this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.readGet);
        this.router.post(this.path, this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.createPost);
        this.router.post(this.path + "/login", this.login);
        this.router.put(this.path + "/:id", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.updatePut);
        this.router.delete(this.path + '/:id', this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.delDelete);
        this.router.post(this.path + "/logo/:id", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), upload.single("upload"), this.upload,
            (error: Error | null, req: Request, res: Response, next: NextFunction) => {
                res.status(400).json({ title: error?.message });
            }    
        );
    }

    public readOneGet: any = async (req: Request, res: Response, next: NextFunction) => {
        const _id: string = req.params.id;
        if(!_id) return res.status(400).json({ title: "Please provide a valid user id" });
        
        try{
            let user = await User.findById(_id).populate({path: "accountRef"});
            if(user) return LRes.resOk(res, user);
            LRes.resErr(res, 404, { title: "No user found" });
        } catch (error) {
            LRes.resErr(res, 500, error);
        }
    };

    public readGet: any = async (req: Request, res: Response) => {
        try{
            const users = await User.find({}).populate({path: "accountRef"});
            LRes.resOk(res, users);
        } catch (error) {
            LRes.resErr(res, 500, error);
        }        
    };

    public createPost: any = async (req: Request, res: Response) => {
        try {
            const user: IUser = req.body;
            const createdUser = new User(user);
            await createdUser.save(); 
            // @ts-ignore
            const authJson = createdUser.toAuthJSON();
            LRes.resOk(res, { 'email': createdUser.email, 'token': authJson.token });
        } catch (error) {
            LRes.resErr(res, 500, error);
        }
    };

    public updatePut: any = async (req: Request, res: Response) => {
        try {
            const user = req.body;
            const updates = Object.keys(user);
            const id = req.params.id;

            const updatedUser = await User.findById(id);
            if(!updatedUser) return LRes.resErr(res, 404, { title: "No user found" });
            
            updates.forEach(key => {
                // @ts-ignore
                updatedUser[key] = user[key];
            });
            await updatedUser.save();

            LRes.resOk(res, updatedUser);
        } catch (error) {
            LRes.resErr(res, 404, error);
        }
    };

    public delDelete: any = async (req: Request, res: Response) => {
        const id = req.params.id;
        try {
            const user = await User.findByIdAndDelete(id);
            if(!user) return LRes.resErr(res, 404, "No user deleted");
            LRes.resOk(res, user);
        } catch (error) {
            res.status(500).json(error);
        }
    };

    public login: any = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if(req.body.user.hasOwnProperty('password')) {
                await passport.authenticate('local', {session: true}, async (err: Error, user: IUserLogin, info: any) => {
                    if (err) {
                        LRes.resErr(res, 404, err);
                    }
                    if (!user || user.isActive == false) {
                        LRes.resErr(res, 401, {code: "unauthorized"});
                    } else {
                        // @ts-ignore
                        const authJson = user.toAuthJSON();
                        user.isLogin = true;
                        await User.findByIdAndUpdate(
                            {_id: user._id},
                            {isLogin: true},
                            {runValidators: true, new: true});
                        LRes.resOk(res, authJson);
                    }
                })(req, res, next);
            }
        } catch (err) {
            LRes.resErr(res, 500, err);
        }
    };

    public logout: any  = async (req: Request, res: Response) => {
        // @ts-ignore
        await User.findByIdAndUpdate(
            // @ts-ignore
            req.user._id,
            {isLogin: false},
            {runValidators: true, new: true}
        );

        req.logout();
        delete req.user;
        // @ts-ignore
        delete req.session;

        LRes.resOk(res,'Logout')
    };

    public upload: any = async (req: Request, res: Response) => {
        const buffer = await sharp(req.file.buffer)
            .resize(250, 150).toBuffer();
        const id = req.params.id;
        try{
            const user = await User.findById(id);
            if(!user) return LRes.resErr(res, 404, { title: "No user found" });
            user.logoImage = buffer;
            await user.save();
            LRes.resOk(res, { title: "File uploaded successful!" });
        } catch(error) {
            LRes.resErr(res, 500, error);
        }
    }
}

export default UsersController;

