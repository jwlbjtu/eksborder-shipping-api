import { Request, Response } from 'express';
import { IUser } from '../../types/user.types';
import BillingSchema from '../../models/billing.model';
import { UserBillingRecordsSearchQuery } from '../users/billing.controller';
import { ShipmentStatus } from '../../lib/constants';
import User from '../../models/user.model';

export const fetchClientBillings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const billings = await BillingSchema.find({ userRef: user._id }).sort({
      $natural: -1
    });
    res.json(
      billings.map((ele) => {
        const result = {
          id: ele._id,
          userRef: ele.userRef,
          description: ele.description,
          account: ele.account,
          total: ele.total,
          balance: ele.balance,
          currency: ele.currency,
          addFund: ele.addFund,
          createdAt: ele.createdAt,
          updatedAt: ele.updatedAt,
          invoice: ele.invoice
        };
        return result;
      })
    );
  } catch (error) {
    res.status(500).json(error);
  }
};

export const searchBillingRecordForUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as UserBillingRecordsSearchQuery;
    const user = req.user as IUser;
    const userId = user.id;
    const userObj = await User.findOne({ _id: userId });
    if (!userObj) {
      res.status(404).json({ message: 'No user found' });
      return;
    }

    const { startDate, endDate, status, orderId, channel } = body;
    const searchQuery: Record<string, any> = {
      userRef: userId,
      status: status ? status : { $ne: ShipmentStatus.DELETED },
      createdAt: { $gte: startDate + ' 00:00:00', $lte: endDate + ' 23:59:59' }
    };
    if (orderId) {
      searchQuery['description'] = { $regex: orderId, $options: 'i' };
    }
    if (channel) {
      searchQuery['account'] = { $regex: channel, $options: 'i' };
    }
    const billings = await BillingSchema.find(searchQuery).sort({
      createdAt: -1
    });
    res.json(billings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: (error as Error).message });
  }
};
