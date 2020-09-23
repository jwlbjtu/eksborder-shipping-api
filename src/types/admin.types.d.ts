import { IAddress, IPackageDetail, IRate, IEstimatedDeliveryDate } from "./shipping.types";

export interface IAdminProductRequest {
    carrier: string,
    provider?: string,
    service?: string,
    pickup?: string,
    distributionCenter?: string,
    toAddress: IAddress,
    fromAddress?: IAddress,
    packageDetail: IPackageDetail,
    rate: IRate,
    estimatedDeliveryDate: IEstimatedDeliveryDate
}