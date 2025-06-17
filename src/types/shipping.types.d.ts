import { Document } from 'mongoose';
import { IAddress } from '../lib/carriers/flat/flat.helper';
import { DistanceUnit, WeightUnit } from '../lib/constants';
import { RuiYunLableUrl } from './carriers/rui_yun';

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
  test: boolean;
  ref?: string;
  additionalPackages?: IPackageDetail[];
}

export interface ILabelResponse {
  timestamp: Date;
  carrier: string;
  provider?: string;
  service: string;
  facility?: string;
  channelId: string;
  labels: ILabel[];
  labelUrlList: RuiYunLableUrl[];
  trackingNumber?: string;
  invoiceUrl?: string;
  ref?: string;
}

export interface IRateResponse {
  timestamp: Date;
  channelId: string;
  totalAmt: string;
  currency: string;
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
  test: boolean;
}

export interface IManifestResponse {
  timestamp: Date;
  carrier: string;
  provider?: string;
  carrierAccount: string;
  facility?: string;
  requestId: string;
  status?: 'CREATED' | 'IN PROGRESS' | 'COMPLETED';
  manifests?: IManifestObj[];
  manifestSummary?: IManifestSummary;
  trackingIds?: string[];
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

export interface IManifestObj {
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
  zip: string;
  email?: string;
  phone?: string;
  shipperNum?: string;
}

export interface IAddress extends Record<string, any> {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  country: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  taxNumber?: string;
  isResidential?: boolean;
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
  length?: number;
  width?: number;
  height?: number;
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
