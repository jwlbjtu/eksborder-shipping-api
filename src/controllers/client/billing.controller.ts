import { Request, Response } from 'express';
import { IUser } from '../../types/user.types';
import BillingSchema from '../../models/billing.model';

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
