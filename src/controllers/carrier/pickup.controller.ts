import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import Pickup from '../../models/pickup.model';

import AuthController from '../../lib/auth/auth.handler';
import ICRUDControllerBase from '../../interfaces/ICRUDControllerBase.interface';
import LRes from '../../lib/lresponse.lib';
import { IPickup } from '../../types/record.types';

class PickupController implements ICRUDControllerBase {
  public path = '/pickup';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get(
      this.path + '',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.readGet
    );
    this.router.get(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.readOneGet
    );
    this.router.post(
      this.path,
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.createPost
    );
    this.router.put(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.updatePut
    );
    this.router.delete(
      this.path + '/:id',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.delDelete
    );
  }

  public readGet: any = async (req: Request, res: Response) => {
    try {
      const pickups = await Pickup.find();
      return LRes.resOk(res, pickups);
    } catch (error) {
      return LRes.resErr(res, 500, error);
    }
  };

  public readOneGet: any = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const id: string = req.params.id;
    try {
      const pickup = await Pickup.findById(id);
      return LRes.resOk(res, pickup);
    } catch (error) {}
  };

  public createPost: any = async (req: Request, res: Response) => {
    const pickup: IPickup = req.body;
    try {
      const createdPickup: IPickup = new Pickup(pickup);
      await createdPickup.save();
      LRes.resOk(res, createdPickup);
    } catch (error) {
      return LRes.resErr(res, 500, error);
    }
  };

  public updatePut: any = async (req: Request, res: Response) => {
    const pickupOne: IPickup = req.body;
    const id: string = req.params.id;
    try {
      const updatedPickup = await Pickup.findByIdAndUpdate(id, pickupOne, {
        new: true
      });
      return LRes.resOk(res, updatedPickup);
    } catch (error) {
      return LRes.resErr(res, 500, error);
    }
  };

  public delDelete: any = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      await Pickup.findByIdAndDelete(id);
      return res.send();
    } catch (error) {
      return LRes.resErr(res, 500, error);
    }
  };
}

export default PickupController;
