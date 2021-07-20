import { DistanceUnit, WeightUnit } from '../../lib/constants';

export interface WebAuthenticationDetail {
  UserCredential: {
    Key: string;
    Password: string;
  };
}

export interface ClientDetail {
  AccountNumber: string;
  MeterNumber: string;
}

export interface Version {
  ServiceId: string;
  Major: number;
  Intermediate: number;
  Minor: number;
}

export interface FedexAuth {
  WebAuthenticationDetail: WebAuthenticationDetail;
  ClientDetail: ClientDetail;
  Version: Version;
}

export interface FedexCredential {
  key: string;
  password: string;
  accountNumber: string;
  meterNumber: string;
  hubId: string;
}

export interface FedexProductReqBody {
  WebAuthenticationDetail: WebAuthenticationDetail;
  ClientDetail: ClientDetail;
  Version: Version;
  ReturnTransitAndCommit: boolean;
  RequestedShipment: RequestedShipment;
}

export interface RequestedShipment {
  DropoffType: string;
  ServiceType?: string;
  PackagingType: string;
  Shipper: FedexShipper;
  Recipient: FedexShipper;
  ShippingChargesPayment: ShippingChargesPayment;
  SmartPostDetail?: SmartPostDetail;
  PackageCount?: number;
  RequestedPackageLineItems?: RequestedPackageLineItem[];
}

export interface FedexShipper {
  Contact: FedexContact;
  Address: FedexAddress;
}

export interface FedexContact {
  PersonName: string;
  CompanyName?: string;
  PhoneNumber: string;
}

export interface FedexAddress {
  StreetLines: string[];
  City: string;
  StateOrProvinceCode?: string;
  PostalCode: string;
  CountryCode: string;
  Residential: boolean;
}

export interface ShippingChargesPayment {
  PaymentType: string;
  Payor?: {
    ResponsibleParty: {
      AccountNumber: string;
    };
  };
}

export interface RequestedPackageLineItem {
  SequenceNumber: number;
  GroupPackageCount?: number;
  Weight: {
    Units: string;
    Value: number;
  };
  Dimensions: {
    Length: number;
    Width: number;
    Height: number;
    Units: string;
  };
}

export interface FedexRatesResponse {
  HighestSeverity: string;
  Notifications: FedexNotication[];
  Version: Version;
  RateReplyDetails: FedexRateReplyDetail[];
}

export interface FedexRateReplyDetail {
  ServiceType: string;
  ServiceDescription: ServiceDescription;
  PackagingType: string;
  DeliveryDayOfWeek: string;
  DeliveryTimestamp: string;
  CommitDetails: CommitDetail[];
  DestinationAirportId: string;
  IneligibleForMoneyBackGuarantee: boolean;
  TransitTime: string;
  SignatureOption: string;
  ActualRateType: string;
  RatedShipmentDetails: RatedShipment[];
}

export interface RatedShipment {
  ShipmentRateDetail: ShipmentRateDetail;
  RatedPackages: RatedPackage[];
}

export interface RatedPackage {
  GroupNumber: string;
  PackageRateDetail: PackageRateDetail;
}

export interface PackageRateDetail {
  RateType: string;
  RatedWeightMethod: string;
  BillingWeight: { Units: string; Value: number };
  BaseCharge: { Currency: string; Amount: number };
  TotalFreightDiscounts: { Currency: string; Amount: number };
  NetFreight: { Currency: string; Amount: number };
  TotalSurcharges: { Currency: string; Amount: number };
  NetFedExCharge: { Currency: string; Amount: number };
  TotalTaxes: { Currency: string; Amount: number };
  NetCharge: { Currency: string; Amount: number };
  TotalRebates: { Currency: string; Amount: number };
  Surcharges: Surcharge[];
}

export interface ShipmentRateDetail {
  RateType: string;
  RateZone: string;
  RatedWeightMethod: string;
  DimDivisor: string;
  FuelSurchargePercent: number;
  TotalBillingWeight: { Units: string; Value: number };
  TotalBaseCharge: { Currency: string; Amount: number };
  TotalFreightDiscounts: { Currency: number; Amount: number };
  TotalNetFreight: { Currency: number; Amount: number };
  TotalSurcharges: { Currency: number; Amount: number };
  TotalNetFedExCharge: { Currency: number; Amount: number };
  TotalTaxes: { Currency: number; Amount: number };
  TotalNetCharge: { Currency: number; Amount: number };
  TotalRebates: { Currency: number; Amount: number };
  TotalDutiesAndTaxes: { Currency: number; Amount: number };
  TotalAncillaryFeesAndTaxes: { Currency: number; Amount: number };
  TotalDutiesTaxesAndFees: { Currency: number; Amount: number };
  TotalNetChargeWithDutiesAndTaxes: { Currency: number; Amount: number };
  Surcharges: Surcharge[];
}

export interface Surcharge {
  SurchargeType: string;
  Level: string;
  Description: string;
  Amount: { Currency: string; Amount: number };
}

export interface CommitDetail {
  ServiceType: string;
  ServiceDescription: ServiceDescription;
  DerivedOriginDetail: DerivedDetail;
  DerivedDestinationDetail: DerivedDetail;
  CommitTimestamp: string;
  DayOfWeek: string;
  TransitTime: string;
  BrokerToDestinationDays: string;
  CommitMessages: CommitMessage[];
}

export interface CommitMessage {
  Severity: string;
  Source: string;
  Code: string;
  Message: string;
}

export interface DerivedDetail {
  CountryCode: string;
  StateOrProvinceCode: string;
  PostalCode: string;
  LocationNumber: number;
  AirportId?: string;
}

export interface ServiceDescription {
  ServiceType: string;
  Code: string;
  Names: ServiceName[];
  Description: string;
  AstraDescription: string;
}

export interface ServiceName {
  Type: string;
  Encoding: string;
  Value: string;
}

export interface FedexNotication {
  Severity: string;
  Source: string;
  Code: string;
  Message: string;
  LocalizedMessage: string;
}

export interface FedexLabelReqBody {
  WebAuthenticationDetail: WebAuthenticationDetail;
  ClientDetail: ClientDetail;
  Version: Version;
  RequestedShipment: LabelRequestedShipment;
}

export interface LabelRequestedShipment {
  ShipTimestamp: string;
  DropoffType: string;
  ServiceType: string;
  PackagingType: string;
  TotalWeight: { Units: string; Value: number };
  Shipper: FedexShipper;
  Recipient: FedexShipper;
  ShippingChargesPayment: ShippingChargesPayment;
  SpecialServicesRequested?: SpecialServicesRequested;
  CustomsClearanceDetail?: CustomsClearanceDetail;
  SmartPostDetail?: SmartPostDetail;
  LabelSpecification?: LabelSpecification;
  ShippingDocumentSpecification?: ShippingDocumentSpecification;
  MasterTrackingId?: MasterTrackingId;
  PackageCount?: number;
  RequestedPackageLineItems?: RequestedPackageLineItem[];
}

export interface SmartPostDetail {
  ProcessingOptionsRequested: undefined;
  Indicia: string;
  AncillaryEndorsement: string;
  HubId: string;
}

export interface CustomsClearanceDetail {
  DutiesPayment: DutiesPayment;
  DocumentContent: string;
  CustomsValue: { Currency: string; Amount: number };
  Commodities: FedexCommodity[];
}

export interface FedexCommodity {
  NumberOfPieces: number;
  Description: string;
  CountryOfManufacture: string;
  Weight: {
    Units: string;
    Value: number;
  };
  Quantity: number;
  QuantityUnits: string;
  UnitPrice: {
    Currency: string;
    Amount: number;
  };
  CustomsValue: {
    Currency: string;
    Amount: number;
  };
  HarmonizedCode?: string;
}

export interface DutiesPayment {
  PaymentType: string;
  Payor: {
    ResponsibleParty: {
      AccountNumber: string;
      // Contact: {},
      // Address: {}
    };
  };
}

export interface SpecialServicesRequested {
  SpecialServiceTypes: string[];
  EtdDetail: {
    RequestedDocumentCopies: string[];
  };
}

export interface ShippingDocumentSpecification {
  ShippingDocumentTypes: string[];
  CommercialInvoiceDetail: {
    Format: {
      ImageType: string;
      StockType: string;
    };
  };
}

export interface LabelSpecification {
  LabelFormatType: string;
  ImageType: string;
  LabelStockType: string;
}

export interface MasterTrackingId {
  TrackingType?: string;
  TrackingNumber: string;
}

export interface FedexLabelResponse {
  HighestSeverity: string;
  Notifications: FedexNotication[];
  Version: Version;
  JobId: string;
  CompletedShipmentDetail: CompletedShipmentDetail;
}

export interface CompletedShipmentDetail {
  UsDomestic: boolean;
  CarrierCode: string;
  MasterTrackingId: MasterTrackingId;
  ServiceDescription: ServiceDescription;
  ShipmentDocuments?: ShipmentDocument[];
  CompletedPackageDetails: CompletedPackageDetail[];
}

export interface ShipmentDocument {
  Type: string;
  ShippingDocumentDisposition: string;
  ImageType: string;
  Resolution: string;
  CopiesToPrint: string;
  Parts: FedexLabelPart[];
}

export interface CompletedPackageDetail {
  SequenceNumber: string;
  TrackingIds: MasterTrackingId[];
  GroupNumber: string;
  Label: FedexLabelData;
  SignatureOption: string;
}

export interface FedexLabelData {
  Type: string;
  ShippingDocumentDisposition: string;
  ImageType: string;
  Resolution: string;
  CopiesToPrint: string;
  Parts: FedexLabelPart[];
}

export interface FedexLabelPart {
  DocumentPartSequenceNumber: string;
  Image: string;
}
