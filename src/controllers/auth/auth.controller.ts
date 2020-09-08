import {NextFunction, Request, Response} from 'express';
import passport from 'passport';

import './passportHandler';
import {UserRoleList} from "../../models/user.model";

class AuthController {

    public authenticateJWT(req: Request, res: Response, next: NextFunction) {
        passport.authenticate("jwt", function (err, user, info) {
            if (err) {
                console.log(err);
                return res.status(401).json({status: "error", code: "unauthorized"});
            }
            if (!user || user.isActive == false || user.isLogin == false) {
                return res.status(401).json({status: "error", code: "unauthorized"});
            } else {
                req.user = user;
                return next();
            }
        })(req, res, next);
    }

    // public authorizeJWT(req: Request, res: Response, next: NextFunction) {
    //     passport.authenticate("jwt", function (err, user, jwtToken) {
    //         if (err) {
    //             console.log(err);
    //             return res.status(401).json({status: "error", code: "unauthorized"});
    //         }
    //         if (!user) {
    //             return res.status(401).json({status: "error", code: "unauthorized"});
    //         } else {
    //             const scope = req.baseUrl.split("/").slice(-1)[0];
    //             const authScope = jwtToken.scope;
    //             if (authScope && authScope.indexOf(scope) > -1) {
    //                 return next();
    //             } else {
    //                 return res.status(401).json({status: "error", code: "unauthorized"});
    //             }
    //         }
    //     })(req, res, next);
    // }

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
export default AuthController;
