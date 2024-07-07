import { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { ClientAccount, IUser } from '../../types/user.types';
import AccountSchema from '../../models/account.model';

export const fetchClientAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const accounts = await AccountSchema.find({ userRef: user._id });
    res.json(
      accounts.map((ele) => {
        const accountData: ClientAccount = {
          id: ele.id,
          accountName: ele.accountName,
          accountId: ele.accountId,
          carrier: ele.carrier,
          connectedAccount: ele.connectedAccount,
          services: [ele.service],
          facilities: [ele.facility],
          carrierRef: ele.carrierRef,
          userRef: ele.userRef,
          note: ele.note,
          isActive: ele.isActive
        };
        return accountData;
      })
    );
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};
