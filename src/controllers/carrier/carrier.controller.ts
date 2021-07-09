import { Request, Response } from 'express';
import Carrier from '../../models/carrier.model';

import LRes from '../../lib/lresponse.lib';
import { ICarrier } from '../../types/record.types';
import { errorTypes } from '../../lib/constants';
import { Types } from 'mongoose';

export const getAllCarriers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const carrierList = await Carrier.find({});
    return LRes.resOk(res, carrierList);
  } catch (error) {
    return LRes.resErr(res, 404, error);
  }
};

export const getCarrierById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id: string = req.params.id;
  try {
    const carrier = await Carrier.findOne({ _id: Types.ObjectId(id) });
    return LRes.resOk(res, carrier);
  } catch (error) {
    return LRes.resErr(res, 404, error);
  }
};

export const createCarrier = async (
  req: Request,
  res: Response
): Promise<void> => {
  const carrier: ICarrier = req.body;
  try {
    const createdCarrier: ICarrier = new Carrier(carrier);
    await createdCarrier.save();
    return LRes.resOk(res, createdCarrier);
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const updateCarrier = async (
  req: Request,
  res: Response
): Promise<any> => {
  const carrier: ICarrier = req.body;
  if (!carrier.id)
    return res
      .status(400)
      .json(LRes.fieldErr('carrierName', '/', errorTypes.MISSING));

  try {
    const updatedCarrier = await Carrier.findOneAndUpdate(
      { _id: carrier.id },
      carrier,
      { new: true }
    );
    return LRes.resOk(res, updatedCarrier);
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const deleteCarrierById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const id: string = req.params.id;
  if (!id)
    return res.status(400).json(LRes.fieldErr('id', '/', errorTypes.MISSING));

  try {
    await Carrier.findOneAndDelete({ _id: Types.ObjectId(id) });
    return res.send();
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};
