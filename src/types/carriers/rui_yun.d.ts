export interface RuiYunLabelBody {
  'soapenv:Body': {
    'ser:orderShip': {
      request: RuiYunLabelRequest;
    };
  };
}

export interface RuiYunLabelRequest {
  clientInfo: RuiYunClientInfo;
  orderList: RuiYunOrder[];
}

export interface RuiYunClientInfo {
  bankerId: string;
  userId: string;
  plantId: string;
  plantKey: string;
}

export interface RuiYunOrder {
  signature?: string; // UPS签名服务 0:不需要签名（默认）1:需要签名2:成人签名 length:1-1 [只能0,1,2]
  orderId?: string; // 批量订单号ID 仅页面批量下单时使用 [半角英数]
  priceId: string; // 客户路线ID
  description?: string; // 货件描述 length:1-100
  referenceNumber?: string;
  remark?: string;
  ppTransactionId?: string;
  packageType: string; // 包装类型 01：文件  02：包裹 03:PAK length:2-2  [只能01,02,03]
  taxdutyType?: string; // 税款付款人 R:收件人（默认）S:发件人T:第三方 length:1-1 [只能R,S,T]
  shipTo: RuiYunShipTo;
  packageList: RuiYunPackage[];
  invoice?: RuiYunInvoice; // 发票货件类型为包裹时，必须填写发票信息
}

export interface RuiYunShipTo {
  userName: string;
  companyName: string;
  phoneNumber: string;
  email?: string;
  taxNumber?: string;
  address: RuiYunAddress;
}

export interface RuiYunAddress {
  address1: string;
  address2?: string;
  address3?: string;
  city: string;
  country: string;
  province?: string;
  postalCode?: string;
}

export interface RuiYunPackage {
  weight: number; // 重量 单位：lb
  length?: number; // 长 单位：in
  width?: number; // 宽 单位：in
  height?: number; // 高 单位：in
  count: v; // 件数
}

export interface RuiYunInvoice {
  currencyCode: string; // USD
  shipmentTerms: string; // FOB
  exportReason: string; // SAMPLE
  insuranceCharges?: number; // 保费 销售条款=“CRF”，"CIF"时必填  length:1-10
  freightCharges?: number; // 运费 销售条款=”CIF时必填  length:1-10
  invoiceDetailList: RuiYunInvoiceDetail[]; // 发票明细支持多品名
}

export interface RuiYunInvoiceDetail {
  descriptionEn: string;
  descriptionCn: string;
  partNumber: string;
  commodityCode: string;
  originCountry: string; // CN
  weight: number; // KG
  currencyValue: number;
  unitCount: number;
  measure: string; // PCS
}

export interface RuiYunLabelResponse {
  return: RuiYunLabelReturn;
}

export interface RuiYunLabelReturn {
  result: boolean;
  orderResult: RuiYunLabelOrderResult[] | RuiYunLabelOrderResult;
  message?: string;
}

export interface RuiYunLabelOrderResult {
  result: boolean;
  messages?: RuiYunOrderResultMessage | RuiYunOrderResultMessage[];
  invoice: string;
  invoiceUrl?: string;
  labeList: RuiYunLabel[];
  labeUrlList: RuiYunLableUrl | RuiYunLableUrl[];
  orderId: string;
  packageList: RuiYunLabelPackage | RuiYunLabelPackage[];
  trackingNumCha: string;
  trackingNumSys: string;
  turnChannelId: string;
  turnServiceType: string;
  rOrderId: string;
}

export interface RuiYunLableUrl {
  labelUrl: string;
  type: string;
}

export interface RuiYunOrderResultMessage {
  code: string;
  text: string;
}

export interface RuiYunLabel {
  labelBytes: string;
  labelType: string;
}

export interface RuiYunLabelPackage {
  packageId: string;
  tracnkingNum: string;
  trackingNumCha: string;
}

export interface RuiYunCredentials {
  bankerId: string;
  userId: string;
  plantId: string;
  plantKey: string;
}
