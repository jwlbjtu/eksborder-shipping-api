import { Request, Response } from 'express';

import User from '../../models/user.model';
import Billing from '../../models/billing.model';

import { IUser } from '../../types/user.types';
import '../../lib/env';
import { Types } from 'mongoose';
import lresponseLib from '../../lib/lresponse.lib';

// get billing records for a client
export const getUserBillingRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ _id: Types.ObjectId(userId) });
    if (!user) return lresponseLib.resErr(res, 404, { title: 'No user found' });

    const billings = await Billing.find({
      userRef: Types.ObjectId(userId)
    }).sort({
      createdAt: -1
    });
    lresponseLib.resOk(res, billings);
  } catch (error) {
    lresponseLib.resErr(res, 500, error);
  }
};

// create new billing record for a client
export const createBillingRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const data = req.body;
    const user: IUser | null = await User.findOne({
      _id: Types.ObjectId(userId)
    });
    if (!user) return lresponseLib.resErr(res, 404, { title: 'No user found' });

    const newBalance = (data.balance = data.addFund
      ? user.balance + data.total
      : user.balance - data.total);
    if (newBalance < 0)
      return lresponseLib.resErr(res, 400, {
        title: 'User balance cannot be lower than 0'
      });
    // Update user balance
    user.balance = newBalance;
    await user.save();

    data.userRef = user._id;
    data.currency = user.currency;
    data.balance = newBalance;
    // Create billing record
    const billing = new Billing(data);
    await billing.save();
    lresponseLib.resOk(res, billing);
  } catch (error) {
    lresponseLib.resErr(res, 500, error);
  }
};
