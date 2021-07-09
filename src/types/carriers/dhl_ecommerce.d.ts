export interface IDHLeCommerceProductRequest {
  pickup: string;
  distributionCenter: string;
  orderedProductId?: string;
  consigneeAddress: IDHLeCommerceAddress;
  returnAddress: IDHLeCommerceAddress;
  packageDetail: IDHLeCommercePackageDetail;
  customsDetails?: IDHLeCommerceCustomsDetail[];
  rate: IDHLeCommerceRate;
  estimatedDeliveryDate: IDHLeCommerceEstimatedDeliveryDate;
}

export interface IDHLeCommerceProductResponse
  extends IDHLeCommerceProductRequest {
  products?: [IDHLeCommerceProduct];
  invalidParams?: IDHLeCommerceProductError[];
}

export interface IDHLeCommerceProductError {
  name: string;
  path: string;
  reason: string;
}

export interface IDHLeCommerceLabelRequest {
  pickup: string;
  distributionCenter: string;
  orderedProductId: string;
  consigneeAddress: IDHLeCommerceAddress;
  returnAddress: IDHLeCommerceAddress;
  packageDetail: IDHLeCommercePackageDetail;
  customsDetails?: IDHLeCommerceCustomsDetail[];
}

export interface IDHLeCommerceLabelResponse {
  timestamp: Date;
  pickup: string;
  distributionCenter: string;
  orderedProductId: string;
  labels: IDHLeCommerceLabel[];
}

export interface IDHLeCommerceLabel {
  createdOn: Date;
  packageId: string;
  dhlPackageId: string;
  trackingId?: string;
  labelData: string;
  encodeType: string;
  format: string;
  link: string;
  labelDetail?: IDHLeCommerceLabelDetail;
}

export interface IDHLeCommerceLabelDetail {
  serviceLevel: string;
  outboundSortCode: string;
  sortingSetupVersion: string;
  inboundSortCode: string;
  serviceEndorsement: string;
  intendedReceivingFacility: string;
  mailBanner: string;
  customsDetailsProvided: boolean;
}

export interface IDHLeCommerceManifestRequest {
  pickup: string;
  manifests: [
    {
      dhlPackageIds: string[];
    }
  ];
}

export interface IDHLeCommerceManifestResponse {
  timestamp: Date;
  requestId: string;
  link: string;
  pickup?: string;
  status?: 'CREATED' | 'IN PROGRESS' | 'COMPLETED';
  manifests?: IDHLeCommerceManifest[];
  manifestSummary?: IDHLeCommerceManifestSummary;
}

export interface IDHLeCommerceManifest {
  createdOn: Date;
  manifestId: string;
  distributionCenter: string;
  isInternational: boolean;
  total: number;
  manifestData: string;
  encodeType: string;
  format: string;
}

export interface IDHLeCommerceManifestSummary {
  total: number;
  invalid: {
    total: number;
    dhlPackageIds?: IDHLeCommerceManifestSummaryError[];
  };
}

export interface IDHLeCommerceManifestSummaryError {
  dhlPackageId: string;
  errorCode: string;
  errorDescription: string;
}

export interface IDHLeCommerceProduct {
  orderedProductId: string;
  productName: string;
  description: string;
  trackingAvailable: string;
  rate?: {
    priceZone: string;
    amount: number;
    currency: string;
    rateComponents: [
      {
        rateComponentId: string;
        partId: string;
        description: string;
        amount: number;
      }
    ];
  };
  estimatedDeliveryDate?: {
    isGuaranteed: boolean;
    deliveryDaysMin: number;
    deliveryDaysMax: number;
    estimateDeliveryMin: string;
    estimateDeliveryMax: string;
  };
  messages?: [
    {
      messageId: string;
      messageText: string;
    }
  ];
}

export interface IDHLeCommerceAddress {
  name?: string;
  companyName?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  email?: string;
  phone?: string;
}

export interface IDHLeCommercePackageDetail {
  packageId: string;
  packageDescription?: string;
  weight: IDHLeCommerceWeight;
  dimension?: IDHLeCommerceDimension;
  shippingCost?: IDHLeCommerceShippingCost;
  billingReference1?: string;
  billingReference2?: string;
}

export interface IDHLeCommerceWeight {
  value: number;
  unitOfMeasure: string; // 'LB' | 'OZ' | 'KG' | 'G';
}

export interface IDHLeCommerceDimension {
  length: number;
  width: number;
  height: number;
  unitOfMeasure: string; // 'IN' | 'CM';
}

export interface IDHLeCommerceShippingCost {
  currency: string;
  tax?: number;
  freight?: number;
  duty?: number;
  declaredValue?: number;
  insuredValue?: number;
  dutiesPaid?: boolean;
}

export interface IDHLeCommerceRate {
  calculate: boolean = true;
  currency: string = 'USD';
  rateDate?: string;
  maxPrice?: number;
}

export interface IDHLeCommerceEstimatedDeliveryDate {
  calculate: boolean = true;
  deliveryBy?: Date;
  expectedShipDate?: Date;
  expectedTransit?: number;
}

export interface IDHLeCommerceTrackingResponse {
  total: number;
  limit: number;
  offset: number;
  timestamp: string;
  packages: IDHLeComerceTrackingPackage[];
}

export interface IDHLeComerceTrackingPackage {
  recipient: IDHLeCommerceAddress;
  events: IDHLeCommerceTrackingEvent[];
}

export interface IDHLeCommerceTrackingEvent {
  location: string;
  date: string;
  time: string;
  timeZone: string;
  postalCode: string;
  country: string;
  primaryEventId: number;
  primaryEventDescription: string;
}

export interface IDHLeCommerceCustomsDetail {
  itemDescription: string;
  countryOfOrigin: string;
  hsCode?: string;
  packagedQuantity: number;
  itemValue: number;
  currency: string;
  skuNumber: string;
  productUrl?: string;
}

export interface ManifestData {
  carrier: string;
  timestamp?: Date;
  facility?: string;
  pickup?: string;
  requestId?: string;
  status?: string;
  link?: string;
  manifests: ManifestObj[];
  manifestErrors: string[];
  userRef?: Types.ObjectId;
  carrierRef: Types.ObjectId;
}

export interface IManifest extends Document {
  id: string;
  carrier: string;
  timestamp?: Date;
  facility?: string;
  pickup?: string;
  requestId?: string;
  status?: string;
  link?: string;
  manifests: ManifestObj[];
  manifestErrors: string[];
  userRef: Types.ObjectId;
  carrierRef: Types.ObjectId;
}

export interface ManifestObj {
  createdOn?: Date;
  manifestId: string;
  distributionCenter?: string;
  manifestData: string;
  encodeType: string;
  format: string;
}

export interface TrackingInfo {
  timestamp: string;
  location: string;
  event: string;
}
