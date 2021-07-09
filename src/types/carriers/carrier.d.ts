import { FormData, IShipping, LabelData } from '../record.types';
import { IUser } from '../user.types';
import { IManifest, ManifestData, TrackingInfo } from './dhl_ecommerce';

//********** Carrier API *********//
export interface ICarrierAPI {
  init: () => Promise<void>;
  auth: () => Promise<void>;
  products: (
    shipmentData: IShipping,
    isInternational: boolean
  ) => Promise<{ rates: Rate[]; errors: string[] } | string>;
  label: (
    shipmentData: IShipping,
    rate: Rate
  ) => Promise<{ labels: LabelData[]; forms: FormData[] | undefined }>;
  createManifest?: (
    shipments: IShipping[],
    user: IUser
  ) => Promise<ManifestData[]>;
  getManifest?: (manifest: IManifest) => Promise<IManifest>;
  getTrackingInfo?: (tracking: string) => Promise<TrackingInfo[]>;
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
