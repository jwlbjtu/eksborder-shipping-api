import {Response} from 'express'

interface IFormatDataOne {
    data: any,
    count: number,
    status: number
};

interface IFormatDataErr {
    error: any,
    status: number
};


class LRes {
    public resOk = (res: Response, data: any) => {
        if (data && data !== null && data !== undefined) {
            const formatData: IFormatDataOne = {
                data: data,
                count: data.length,
                status: res.statusCode,
            };
            res.send(formatData);
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

}

export default new LRes();
