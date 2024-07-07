import { Request, Response } from 'express';

import User from '../../models/user.model';
import Billing from '../../models/billing.model';

import { IUser } from '../../types/user.types';
import '../../lib/env';
import { Types } from 'mongoose';
import lresponseLib from '../../lib/lresponse.lib';
import {
  IUserBalance,
  updateUserBalanceAndDeposit
} from '../../lib/utils/user.balance.utils';

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
    const total = data.addFund ? Math.abs(data.total) : -Math.abs(data.total);
    const deposit = data.addFund
      ? Math.abs(data.deposit)
      : -Math.abs(data.deposit);
    const newBalance: IUserBalance = await updateUserBalanceAndDeposit(
      user.id.toString(),
      total,
      deposit
    );
    // const newBalance = (data.balance = data.addFund
    //   ? user.balance + data.total
    //   : user.balance - data.total);
    // const newDeposit = data.addFund
    //   ? user.deposit + data.deposit
    //   : user.deposit - data.deposit;
    // Update user balance
    // user.balance = newBalance;
    // user.deposit = newDeposit;
    // await user.save();

    data.userRef = user._id;
    data.currency = user.currency;
    data.balance = newBalance.balance;
    data.clientDeposit = newBalance.deposit;
    // Create billing record
    const billing = new Billing(data);
    await billing.save();
    lresponseLib.resOk(res, billing);
  } catch (error) {
    console.log(error);
    lresponseLib.resErr(res, 500, error);
  }
};
