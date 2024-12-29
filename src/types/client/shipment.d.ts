import { extend } from 'lodash';
import { CustomDeclaration } from '../record.types';
import { IAddress } from '../shipping.types';

export interface CreateShipmentData {
  sender: IAddress;
  toAddress: IAddress;
  customDeclaration?: CustomDeclaration;
}

export interface UserShippingRateRequest {
  channel: string;
  toAddress: IAddress;
  weight: number; // LB
  length: number; // IN
  width: number; // IN
  height: number; // IN
}

export interface ApiShippingRateRequest {
  token: string;
  channelId: string;
  shipTo: ApiAddress;
  weight: number; // LB
  length: number; // IN
  width: number; // IN
  height: number; // IN
}

export interface ApiShippingCancelRequest {
  token: string;
  trackingNumbers: string[];
}
