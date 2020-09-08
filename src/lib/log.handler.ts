import Loggind from "../models/log.model";
import { ILog } from "../types/record.types";

export const saveLog = async (call: string, req: object, res: object, account: object, user: object, isErr: boolean = false) => {
    // @ts-ignore
    const logData: ILog = {
        request: req,
        response: res,
        callType: call,
        isError: isErr,
        // @ts-ignore
        accountRef: account,
        // @ts-ignore
        userRef: user
    };

    // @ts-ignore
    if (isErr == true || (res.hasOwnProperty('status') && typeof res.status != "string")) {
        // @ts-ignore
        logData.response = {
            // @ts-ignore
            status: res.status,
            // @ts-ignore
            statusText: res.statusText,
            // @ts-ignore
            data: res.data,
            // @ts-ignore
            messages: res.data.title
        };
        // @ts-ignore
        logData.isError = true;
    }

    const logging = new Loggind(logData);

    try {
        return await logging.save();
    } catch (error) {
        return error;
    }
}