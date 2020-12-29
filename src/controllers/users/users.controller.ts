import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import multer from 'multer';
import sharp from 'sharp';

import AuthHandler from '../../lib/auth/auth.handler';
import User from '../../models/user.model';
import LRes from '../../lib/lresponse.lib';

import ICRUDControllerBase from '../../interfaces/ICRUDControllerBase.interface';
import { IUser, IUserLogin } from '../../types/user.types';
import '../../lib/env';

const upload = multer({
  limits: {
    fileSize: 1000000 // 1MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png)$/)) {
      return cb(new Error('File must ba in png format'));
    }
    cb(null, true);
  }
});

class UsersController implements ICRUDControllerBase {
  public path = '/users';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    // Create User - later can consider to allow customers to register use by themselves
    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.createPost
    );
    //this.router.post(this.path, this.createPost);
    // User Login
    this.router.post(this.path + '/login', this.login);
    // User Logout
    this.router.get(
      this.path + '/logout',
      this.authJwt.authenticateJWT,
      this.logout
    );
    // Get User by ID
    this.router.get(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.readOneGet
    );
    // Get All Users
    this.router.get(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.readGet
    );
    // Update User by ID
    this.router.put(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.updatePut
    );
    // Delete User by ID
    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.delDelete
    );
    // Update User Logo Image
    this.router.post(
      this.path + '/logo/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      upload.single('upload'),
      this.upload,
      (
        error: Error | null,
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        res.status(400).json({ title: error?.message });
      }
    );
    // TODO: enable user
    // TODO: disable user
  }

  public createPost: any = async (req: Request, res: Response) => {
    try {
      const user: IUser = req.body;
      // TODO: later need to add limits about fields can be created, others should be default
      const createdUser = new User(user);
      await createdUser.save();
      // @ts-expect-error: ignore
      const authJson = await createdUser.apiAuthJSON();
      LRes.resOk(res, authJson);
    } catch (error) {
      LRes.resErr(res, 500, error);
    }
  };

  public login: any = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (
        !req.body.user.hasOwnProperty('email') ||
        !req.body.user.hasOwnProperty('password')
      ) {
        return LRes.resErr(res, 400, {
          message: 'Invalid username or password'
        });
      }
      await passport.authenticate(
        'local',
        { session: true },
        async (err: Error, user: IUserLogin, info: any) => {
          if (err) return LRes.resErr(res, 400, err);

          // @ts-expect-error: ignore
          const authJson = await user.toAuthJSON();

          LRes.resOk(res, authJson);
        }
      )(req, res, next);
    } catch (err) {
      LRes.resErr(res, 500, err);
    }
  };

  public logout: any = async (req: Request, res: Response) => {
    try {
      // @ts-expect-error: ignore
      req.user.tokens = req.user.tokens.filter((token: { token: string }) => {
        // @ts-expect-error: ignore
        return token.token != req.token;
      });
      // @ts-expect-error: ignore
      await req.user.save();

      req.logout();
      delete req.user;
      // @ts-expect-error: ignore
      delete req.session;

      LRes.resOk(res, { message: 'Logout' });
    } catch (error) {
      LRes.resErr(res, 500, error);
    }
  };

  public readOneGet: any = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const _id: string = req.params.id;
    if (!_id)
      return res.status(400).json({ title: 'Please provide a valid user id' });

    try {
      const user = await User.findById(_id);
      if (user) return LRes.resOk(res, user);
      LRes.resErr(res, 404, { title: 'No user found' });
    } catch (error) {
      LRes.resErr(res, 500, error);
    }
  };

  public readGet: any = async (req: Request, res: Response) => {
    try {
      const users = await User.find({});
      LRes.resOk(res, users);
    } catch (error) {
      LRes.resErr(res, 500, error);
    }
  };

  public updatePut: any = async (req: Request, res: Response) => {
    try {
      // TODO: add limit of fields can be updated
      const user = req.body;
      const updates = Object.keys(user);
      const id = req.params.id;

      const updatedUser = await User.findById(id);
      if (!updatedUser)
        return LRes.resErr(res, 404, { title: 'No user found' });

      updates.forEach((key) => {
        // @ts-expect-error: ignore
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
      // TODO: cancatinate delete - delete all related data
      const user = await User.findByIdAndDelete(id);
      if (!user) return LRes.resErr(res, 404, 'No user deleted');
      LRes.resOk(res, user);
    } catch (error) {
      res.status(500).json(error);
    }
  };

  public upload: any = async (req: Request, res: Response) => {
    const buffer = await sharp(req.file.buffer).resize(250, 150).toBuffer();
    const id = req.params.id;
    try {
      const user = await User.findById(id);
      if (!user) return LRes.resErr(res, 404, { title: 'No user found' });
      user.logoImage = buffer;
      await user.save();
      LRes.resOk(res, { title: 'File uploaded successful!' });
    } catch (error) {
      LRes.resErr(res, 500, error);
    }
  };
}

export default UsersController;
