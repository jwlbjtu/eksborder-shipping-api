import { Document, Types } from 'mongoose';
import { ILabelResponse, IAddress } from './shipping.types';

export interface ICarrier extends Document {
  id: Types.ObjectId;
  carrierName: string;
  accountName: string;
  description: string;
  clientId: string;
  clientSecret: string;
  facilities: IFacility[];
  services: IService[];
  returnAddress: IAddress;
  shipperId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFacility {
  pickup: string;
  facility: string;
}

export interface IService {
  key: string;
  name: string;
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
