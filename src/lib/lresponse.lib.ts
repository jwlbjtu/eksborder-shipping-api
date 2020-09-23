import { Response } from 'express'
import { errorTypes } from './constants';
import { IFormatDataErr, IParamInfo, IError } from '../types/error.types';

class LRes {
    public getError = (status: number, title: string) => {
        return {status, title};
    }

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

    public invalidParamsErr = (status: number = 500, title: string, carrier?: string, error?: IParamInfo[]) => {
        const errData: IError = {
            status,
            title,
            carrier,
            error
        }
        return errData;
    };

    public fieldErr = (name: string, path: string, type: string, value?: any, carrier?: string) => {
        let reason: string | undefined = undefined;
        switch (type) {
            case errorTypes.MISSING:
                reason = `required key [${name}] not found`;
                break;
            case errorTypes.UNSUPPORTED:
                reason = `Unsupported value [${value}] for key [${name}]`;
                break;
            case errorTypes.EMPTY:
                reason = "Expected minimum item count: 1, found: 0";
                break;
            case errorTypes.INVALID:
                reason = `Invalid value [${value}] for key [${name}]`
                break;
            case errorTypes.ACCOUNT_ERROR:
                reason = `Account [${value}] cannot be used for [${carrier}]`;
                break;
            default:
                break;
        }
        
        let errBody: IParamInfo | undefined = undefined;
        if(reason) {
            errBody = {
                name,
                path,
                reason
            };
        }

        return this.invalidParamsErr(
            400, 
            "Validation Failed", 
            carrier,
            errBody? [errBody] : errBody
        );
    }
}

export default new LRes();
