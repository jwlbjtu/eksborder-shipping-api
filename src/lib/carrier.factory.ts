import {Response, Request, NextFunction} from 'express';
import DhlApi from "./carriers/dhl/Dhl.api";

type carrierType = 'dhl' | 'fedex' | 'ups' | 'usps';
class CarrierFactory {

    constructor(type: carrierType | string, props?: object) {
        if (type == 'dhl') {
            return new DhlApi(props);
        }
    }

}

export default CarrierFactory;
