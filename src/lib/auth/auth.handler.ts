import { NextFunction, Request, Response } from 'express';
import passport from 'passport';

import './passport.handler';
import { UserRoleList, USER_ROLES } from '../../lib/constants';
import User from '../../models/user.model';

class AuthHandler {
  public authenticateJWT(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    passport.authenticate('jwt', async function (err, user, jwtToken) {
      if (err) {
        console.log(err);
        return res.status(401).json({ status: 'error', code: 'unauthorized' });
      }
      try {
        if (jwtToken.name && jwtToken.name === 'TokenExpiredError') {
          return res
            .status(401)
            .json({ status: 'error', title: 'Access Token Expired' });
        }
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const user = await User.findOne({
          _id: jwtToken.id,
          'tokens.token': token,
          isActive: true
        });
        if (!user || user.isActive == false) {
          return res
            .status(401)
            .json({ status: 'error', title: 'unauthorized' });
        }

        req.user = user;
        // @ts-expect-error: ignore
        req.token = token;
        return next();
      } catch (error) {
        return res.status(401).json({ status: 'error', title: 'unauthorized' });
      }
    })(req, res, next);
  }

  public checkRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): any => {
      const userPrevillege: Array<string> = UserRoleList;
      // @ts-expect-error: ignore
      const _urole: string = req.user.role;

      if (userPrevillege.includes(_urole)) {
        const roleLength: number = userPrevillege.length;
        const currentRoleIndex: number = userPrevillege.indexOf(_urole);
        if (currentRoleIndex < roleLength - 1) {
          const sliceRole = userPrevillege.slice(currentRoleIndex);
          if (sliceRole.includes(role)) {
            return next();
          }
        } else if (role === _urole) {
          return next();
        }
      }
      return res.status(401).json({ status: 'error', code: 'unauthorized' });
    };
  }

  public checkSingleRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction): any => {
      // @ts-expect-error: ignore
      const _urole = req.user.role;

      if (Object.values(USER_ROLES).includes(_urole) && _urole === role) {
        return next();
      }
      return res.status(401).json({ message: 'unauthorized' });
    };
  };

  public checkRoles = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): any => {
      // @ts-expect-error: ignore
      const _urole = req.user.role;

      if (
        Object.values(USER_ROLES).includes(_urole) &&
        roles.includes(_urole)
      ) {
        return next();
      }
      return res.status(401).json({ message: 'unauthorized' });
    };
  };
}

export default AuthHandler;
