import { FormData, IShipping, LabelData } from '../record.types';
import { IUser } from '../user.types';
import { ApiFinalResult } from './api';
import { IManifest, ManifestData, TrackingInfo } from './dhl_ecommerce';

//********** Carrier API *********//
export interface ICarrierAPI {
  init: () => Promise<void>;
  auth: () => Promise<void>;
  products: (
    shipmentData: IShipping,
    isInternational: boolean
  ) => Promise<{ rates: Rate[]; errors: string[] } | string>;
  label: (shipmentData: IShipping, rate: Rate) => Promise<ApiFinalResult>;
  createManifest?: (
    shipments: IShipping[],
    user: IUser
  ) => Promise<ManifestData[]>;
  getManifest?: (manifest: IManifest) => Promise<IManifest>;
  getTrackingInfo?: (tracking: string) => Promise<TrackingInfo[]>;
  validateAddress?: (address: IAddress, isTest: boolean) => Promise<boolean>;
}

export interface Rate {
  carrier: string;
  serviceId: string;
  service: string;
  account?: string;
  rate?: number;
  currency?: Currency | string;
  eta?: string;
  isTest: boolean;
  thirdparty?: boolean;
  thirdpartyAcctId?: string;
  clientCarrierId: string;
}
