import { Request, Response } from 'express';
import LRes from '../../lib/lresponse.lib';
import User from '../../models/user.model';
import Account from '../../models/account.model';
import { IAccount } from '../../types/user.types';
import { Types } from 'mongoose';
import uniqid from 'uniqid';

export const getAllClientCarrierAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accounts = await Account.find()
      .populate({ path: 'carrierRef' })
      .populate({ path: 'userRef' });
    return LRes.resOk(res, accounts);
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const getClientCarrierAccountsByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const user = User.findOne({ _id: Types.ObjectId(userId) });
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });
    const accounts = await Account.find({ userRef: Types.ObjectId(userId) });
    return LRes.resOk(res, accounts);
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const getClientCarrierAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const accountName: string = req.params.accountName;
  try {
    const account = await Account.findOne({ accountName: accountName })
      .populate({ path: 'carrierRef' })
      .populate({ path: 'userRef' });
    return LRes.resOk(res, account);
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const createClientCarrierAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const account: IAccount = req.body;
  try {
    account.accountId = uniqid();
    const createdAccount: IAccount = new Account(account);
    await createdAccount.save();
    return LRes.resOk(res, createdAccount);
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const updateClientCarrierAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data: IAccount = req.body;
  const updateFields = [
    'carrier',
    'connectedAccount',
    'services',
    'rates',
    'thirdpartyPrice',
    'carrierRef',
    'note',
    'isActive'
  ];
  try {
    const updatedAccount = await Account.findById(data.id);
    if (!updatedAccount)
      return LRes.resErr(res, 404, { title: 'No user found' });

    Object.keys(data).forEach((key) => {
      if (updateFields.includes(key)) {
        // @ts-expect-error: ignore
        updatedAccount[key] = data[key];
      }
    });

    await updatedAccount.save();
    LRes.resOk(res, updatedAccount);
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const deleteClientCarrierAccount = async (
  req: Request,
  res: Response
): Promise<any> => {
  const id = req.params.id;
  try {
    await Account.findOneAndDelete({ _id: Types.ObjectId(id) });
    return res.send();
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};
