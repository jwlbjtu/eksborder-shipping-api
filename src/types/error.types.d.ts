export interface IDHLeCommerceError {
    type: string,
    title: string,
    invalidParams?: IParamInfo[]
}

export interface IPBError {
    errorCode: string,
    errorDescription: string,
    additionalInfo: any,
    parameters: string[]
}

export interface IError {
    status: number,
    title: string,
    carrier?: string,
    error?: IParamInfo[]
}

export interface IParamInfo {
    name: string, 
    path?: string, 
    reason?: string
};

export interface IFormatDataOne {
    data: any,
    count: number,
    status: number
};

export interface IFormatDataErr {
    error: any,
    status: number
};