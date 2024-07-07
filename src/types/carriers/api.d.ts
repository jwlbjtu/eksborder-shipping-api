import { FormData, LabelData, ShippingRate } from '../record.types';
import { RuiYunLableUrl } from './rui_yun';

export interface ApiLabelHandlerRequest {
  token: string;
  channelId: string;
  test: boolean;
  orderId?: string; // 订单唯一编号, 不填将自动生成
  signature?: string; // UPS签名服务 0:不需要签名（默认）1:需要签名 2：成人签名
  description?: string; // 货物描述 min: 1 max: 100
  referenceNumber?: string; // 参考号码 min: 1 max: 35
  specialRemarks?: string; // 特殊备注 min: 1 max: 100 fedex的时候才会起效果
  packageType: string; // 包装类型 M min:2 max:2 01：文件  02：包裹 03:PAK
  fretaxdutyType?: string; // 运费付款人 O min:1 max:1 R:收件人（默认）S:发件人 T:第三方 只能S,R
  sender?: ApiAddress;
  taxdutyType?: string; // 运费付款人 O min:1 max:1 R:收件人（默认）S:发件人 T:第三方 只能R,S,T
  shipTo: ApiAddress;
  packageList: ApiPackage[];
  invoice?: ApiInvoice; // 发票 货件类型为包裹时，必须填写发票信息
}

export interface ApiInvoice {
  currencyCode: string; // 币种 USD
  shipmentTerms: string; // 销售条款 FOB
  exportReason: string; // 出口理由 SAMPLE
  placeOfIncoterm?: string; // 港口名称
  insuranceCharges?: number; // 保险费 销售条款=“CRF”，"CIF"时必填
  freightCharges?: number; // 运费 销售条款=”CIF时必填
  invoiceDetailList?: ApiInvoiceDetail[];
}

export interface ApiInvoiceDetail {
  descriptionEn?: string; // 英文描述
  descriptionCn?: string; // 中文描述
  partNumber?: string; // 部件号
  commodityCode?: string; // 海关编码
  originalCountry?: string; // 原产国 C  min:1 max:2 国家二字
  weight?: number; // 重单位重量（Kg） C min:1 max:10单件品名的重量如果确定最终走TNT渠道，必填
  currencyValue?: number; // 单价 C min:1 max:10  单件品名的报关价值
  unitCount?: number; // 数量
  material?: string; // 材质
  materialEn?: string; // 材质英文
  attributel?: string; // 用途
  attributelEn?: string; // 用途英文
  brand?: string; // 品牌
  brandEn?: string; // 品牌英文
  model?: string; // 型号
  modelEn?: string; // 型号英文
  measure?: string; // 计量单位
  picUrl?: string; // 图片链接
  manufacture?: string; // 生产厂家
}

export interface ApiPackage {
  weight: number; // 重量 KG
  length?: number; // 长 cm
  width?: number; // 宽 cm
  height?: number; // 高 cm
  count: number; // 件数
}

export interface ApiAddress {
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  taxNumber?: string; // IOSS税号 O min:1 max:30
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string; // 国家 O min:1 max:40 国家二字码或英文全称参照
}

export interface ApiLableResponse {
  result: boolean;
  message?: string;
  errors?: any;
  orderId: string;
  invoiceUrl?: string;
  labelList: Array<{ labelBytes: string; labelType: string }>;
  labelUrlList: Array<{ labelUrl: string; type: string }>;
  packageList: Array<{ pacakgeId: string; trackingNumber: string }>;
  trackingNumber: string;
  channel: string;
  serviceType: string;
}

export interface ApiFinalResult {
  labelUrlList: RuiYunLableUrl[];
  invoiceUrl: string | undefined;
  labels: LabelData[];
  forms: FormData[] | undefined;
  shippingRate: ShippingRate[];
  rOrderId: string;
  trackingNum: string;
  turnChanddelId: string;
  turnServiceType: string;
}
