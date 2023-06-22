import { FormData, IShipping, LabelData, ShipmentData } from '../record.types';
import { IAddress } from '../shipping.types';
import { IUser } from '../user.types';
import { IManifest, ManifestData, TrackingInfo } from './dhl_ecommerce';

//********** Carrier API *********//
export interface ICarrierAPI {
  init: () => Promise<void>;
  auth: () => Promise<void>;
  products: (
    shipmentData: IShipping | ShipmentData,
    isInternational: boolean
  ) => Promise<{ rates: Rate[]; errors: string[] } | string>;
  label: (
    shipmentData: IShipping,
    rate: Rate
  ) => Promise<{
    labels: LabelData[];
    forms: FormData[] | undefined;
    shippingRate: ShippingRate[];
  }>;
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

interface TrackingResponse {
  carrier: string;
  trackingNumber: string;
  shipper: IAddress;
  recipient: IAddress;
  lastestStatus: ITrackingStatus;
  scanEvents: IScanEvent[];
}

interface ITrackingStatus {
  status: string;
  description: string;
  location: IAddress;
  delayDetail: string;
}

interface IScanEvent {
  date: Date;
  event: string;
  scanLocation: IAddress;
  locationType?: string;
  delayDetail?: string;
}
