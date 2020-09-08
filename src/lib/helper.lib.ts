import Carrier from "../models/carrier.model";
import Account, {IAccount} from "../models/account.model";
import User, {IUser} from "../models/user.model";

import LRes from "./lresponse.lib";

class HelperLib {

    static getCarrierType: Array<String> | any = async () => {
        return await Carrier.find({}).select(['accountCode'])
            .then(async (result: Response | any) => {
                let types: Array<string> = [];
                if (result.length > 0) {
                    result.forEach((val: Object | any) => {
                        return types.push(val.accountCode);
                    });
                }
                return types;
            }).catch((err: Error) => {
                throw new Error(err.message);
            });
    };

    static getCurrentUserAccount : any = async (_code: string, user: IUser) => {
        return await Account.findOne({accountName: _code})
            .populate({path: 'carrierRef'})
            .populate({path: 'pickupRef'})
            .populate({path: 'facilityRef'})
            .populate({path: 'userRef', match: { _id: user._id}})
            .then(async (accountOne: IAccount | null) => {
                return accountOne;
            })
            .catch((err: Error) => {
                throw new Error(err.message);
            });
    }

}


export default HelperLib;
