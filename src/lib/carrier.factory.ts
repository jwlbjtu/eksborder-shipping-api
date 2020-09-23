import { DHL_ECOMMERCE, PITNEY_BOWES, errorTypes } from "./constants";
import { IAccount, IUser } from "../types/user.types";
import LRes from "../lib/lresponse.lib";
import DhlApi from "./carriers/dhl/Dhl.api";
import PbApi from "./carriers/pb/Pb.api";

class CarrierFactory {

    static getCarrierAPI(type: string, props: {account: IAccount, user: IUser}) {
        switch (type) {
            case DHL_ECOMMERCE:
                console.log("DHL ECOMMERCE API");
                return new DhlApi(props);
            case PITNEY_BOWES:
                console.log("PITNEY BOWES API");
                return new PbApi(props);        
            default:
                throw LRes.fieldErr("carrier", "/", errorTypes.UNSUPPORTED, type);
        }
    }
}

export default CarrierFactory;
