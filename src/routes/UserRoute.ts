import * as express from 'express';
import AuthHandler from '../lib/auth/auth.handler';
import {
  createUser,
  getUsersByRole,
  updateUser,
  deleteUser,
  getUserById,
  getUserSelf,
  updateUserPassword,
  updateSelfPassword,
  uploadUserImage,
  login,
  logout
} from '../controllers/users/users.controller';
import fileUpload from '../middleware/file-upload';
import { USER_ROLES } from '../lib/constants';

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
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      createUser
    );

    // User Login
    this.router.post(this.path + '/login', login);

    // User Logout
    this.router.get(
      this.path + '/logout',
      this.authJwt.authenticateJWT,
      logout
    );

    // Get user self
    this.router.get(
      this.path + '/self',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      getUserSelf
    );

    // Update self password
    this.router.put(
      this.path + '/selfPassword',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      updateSelfPassword
    );

    // Get Users by Role
    this.router.get(
      this.path + '/list/:role',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      getUsersByRole
    );

    // Get User by ID
    this.router.get(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      getUserById
    );

    // Update User
    this.router.put(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      updateUser
    );

    // Update User Password
    this.router.put(
      this.path + '/password',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      updateUserPassword
    );

    // Delete User by ID
    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      deleteUser
    );

    // Update User Logo Image
    this.router.post(
      this.path + '/logo/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole(USER_ROLES.ADMIN_SUPER),
      fileUpload.single('image'),
      uploadUserImage,
      (error: Error | null, req: express.Request, res: express.Response) => {
        res.status(400).json({ title: error?.message });
      }
    );
  }
}

export default UserRoute;
