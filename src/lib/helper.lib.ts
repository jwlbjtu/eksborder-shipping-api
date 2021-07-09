import Account from '../models/account.model';
import { IAccount, IUser } from '../types/user.types';

class HelperLib {
  static getCurrentUserAccount = async (
    carrierAccount: string,
    user: IUser
  ): Promise<IAccount | null> => {
    const account = await Account.findOne({
      accountId: carrierAccount,
      userRef: user._id,
      isActive: true
    });

    return account;
  };
}

export default HelperLib;
