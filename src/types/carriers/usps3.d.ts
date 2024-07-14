export interface USPS3_TOKEN_REQUEST {
  username: string;
  password: string;
}

export interface USPS3_TOKEN_RESPONSE {
  expires_in: number;
  token_type: string;
  access_token: string;
  message?: string;
  isSuccess?: boolean;
}

export interface USPS3_RATE_REQUEST {
  serviceCode: string;
  shipper: USPS3_ADDRESS;
  consignee: USPS3_ADDRESS;
  packages: USPS3_PACKAGE[];
}

export interface USPS3_RATE_RESPONSE {
  result: USPS3_RATE_RESULT;
  message: string;
  isSuccess: boolean;
  utcStamp: string;
}

export interface USPS3_LABEL_RESPONSE {
  result: USPS3_LABEL_RESULT[];
  message: string;
  isSuccess: boolean;
  utcStamp: string;
}

export interface USPS3_LABEL_RESULT {
  code: string;
  labelUrl: string;
  trackingNbr: string;
  orderNbr: string;
}

export interface USPS3_SHIPPING_REQUEST {
  orderNbr: string;
  serviceCode: string;
  shipper: USPS3_ADDRESS;
  consignee: USPS3_ADDRESS;
  idCardNbr?: string;
  distInfo?: string;
  parcels: USPS3_PARCEL[];
  serviceOptions?: { deliveryConfirmation: string };
}

export interface USPS3_SHIPPING_RESPONSE {
  result: USPS3_SHIPPING_RESULT;
  message: string;
  isSuccess: boolean;
  utcStamp: string;
}

export interface USPS3_SHIPPING_RESULT {
  poa: string;
  labels: string;
}

export interface USPS3_PARCEL {
  pickingInfos?: string[];
  weight: USPS3_WEIGHT;
  dimensions?: USPS3_DIMENSION;
  lineInfos: USPS3_LINE_INFO[];
}

export interface USPS3_LINE_INFO {
  goodsInfo: USPS3_GOODS_INFO;
  lineTotal: USPS3_LINE_TOTAL;
  quantity: number;
}

export interface USPS3_GOODS_INFO {
  name: string;
  localName?: string;
  sku?: string;
  spec?: string;
  brand?: string;
  model?: string;
  hsCode?: string;
}

export interface USPS3_LINE_TOTAL {
  value: number;
  unit: string;
}

export interface USPS3_RATE_RESULT {
  totalAmt: string;
  details: USPS3_CHARGE[];
}

export interface USPS3_CHARGE {
  chargeID: string;
  chargeAmt: string;
}

export interface USPS3_PACKAGE {
  weight: USPS3_WEIGHT;
  dimensions?: USPS3_DIMENSION;
  count: number;
}

export interface USPS3_WEIGHT {
  value: number;
  unit: string;
}

export interface USPS3_DIMENSION {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface USPS3_ADDRESS {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  street1: string;
  street2?: string;
  street3?: string;
  district?: string;
  city: string;
  province: string;
  postalCode: string;
  countryCode: string;
}
