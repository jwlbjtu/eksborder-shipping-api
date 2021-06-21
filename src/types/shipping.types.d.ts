import { Document } from 'mongoose';
import { IAddress } from '../lib/carriers/flat/flat.helper';

export interface IProductRequest {
  carrier: string;
  provider?: string;
  carrierAccount: string;
  merchantId?: string;
  service?: string;
  facility?: string;
  toAddress: IAddress;
  fromAddress?: IAddress;
  packageDetail: IPackageDetail;
  rate: IRate;
  estimatedDeliveryDate: IEstimatedDeliveryDate;
}

export interface IProductResponse extends IProductRequest {
  products?: IProduct[];
}

export interface ILabelRequest {
  carrier: string;
  provider?: string;
  carrierAccount: string;
  merchantId?: string;
  service: string;
  facility?: string;
  toAddress: IAddress;
  fromAddress?: IAddress;
  packageDetail: IPackageDetail;
  rate: { currency: string };
}

export interface ILabelResponse {
  timestamp: Date;
  carrier: string;
  provider?: string;
  service: string;
  facility?: string;
  carrierAccount: string;
  labels: ILabel[];
  shippingId?: string;
}

export interface IManifestRequest {
  carrier: string;
  provider?: string;
  carrierAccount: string;
  facility?: string;
  manifests: [
    {
      trackingIds: string[];
    }
  ];
}

export interface IManifestResponse extends Document {
  timestamp: Date;
  carrier: string;
  provider?: string;
  carrierAccount: string;
  facility?: string;
  requestId: string;
  status?: 'CREATED' | 'IN PROGRESS' | 'COMPLETED';
  manifests?: IManifest[];
  manifestSummary?: IManifestSummary;
  trackingIds?: string[];
  userRef: any;
}

export interface IProduct {
  carrier?: string;
  service?: string;
  parcelType?: string;
  productName?: string;
  description?: string;
  trackingAvailable?: string;
  dimentionalWeight?: IWeight;
  rate?: {
    amount: number;
    currency: string;
    rateComponents: {
      description: string;
      amount: number;
    }[];
  };
  estimatedDeliveryDate?: {
    isGuaranteed: boolean;
    deliveryDaysMin: number;
    deliveryDaysMax: number;
    estimateDeliveryMin: string;
    estimateDeliveryMax?: string;
  };
  messages?: {
    messageText: string;
  }[];
}

export interface ILabel {
  createdOn: Date;
  trackingId: string;
  labelData: string;
  encodeType: string;
  format: string;
  parcelType?: string;
}

export interface IManifest {
  createdOn: Date;
  manifestId?: string;
  total: number;
  manifestData: string;
  encodeType: string;
  format: string;
}

export interface IManifestSummary {
  total: number;
  invalid: {
    total: number;
    trackingIds?: IManifestSummaryError[];
  };
}

export interface IManifestSummaryError {
  trackingId: string;
  errorCode: string;
  errorDescription: string;
}

export interface CarrierAddress {
  name?: string;
  attentionName?: string;
  company?: string;
  taxIdNum?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  email?: string;
  phone?: string;
  shipperNum?: string;
}

export interface IAddress {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  email?: string;
  phone?: string;
}

export interface IPackageDetail {
  packageId?: string;
  packageDescription?: string;
  weight: IWeight;
  dimension?: IDimension;
  billingReference1?: string;
  billingReference2?: string;
  parcelType?: string;
}

export interface IWeight {
  value: number;
  unitOfMeasure: WeightUnit;
}

export interface IDimension {
  length: number;
  width: number;
  height: number;
  unitOfMeasure: DistanceUnit;
}

export interface IRate {
  calculate: boolean = true;
  currency: string = 'USD';
  rateDate?: Date;
  maxPrice?: number;
}

export interface IEstimatedDeliveryDate {
  calculate: boolean = true;
  deliveryBy?: Date;
  expectedShipDate?: Date;
  expectedTransit?: number;
}

export interface IFlatShippingInfo {
  fromAddress: IAddress;
  toAddress: IAddress;
  service: string;
  number: number;
  weight: string;
}
