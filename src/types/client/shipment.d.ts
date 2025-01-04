import { extend } from 'lodash';
import { CustomDeclaration } from '../record.types';
import { IAddress } from '../shipping.types';
import { ApiPackage } from '../carriers/api';

export interface CreateShipmentData {
  sender: IAddress;
  toAddress: IAddress;
  customDeclaration?: CustomDeclaration;
}

export interface UserShippingRateRequest {
  channel: string;
  toAddress: IAddress;
  packageList: ApiPackage[];
}

export interface ApiShippingRateRequest {
  token: string;
  channelId: string;
  shipTo: ApiAddress;
  packageList: ApiPackage[];
}

export interface ApiShippingCancelRequest {
  token: string;
  trackingNumbers: string[];
}
