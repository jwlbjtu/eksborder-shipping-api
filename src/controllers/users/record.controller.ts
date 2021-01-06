import { Request, Response } from 'express';
import LRes from '../../lib/lresponse.lib';
import User from '../../models/user.model';
import ShippingRecord from '../../models/shipping.model';
import { Types } from 'mongoose';

export const getShippingRecordsForClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const user = User.findById(Types.ObjectId(userId));
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });
    const records = await ShippingRecord.find({
      userRef: Types.ObjectId(userId)
    }).sort({ createdAt: -1 });
    return LRes.resOk(res, records);
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};
