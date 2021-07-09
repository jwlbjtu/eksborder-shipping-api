import { Country } from '../constants';
import { Document, Types } from 'mongoose';

export interface OrderAddress extends Record<string, any> {
  id?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country: Country | string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip?: string;
}

export interface ClientAddressCreateData
  extends Record<string, string | undefined | boolean> {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country: Country;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip?: string;
  isDefaultSender: boolean;
  isDefaultReturn: boolean;
}

export interface ClientAddress extends ClientAddressCreateData {
  id: string;
}

export interface IClientAddress extends Document {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country: Country;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip?: string;
  isDefaultSender: boolean;
  isDefaultReturn: boolean;
  userRef: Types.ObjectId;
}
