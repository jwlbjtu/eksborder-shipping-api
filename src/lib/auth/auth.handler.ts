import {NextFunction, Request, Response} from 'express';
import passport from 'passport';

import './passport.handler';
import {UserRoleList} from "../../lib/constants";
// @ts-ignore
import User from "../../models/user.model";

class AuthHandler {

    public authenticateJWT(req: Request, res: Response, next: NextFunction) {
        passport.authenticate("jwt", async function (err, user, jwtToken) {
            if (err) {
                console.log(err);
                return res.status(401).json({status: "error", code: "unauthorized"});
            }
            try {
                if(jwtToken.name && jwtToken.name === "TokenExpiredError") {
                    return res.status(401).json({status: "error", title: "Access Token Expired"});
                }
                const token = req.header("Authorization")?.replace("Bearer ", "");
                const user = await User.findOne({
                    email: jwtToken.email,
                    "tokens.token": token,
                    isActive: true
                });
                if (!user || user.isActive == false) {
                    return res.status(401).json({status: "error", title: "unauthorized"});
                }

                req.user = user;
                // @ts-ignore
                req.token = token;
                return next();
            } catch (error) {
                return res.status(401).json({status: "error", title: "unauthorized"});
            }           

        })(req, res, next);
    }

    public checkRole(role: string) {
        return (req: Request, res: Response, next: NextFunction) => {
            const userPrevillege: Array<String>= UserRoleList;
            // @ts-ignore
            const _urole: string = req.user.role;

            if (userPrevillege.includes(_urole)) {
                const roleLength: number = userPrevillege.length;
                const currentRoleIndex: number = userPrevillege.indexOf(_urole);
                if (currentRoleIndex < (roleLength-1)) {
                    const sliceRole = userPrevillege.slice(currentRoleIndex);
                    if (sliceRole.includes(role)){
                        return next();
                    }

                } else if (role === _urole) {
                    return next();
                }
            }
            return res.status(401).json({status: "error", code: "unauthorized or bed role type"});

        }
    }


}
export default AuthHandler;
