import CarrierFactory from '../../lib/carriers/carrier.factory';
import { errorTypes } from '../../lib/constants';
import LRes from '../../lib/lresponse.lib';
import { IUser } from '../../types/user.types';
import { Request, Response } from 'express';

export const getTrackingInfo = async (
  req: Request,
  res: Response
): Promise<any> => {
  const body = req.body;
  const carrier: string = body.carrier;
  const trackingNumber: string = body.trackingNumber;
  const isTest: boolean = body.isTest;
  if (!carrier) {
    return res
      .status(400)
      .json(LRes.fieldErr('carrier', '/', errorTypes.MISSING));
  }
  if (!trackingNumber) {
    return res
      .status(400)
      .json(LRes.fieldErr('trackingNumber', '/', errorTypes.MISSING));
  }
  const trackingInfo = await CarrierFactory.getCarrierTrackingAPI(
    carrier,
    trackingNumber,
    isTest
  );

  if (!trackingInfo) {
    return res.status(400).json({ message: 'Unable to get tracking info' });
  }
  return LRes.resOk(res, trackingInfo);
};
