import { Document } from 'mongoose';
import { IFacility, IService } from './record.types';

export interface IUserLogin extends Document {
  email: string;
  password: string;
  isActive: boolean;
}

export interface IUser extends Document {
  id: Types.ObjectId;
  salt: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  role: string;
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  countryCode: string;
  phone: string;
  isActive: boolean;
  companyName: string;
  logoImage?: string;
  balance: number;
  currency: string;
  apiToken?: string;
  tokens?: [
    {
      token: string;
    }
  ];
}

export interface IAccount extends Document {
  id: Types.ObjectId;
  accountName: string;
  accountId: string;
  carrier: string;
  connectedAccount: string;
  services: string[];
  facilities: string[];
  fee: number;
  feeBase: 'price' | 'order' | 'weight';
  billingType: 'proportions' | 'amount';
  carrierRef: any;
  userRef: any;
  note?: string;
  isActive: boolean;
}
