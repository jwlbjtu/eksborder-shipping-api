import { Document, Types } from 'mongoose';
import {
  ILabelResponse,
  IAddress,
  IWeight,
  IDimension
} from './shipping.types';

export interface ICarrier extends Document {
  id: Types.ObjectId;
  carrierName: string;
  accountName: string;
  description: string;
  clientId: string;
  clientSecret: string;
  accessKey?: string;
  accountNum?: string;
  returnAddress?: CarrierAddress;
  testClientId?: string;
  testClientSecret?: string;
  facilities?: IFacility[];
  testFacilities?: IFacility[];
  services?: IService[];
  shipperId?: string;
  regions: string[];
  isActive: boolean;
  thirdparties?: ThirdPartySummary[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFacility {
  pickup: string;
  facility: string;
}

export interface IService {
  key: string;
  id?: string;
  name: string;
}

export interface ThirdPartySummary {
  thirdpartyRef: string;
  condition: ThirdPartyCondition;
}

export interface IThirdPartyAccount extends Document {
  id: Types.ObjectId;
  name: string;
  carrier: string;
  accountNum: string;
  zipCode?: string;
  countryCode?: string;
  service: IService;
  region: string;
  condition: ThirdPartyCondition;
  price?: ThirdPartyPrice;
  zones?: string[];
  zoneMap?: ThirdPartyZoneMap[];
  rates: FeeRate[];
  carrierRef: string;
}

export interface ThirdPartyCondition {
  minWeight?: number;
  maxWeight?: number;
  weightUnit?: string;
}

export interface ThirdPartyPrice {
  weightUnit: string;
  currency: string;
  data: Record<string, string>[];
}

export interface ThirdPartyZoneMap {
  zone: string;
  maps: string;
}

export interface IBilling extends Document {
  userRef?: any;
  description: string;
  account?: string;
  total: number;
  balance: number;
  currency: string;
  details?: {
    shippingCost?: {
      amount: number;
      components?: {
        description: string;
        amount: number;
      }[];
    };
    fee?: {
      amount: number;
      type: string;
      base: string;
    };
  };
  addFund?: boolean;
  invoice?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShipping extends ILabelResponse, Document {
  accountName: string;
  rate: number;
  toAddress: IAddress;
  trackingId: string;
  shippingId?: string;
  manifested: boolean = false;
  packageInfo: {
    weight: IWeight;
    dimension?: IDimension;
  };
  userRef: Types.ObjectId;
  BillingRef: Types.ObjectId;
}

export interface ILog extends Document {
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  isError: boolean;
  callType: string;
  accountRef: Record<string, unknown>;
  userRef: Record<string, unknown>;
}

export interface FeeRate {
  ratebase: string;
  weightUnit?: WeightUnit;
  currency: Currency;
  rate: number;
  ratetype: CarrierRateType;
}
