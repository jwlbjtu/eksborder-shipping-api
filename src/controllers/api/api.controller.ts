import * as express from "express";
import { Request, Response} from "express";
import AuthHandler from "../../lib/auth/auth.handler";
import LRes from "../../lib/lresponse.lib";
import User from "../../models/user.model";
import IControllerBase from "../../interfaces/IControllerBase.interface";

class APIController implements IControllerBase{
    public path = "/api";
    public router = express.Router();
    private authJwt: AuthHandler = new AuthHandler();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        // Create and Refresh user API Token
        this.router.get(this.path + "/refresh/:id", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.refresh);
        // Revoke user API Token
        this.router.get(this.path + "/revoke/:id", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.revoke);
    }

    public refresh: any = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const user = await User.findOne({ _id: id,  isActive: true});
            if(!user) return LRes.resErr(res, 404, { title: "No user found" });
            // @ts-ignore
            const authJson = await user.apiAuthJSON();
            LRes.resOk(res, authJson);
        } catch (error) {
            LRes.resErr(res, 500, error);
        }
    }

    public revoke: any = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const user = await User.findOne({ _id: id,  isActive: true});
            if(!user) return LRes.resErr(res, 404, { title: "No user found" });

            if(user.apiToken) {
                const oldToken = user.apiToken;
                // @ts-ignore
                user.tokens = user.tokens.filter((item: {token: string}) => {
                    return item.token !== oldToken;
                })
            }
            user.apiToken = undefined;
            await user.save();
            LRes.resOk(res, { message: "API token is revoked" });
        } catch (error) {
            LRes.resErr(res, 500, error);
        }
    }
}

export default APIController;