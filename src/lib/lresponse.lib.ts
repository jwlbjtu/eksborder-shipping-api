import {Response, response} from 'express'
import { errorTypes } from './carriers/constants';

interface IFormatDataOne {
    data: any,
    count: number,
    status: number
};

interface IFormatDataErr {
    error: any,
    status: number
};

export interface IInvalidParamsErr {
    invalidParams: Array<IParamInfo>
};

export interface IParamInfo {
    name: string, 
    path: string, 
    reason: string
};

class LRes {
    public resOk = (res: Response, data: any) => {
        if (data && data !== null && data !== undefined) {
            data.count = data.length;
            res.send(data);
        } else {
            this.resErr(res, 404, "Not Found")
        }
    };

    public resErr = (res: Response, status: number, data: any) => {
        if (typeof data === "string" || typeof data === "object") {
            data = {
                message: data
            }
        }
        const formatData: IFormatDataErr = {
            error: data,
            status: status,
        };
        res.status(status).send(formatData);
    };

    public invalidParamsErr = (status: number = 500, title: string, carrier: string, error: IInvalidParamsErr | null = null) => {
        const errData = {
            status,
            title,
            carrier,
            invalidParams: error
        }
        return errData;
    };

    public fieldErr = (name: string, path: string, type: string, value?: any, carrier?: string | null) => {
        let reason = "Unknown Error";
        switch (type) {
            case errorTypes.MISSING:
                reason = `required key [${name}] not found`;
                break;
            case errorTypes.UNSUPPORTED:
                reason = `Unsupported value [${value}] for [${name}]`;
                break;
            case errorTypes.EMPTY:
                reason = "expected minimum item count: 1, found: 0";
                break;
            default:
                break;
        }
        
        const errBody: IParamInfo = {
            name,
            path,
            reason
        };

        const arrBody: IInvalidParamsErr = {
            invalidParams: [errBody]
        };

        return this.invalidParamsErr(
            400, 
            "Static Validation Failed", 
            // @ts-ignore
            carrier,
            arrBody
        );
    }
}

export default new LRes();
