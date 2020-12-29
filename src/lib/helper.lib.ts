import Carrier from '../models/carrier.model';
import Account from '../models/account.model';
import { IAccount, IUser } from '../types/user.types';

class HelperLib {
  static getCurrentUserAccount = async (
    name: string,
    user: IUser
  ): Promise<IAccount | null> => {
    const account = await Account.findOne({
      accountName: name,
      userRef: user._id
    })
      .populate({ path: 'carrierRef' })
      .populate({ path: 'pickupRef' })
      .populate({ path: 'facilityRef' })
      .populate({ path: 'userRef', match: { _id: user._id } });

    return account;
  };
}

export default HelperLib;
