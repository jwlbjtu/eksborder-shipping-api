import { Document, Types } from 'mongoose';
import { ClientAddress } from './client/address';
import { PackageUnits } from './client/packageUnits';
import { PrintFormat } from './client/printformat';
import { FeeRate, IFacility, IService } from './record.types';

export interface IUserLogin extends Document {
  email: string;
  password: string;
}

export interface UserData {
  id: Types.ObjectId;
  fullName: string;
  firstName: string;
  lastName: string;
  userName: string;
  role: string;
  email: string;
  countryCode: string;
  phone: string;
  companyName: string;
  logoImage?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  token_type: string;
  token: string;
  tokenExpire: number;
}

export interface ClientInfo {
  id: Types.ObjectId;
  fullName: string;
  firstName: string;
  lastName: string;
  userName: string;
  role: string;
  email: string;
  countryCode: string;
  phone: string;
  companyName: string;
  logoImage?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  token_type: string;
  token: string;
  tokenExpire: number;
  printFormat?: PrintFormat;
  packageUnits?: PackageUnits;
  clientAccounts?: ClientAccount[];
  clientAddresses?: ClientAddress[];
}

export interface IUser extends Document {
  id: Types.ObjectId;
  salt: string;
  email: string;
  fullName: string;
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
  minBalance: number;
  currency: string;
  apiToken?: string;
  tokens?: {
    token: string;
  }[];
  resetToken?: string;
  resetTokenExpiration?: number;
  uploading: boolean;
  printFormat?: PrintFormat;
  packageUnits?: PackageUnits;
  accountRef?: IAccount[];
  addresses?: ClientAddress[];
  comparePassword: (password: string) => Promise<boolean>;
  generateJWT: (expTime?: number) => string;
  toAuthJSON: () => Promise<UserData>;
  apiAuthJSON: () => Promise<ApiAuthData>;
  toClientInfo: () => Promise<ClientInfo>;
}

export interface ApiAuthData {
  email: string;
  token: string;
  token_type: string;
}

export interface IAccount extends Document {
  id: Types.ObjectId;
  accountName: string;
  accountId: string;
  carrier: string;
  connectedAccount: string;
  services: IService[];
  facilities: string[];
  rates: FeeRate[];
  thirdpartyPrice: boolean;
  carrierRef: any;
  userRef: any;
  note?: string;
  isActive: boolean;
}

export interface ClientAccount {
  id: Types.ObjectId;
  accountName: string;
  accountId: string;
  carrier: string;
  connectedAccount: string;
  services: IService[];
  facilities: string[];
  carrierRef: any;
  userRef: any;
  note?: string;
  isActive: boolean;
}

export interface ClientUpdateData {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  countryCode: string;
  phone: string;
  password: string;
  newPassword?: string;
  confirmPassword?: string;
}
