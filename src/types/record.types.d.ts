import { Document } from 'mongoose';
import { ILabelResponse, IAddress } from './shipping.types';

export interface ICarrier extends Document {
  carrierName: string;
  accountName: string;
  clientId: string;
  clientSecret: string;
  isTest: boolean;
  returnAddress: IAddress;
  pickupRef: IPickup[];
  facilityRef: IFacility[];
  shipperId?: string;
  isActive: boolean;
}

export interface IPickup extends Document {
  pickupAccount: string;
  description: string;
  carrierRef: object;
  isActive: boolean;
}

export interface IFacility extends Document {
  facilityNumber: string;
  description: string;
  carrierRef: object;
  isActive: boolean;
}

export interface IBilling extends Document {
  userRef?: object;
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
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShipping extends ILabelResponse, Document {
  toAddress: IAddress;
  trackingId: string;
  shippingId?: string;
  manifested: boolean = false;
  userRef: object;
}

export interface ILog extends Document {
  request: object;
  response: object | any;
  isError: boolean;
  callType: string;
  accountRef: object;
  userRef: object;
}
