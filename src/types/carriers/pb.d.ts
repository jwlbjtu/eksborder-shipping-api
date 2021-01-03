export interface IPBRatesRequest {
  fromAddress: IPBAddress;
  toAddress: IPBAddress;
  parcel: IPBParcel;
  rates: IPBRate[];
  shipmentOptions: IPBShipmentOption[];
}

export type IPBRatesResponse = IPBRatesRequest;

export interface IPBShppingRequest {
  fromAddress: IPBAddress;
  toAddress: IPBAddress;
  parcel: IPBParcel;
  rates: IPBRate[];
  documents: IPBDocument[];
  shipmentOptions: IPBShipmentOption[];
}

export interface IPBShppingResponse extends IPBShppingRequest {
  parcelTrackingNumber: string;
  shipmentId: string;
}

export interface IPBManifestRequest {
  carrier: string;
  submissionDate: string;
  fromAddress: IPBAddress;
  parcelTrackingNumbers: string[];
  parameters?: { name: string; value: string }[];
}

export interface IPBManifestResponse extends IPBManifestRequest {
  manifestId?: string;
  manifestTrackingNumber: string;
  documents?: IPBDocument[];
}

export interface IPBAddress {
  addressLines: string[];
  cityTown: string;
  stateProvince?: string;
  postalCode: string;
  countryCode: string;
  company?: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface IPBParcel {
  weight: IPBWeight;
  dimension?: IPBDimension;
}

export interface IPBWeight {
  weight: number;
  unitOfMeasurement: 'BL' | 'OZ' | 'KG' | 'G';
}

export interface IPBDimension {
  length: number;
  width: number;
  height: number;
  unitOfMeasurement: 'IN' | 'CM';
}

export interface IPBRate {
  carrier: string;
  serviceId?: string;
  parcelType?: string;
  specialServices?: IPBSpecialService[];
  inductionPostalCode?: string;
  currencyCode: string;
  dimensionalWeight?: IPBWeight;
  baseCharge?: number;
  totalCarrierCharge?: number;
  surcharges?: IPBSurcharge[];
  deliveryCommitment?: IPBDeliveryCommitment;
  destinationZone?: string;
}

export interface IPBSpecialService {
  specialServiceId: string;
  fee?: number;
}

export interface IPBSurcharge {
  name: string;
  fee: number;
}

export interface IPBDeliveryCommitment {
  additionalDetails: string;
  estimatedDeliveryDateTime: string;
  guarantee: string;
  maxEstimatedNumberOfDays: string;
  minEstimatedNumberOfDays: string;
}

export interface IPBDocument {
  type?: string;
  contentType: string;
  size: string;
  fileFormat: string;
  resolution?: string;
  contents?: string;
  pages?: { contents: string }[];
  printDialogOption?: string;
}
