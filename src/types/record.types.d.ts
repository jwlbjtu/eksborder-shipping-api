import { Document, Types } from 'mongoose';
import {
  ILabelResponse,
  IAddress,
  IWeight,
  IDimension
} from './shipping.types';
import {
  Country,
  Currency,
  ShipmentStatus,
  WeightUnit
} from '../lib/constants';
import { ApiInvoice } from './carriers/api';
import { RuiYunLableUrl } from './carriers/rui_yun';

export interface ICarrier extends Document {
  id: Types.ObjectId;
  carrierName: string;
  accountName: string;
  description: string;
  clientId: string;
  clientSecret: string;
  accessKey?: string;
  accountNum?: string;
  hubId?: string;
  returnAddress?: CarrierAddress;
  testClientId?: string;
  testClientSecret?: string;
  testAccessKey?: string;
  testAccountNum?: string;
  testHubId?: string;
  facilities?: IFacility[];
  testFacilities?: IFacility[];
  services?: IService[];
  shipperId?: string;
  regions: string[];
  isActive: boolean;
  thirdparties?: ThirdPartySummary[];
  priceTable?: PriceTableSummary[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFacility {
  pickup: string;
  facility: string;
}

export interface IService {
  key: string;
  id?: string;
  name: string;
}

export interface PriceTableSummary {
  priceRef: string;
  condition: ThirdPartyCondition;
}

export interface ThirdPartySummary {
  thirdpartyRef: string;
  condition: ThirdPartyCondition;
}

export interface IThirdPartyAccount extends Document {
  id: Types.ObjectId;
  name: string;
  carrier: string;
  accountNum: string;
  zipCode?: string;
  countryCode?: string;
  service: IService;
  region: string;
  zoneMode: string;
  condition: ThirdPartyCondition;
  price?: ThirdPartyPrice;
  zones?: string[];
  zoneMap?: ThirdPartyZoneMap[];
  rates: FeeRate[];
  carrierRef: string;
  zoneMode: string;
  origin?: string;
}

export interface ThirdPartyCondition {
  minWeight?: number;
  maxWeight?: number;
  weightUnit?: string;
}

export interface ThirdPartyPrice {
  weightUnit: string;
  currency: string;
  data: Record<string, string>[];
}

export interface ThirdPartyZoneMap {
  zone: string;
  maps: string;
}

export interface IBilling extends Document {
  userRef?: any;
  description: string;
  account?: string;
  total: number;
  balance: number;
  deposit: number;
  clientDeposit: number;
  currency: string;
  details?: {
    shippingCost?: {
      amount: number;
      currency: Currency;
    };
    fee?: {
      amount: number;
      currency: Currency;
    };
  };
  addFund?: boolean;
  invoice?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShipmentData {
  orderId: string;
  rOrderId?: string;
  accountName?: string;
  carrierAccount?: string;
  carrier?: string;
  provider?: string;
  service?: IService;
  facility?: string;
  sender?: IAddress;
  toAddress: IAddress;
  return?: IAddress;
  signature?: string; // UPS签名服务 0:不需要签名（默认）1:需要签名 2：成人签名
  description?: string; // 货物描述 min: 1 max: 100
  referenceNumber?: string; // 参考号码 min: 1 max: 35
  specialRemarks?: string; // 特殊备注 min: 1 max: 100 fedex的时候才会起效果
  fretaxdutyType?: string; // 运费付款人 O min:1 max:1 R:收件人（默认）S:发件人 T:第三方 只能S,R
  taxdutyType?: string; // 运费付款人 O min:1 max:1 R:收件人（默认）S:发件人 T:第三方
  packageList: PackageInfo[];
  shipmentOptions: {
    shipmentDate: Date;
  };
  invoice?: ApiInvoice; // 发票 货件类型为包裹时，必须填写发票信息
  customDeclaration?: CustomDeclaration;
  customItems?: Item[];
  items?: Item[];
  status: string;
  trackingId?: string;
  trackingStatus?: string;
  shippingId?: string;
  rate?: ShipmentRate;
  labels?: LabelData[];
  labelUrlList?: RuiYunLableUrl[];
  invoiceUrl?: string;
  turnChannelId?: string;
  turnServiceType?: string;
  forms?: FormData[];
  manifested: boolean = false;
  userRef: Types.ObjectId;
  billingRef?: Types.ObjectId;
}

export interface IShipping extends Record<string, any>, Document {
  id: string;
  orderId: string;
  rOrderId?: string;
  accountName?: string;
  carrierAccount?: string;
  carrier?: string;
  provider?: string;
  service?: IService;
  facility?: string;
  sender?: IAddress;
  toAddress: IAddress;
  return?: IAddress;
  signature?: string; // UPS签名服务 0:不需要签名（默认）1:需要签名 2：成人签名
  description?: string; // 货物描述 min: 1 max: 100
  referenceNumber?: string; // 参考号码 min: 1 max: 35
  specialRemarks?: string; // 特殊备注 min: 1 max: 100 fedex的时候才会起效果
  fretaxdutyType?: string; // 运费付款人 O min:1 max:1 R:收件人（默认）S:发件人 T:第三方 只能S,R
  taxdutyType?: string; // 运费付款人 O min:1 max:1 R:收件人（默认）S:发件人 T:第三方 只能R,S,T
  packageList: PackageInfo[];
  shipmentOptions: {
    shipmentDate: Date;
  };
  invoice?: ApiInvoice; // 发票 货件类型为包裹时，必须填写发票信息
  customDeclaration?: CustomDeclaration;
  customItems?: Item[];
  items?: Item[];
  status: string;
  trackingId?: string;
  trackingStatus?: string;
  shippingId?: string;
  rate?: ShipmentRate;
  labels?: LabelData[];
  labelUrlList?: RuiYunLableUrl[];
  invoiceUrl?: string;
  turnChannelId?: string;
  turnServiceType?: string;
  forms?: FormData[];
  manifested: boolean = false;
  userRef: Types.ObjectId;
  billingRef?: Types.ObjectId;
}

export interface FormData {
  data: string;
  format: string;
  encodeType: string;
}

export interface LabelData {
  carrier: string;
  service: string;
  tracking: string;
  createdOn: Date;
  data: string;
  format: string;
  encodeType: string;
  isTest: boolean;
}

export interface CustomDeclaration {
  typeOfContent: string;
  typeOfContentOther?: string;
  incoterm: string;
  exporterRef?: string;
  importerRef?: string;
  invoice?: string;
  nonDeliveryHandling: string;
  license?: string;
  certificate?: string;
  signingPerson: string;
  taxIdType?: string;
  eelpfc?: string;
  b13a?: string;
  notes?: string;
}

export interface Item {
  id?: string;
  index?: number;
  itemTitle: string;
  quantity: number;
  itemWeight?: number;
  totalWeight?: number;
  itemWeightUnit?: WeightUnit;
  itemValue?: number;
  totalValue: number;
  itemValueCurrency: Currency;
  country?: Country;
  sku?: string;
  hsTariffNumber?: string;
  shipmentRef: Types.ObjectId;
}

export interface IItem extends Document {
  id?: string;
  index?: number;
  itemTitle: string;
  quantity: number;
  itemWeight: number;
  totalWeight: number;
  itemWeightUnit: WeightUnit;
  itemValue: number;
  totalValue: number;
  itemValueCurrency: Currency;
  country?: Country;
  sku?: string;
  hsTariffNumber?: string;
  shipmentRef: Types.ObjectId;
}

export interface ItemUpdateData extends Item {
  orderId: string;
  isCustom: boolean;
}

export interface PackageInfo {
  packageType: string;
  dimentions?: IDimension;
  weight: IWeight;
  count?: number;
}

export interface ShipmentRate {
  amount: number;
  currency: Currency | string;
}

export interface ILog extends Document {
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  isError: boolean;
  callType: string;
  accountRef: Record<string, unknown>;
  userRef: Record<string, unknown>;
}

export interface FeeRate {
  ratebase: string;
  weightUnit?: WeightUnit;
  currency: Currency;
  rate: number;
  ratetype: CarrierRateType;
}

export interface IPriceTable extends Document {
  id: Types.ObjectId;
  name: string;
  carrier: string;
  service: IService;
  region: string;
  condition: ThirdPartyCondition;
  price?: ThirdPartyPrice;
  zones?: string[];
  zoneMap?: ThirdPartyZoneMap[];
  rates: FeeRate[];
  carrierRef: string;
}

export interface ICustomServiceCondition {
  type: string;
  fields: { [key: string]: any };
}

export interface ISubService extends Document {
  name: string;
  code: string;
  conditions: ICustomServiceCondition[];
  isBackup: boolean;
}

export interface ICustomService extends Document {
  id: Types.ObjectId;
  name: string;
  description?: string;
  carrierId: Types.ObjectId;
  services: ISubService[];
  active: boolean;
}

export interface ShippingRate {
  rate: number;
  currency: Currency | string;
}
