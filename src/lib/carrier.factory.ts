import DhlApi from "./carriers/dhl/Dhl.api";
import { DHL_ECOMMERCE } from "./constants";

type carrierType = 'dhl ecommerce' | 'fedex' | 'ups' | 'usps';

class CarrierFactory {

    private carriersType: Array<String> = [];

    constructor(type: string, props?: object) {
        if (type === DHL_ECOMMERCE) {
            // @ts-ignore
            return new DhlApi(props);
        }
    }
}

export default CarrierFactory;
