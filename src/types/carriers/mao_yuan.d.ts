export interface MaoYuanCredentials {
  account: string;
  password: string;
  secretKey: string;
}

export type MaoYuanAuthRequest = {
  account: string;
  password: string;
  secretKey: string;
};

export type MaoYuanAuthResponse = {
  code: number;
  msg: string;
  time: string;
  data: {
    token: string;
    expires_in: number;
  };
};

export type maoYuanLabelReqBody = {
  channelId: number;
  row: MaoYuanLabelReqData;
};

export type MaoYuanLabelReqData = {
  orderTransactionId: string; // max 32 char
  shipperName: string;
  shipperCompany: string;
  shipperTax: string;
  shipperExtension: string;
  shipperEmail: string;
  shipperPhone: string;
  shipperCountry: string;
  shipperAddrOne: string;
  shipperAddrTwo: string;
  shipperAddrThree: string;
  shipperPostalCode: string;
  shipperProvince: string;
  shipperCity: string;
  isResidence: string; // 枚举值 0=否 1=是
  recipientName: string;
  recipientCompany: string;
  recipientTax: string;
  recipientPhone: string;
  recipientExtension: string;
  recipientEmail: string;
  recipientCountry: string;
  recipientAddrOne: string;
  recipientAddrTwo: string;
  recipientAddrThree: string;
  recipientPostalCode: string;
  recipientProvince: string;
  recipientCity: string;
  isResidencetwo: string; // 枚举值 0=否 1=是
  packing: string;
  paymentFedex: string;
  packingContent: MaoYuanLabelPackingContent[];
};

export type MaoYuanLabelPackingContent = {
  reference: string;
  name: number;
  weight: number;
  unit: string;
  long: number;
  width: number;
  height: number;
  longunit: string;
};

export type MaoYuanLabelRepFedex = {
  code: number;
  msg: string;
  time: string;
  data: {
    list: MaoYuanLabelRepFedexData[];
    masterTrackingNumber: string;
    customerTransactionId: string;
    baseCharge: number;
    totalFreightDiscounts: number;
    netFreight: number;
    totalSurcharges: number;
    baseRateAmount: number;
    actualAmount: number;
    currency: string;
    rateZone: string;
    chargingWeight: number;
    estimateWeight: number;
    quantity: number;
  };
};

export type MaoYuanLabelRepUps = {
  code: number;
  msg: string;
  time: string;
  data: MaoYuanLabelUpsData;
};

export type MaoYuanLabelUpsData = {
  baseCharge: string;
  list: MaoYuanLabelRepUpsData[];
  masterTrackingNumber: string;
  rateZone: string;
  chargingWeight: string;
  baseRaeAmount: string;
  totalSurcharges: string;
  netFreight: string;
  totalFreightDiscounts: string;
  currency: string;
  actualAmount: string;
  esmateWeight: string;
  quantity: string;
};

export type MaoYuanLabelRepUpsData = {
  trackingNumber: string;
  baseRateAmount: number;
  packageDocuments: MaoYuanLabelPackageDocument[];
};

export type MaoYuanLabelRepFedexData = {
  masterTrackingNumber: string;
  deliveryDatestamp: string;
  trackingNumber: string;
  additionalChargesDiscount: number;
  netRateAmount: number;
  netChargeAmount: number;
  netDiscountAmount: number;
  packageDocuments: MaoYuanLabelPackageDocument[];
  currency: string;
  customerReferences: MaoYuanCustomerReference[];
  baseRateAmount: number;
  codcollectionAmount: number;
};

export type MaoYuanLabelPackageDocument = {
  contentType: string;
  copiesToPrint: number;
  encodedLabel: string;
  docType: string;
};

export type MaoYuanCustomerReference = {
  customerReferenceType: string;
  value: string;
};

export type MaoYuanLabelUrlRep = {
  code: number;
  msg: string;
  time: string;
  data: {
    urlPdf: string;
  };
};

export type MaoYuanRateReqBody = {
  channelId: number;
  row: MaoYuanRateReqData;
};

export type MaoYuanRateReqData = {
  shipperCountry: string;
  shipperAddrOne: string;
  shipperAddrTwo: string;
  shipperAddrThree: string;
  shipperPostalCode: string;
  shipperProvince: string;
  shipperCity: string;
  isResidence: string;
  recipientCountry: string;
  recipientAddrOne: string;
  recipientAddrTwo: string;
  recipientAddrThree: string;
  recipientPostalCode: string;
  recipientProvince: string;
  recipientCity: string;
  isResidencetwo: string;
  packing: string;
  packingContent: MaoYuanRatePackingContent[];
};

export type MaoYuanRatePackingContent = {
  name: number;
  weight: number;
  unit: string;
  long: number;
  width: number;
  height: number;
  longunit: string;
};

export type MaoYuanRateResponse = {
  code: number;
  msg: string;
  time: string;
  data: MaoYuanRateData;
};

export type MaoYuanRateData = {
  billingWeight: string;
  baseCharge: string;
  rateZone: string;
  ratedPackages: MaoYuanRatedPackage[];
  baseRateAmount: string;
  totalFreightDiscount: number;
  netFreight: number;
  totalSurcharges: number;
  netFedExCharge: string;
  actualAmount: number;
  currencyCode: string;
  currency: string;
  surCharges: MaoYuanSurcharge[];
  id: number;
};

export type MaoYuanRatedPackage = {
  netCharge: string;
  unit: string;
  weight: string;
};

export type MaoYuanSurcharge = {
  type: string;
  description: string;
  amount: string;
  currency: string;
};
