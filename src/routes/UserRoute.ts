import * as express from 'express';
import AuthHandler from '../lib/auth/auth.handler';
import {
  createUser,
  getUsersByRole,
  updateUser,
  deleteUser,
  getUserById,
  updateUserPassword,
  uploadUserImage
} from '../controllers/users/users.controller';
import fileUpload from '../middleware/file-upload';

class UserRoute {
  public path = '/users';
  public router = express.Router();
  private authJwt: AuthHandler = new AuthHandler();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    //Create User
    this.router.post(
      this.path,
      //TODO   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      createUser
    );

    // // User Login
    // this.router.post(this.path + '/login', this.login);
    // // User Logout
    // this.router.get(
    //   this.path + '/logout',
    //   this.authJwt.authenticateJWT,
    //   this.logout
    // );

    // Get User by ID
    this.router.get(
      this.path + '/:id',
      //TODO   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      getUserById
    );

    // // Get All Users
    // this.router.get(
    //   this.path,
    //   this.authJwt.authenticateJWT,
    //   this.authJwt.checkRole('admin_super'),
    //   this.readGet
    // );

    // Get Users by Role
    this.router.get(
      this.path + '/list/:role',
      //TODO   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      getUsersByRole
    );

    // Update User
    this.router.put(
      this.path,
      //TODO   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      updateUser
    );

    // Update User Password
    this.router.put(
      this.path + '/password',
      //TODO   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      updateUserPassword
    );

    // Delete User by ID
    this.router.delete(
      this.path + '/:id',
      //TODO   this.authJwt.authenticateJWT,
      // TODO  this.authJwt.checkRole('admin_super'),
      deleteUser
    );

    // Update User Logo Image
    this.router.post(
      this.path + '/logo/:id',
      //TODO   this.authJwt.authenticateJWT,
      //TODO   this.authJwt.checkRole('admin_super'),
      fileUpload.single('image'),
      uploadUserImage,
      (error: Error | null, req: express.Request, res: express.Response) => {
        res.status(400).json({ title: error?.message });
      }
    );

    // TODO: enable user
    // TODO: disable user
  }
}

export default UserRoute;
