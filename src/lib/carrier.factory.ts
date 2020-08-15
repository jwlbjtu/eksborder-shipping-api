import DhlApi from "./carriers/dhl/Dhl.api";

type carrierType = 'dhl' | 'fedex' | 'ups' | 'usps';
class CarrierFactory {

    private carriersType: Array<String> = [];

    constructor(type: string, props?: object) {
        if (type == 'dhl') {
            // @ts-ignore
            return new DhlApi(props);
        }
    }
}

export default CarrierFactory;
