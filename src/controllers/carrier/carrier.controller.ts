import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import Carrier from '../../models/carrier.model';

import AuthController from '../../lib/auth/auth.handler';
import ICRUDControllerBase from '../../interfaces/ICRUDControllerBase.interface';
import LRes from '../../lib/lresponse.lib';
import { ICarrier } from '../../types/record.types';
import { errorTypes } from '../../lib/constants';

class CarrierController implements ICRUDControllerBase {
  public path = '/carrier';
  public router = express.Router();
  private authJwt: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  public initRoutes(): void {
    this.router.get(
      this.path,
      //this.authJwt.authenticateJWT,
      //this.authJwt.checkRole('admin_super'),
      this.readGet
    );
    this.router.get(
      this.path + '/:carrierName',
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
      this.path + '/:carrierName',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.updatePut
    );
    this.router.delete(
      this.path + '/:carrierName',
      this.authJwt.authenticateJWT,
      this.authJwt.checkRole('admin_super'),
      this.delDelete
    );
  }

  public readGet: any = async (req: Request, res: Response) => {
    try {
      const carrierList = await Carrier.find()
        .populate({ path: 'pickupRef' })
        .populate({ path: 'facilityRef' });
      return LRes.resOk(res, carrierList);
    } catch (error) {
      return LRes.resErr(res, 404, error);
    }
  };

  public readOneGet: any = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const name: string = req.params.carrierName;
    try {
      const carrier = await Carrier.findOne({ carrierName: name })
        .populate({ path: 'pickupRef' })
        .populate({ path: 'facilityRef' });
      return LRes.resOk(res, carrier);
    } catch (error) {
      return LRes.resErr(res, 404, error);
    }
  };

  public createPost: any = async (req: Request, res: Response) => {
    const carrier: ICarrier = req.body;
    try {
      const createdCarrier: ICarrier = new Carrier(carrier);
      await createdCarrier.save();
      return LRes.resOk(res, createdCarrier);
    } catch (error) {
      return LRes.resErr(res, 500, error);
    }
  };

  public updatePut: any = async (req: Request, res: Response) => {
    const carrier: ICarrier = req.body;
    const carrierName: string = req.params.carrierName;
    if (!carrierName)
      return res
        .status(400)
        .json(LRes.fieldErr('carrierName', '/', errorTypes.MISSING));

    try {
      const updatedCarrier = await Carrier.findOneAndUpdate(
        { carrierName: carrierName },
        carrier,
        { new: true }
      );
      return LRes.resOk(res, updatedCarrier);
    } catch (error) {
      return LRes.resErr(res, 500, error);
    }
  };

  public delDelete: any = async (req: Request, res: Response) => {
    const carrierName: string = req.params.carrierName;
    if (!carrierName)
      return res
        .status(400)
        .json(LRes.fieldErr('carrierName', '/', errorTypes.MISSING));

    try {
      await Carrier.findOneAndDelete({ carrierName: carrierName });
      return res.send();
    } catch (error) {
      return LRes.resErr(res, 500, error);
    }
  };
}

export default CarrierController;
