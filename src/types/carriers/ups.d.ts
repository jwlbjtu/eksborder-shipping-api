export interface UPSProductRequest {
  RateRequest: UPSRateRequest;
}

export interface UPSRateRequest {
  Shipment: UPSShipment;
}

export interface UPSShipment {
  DeliveryTimeInformation: {
    PackageBillType: string;
  };
  Shipper: UPSShipper;
  ShipTo: UPSShipInfo;
  ShipFrom: UPSShipInfo;
  ShipmentRatingOptions: {
    NegotiatedRatesIndicator: '';
  };
  Service?: UPSService;
  ShipmentTotalWeight: UPSWeight;
  Package: UPSPackage[];
}

export interface UPSShipper {
  Name?: string;
  AttentionName?: string;
  TaxIdentificationNumber?: string;
  Phone?: {
    Number: string;
  };
  EMailAddress?: string;
  ShipperNumber: string;
  Address: UPSAddress;
}

export interface UPSShipInfo {
  Name: string;
  AttentionName?: string;
  Phone?: {
    Number: string;
  };
  EMailAddress?: string;
  TaxIdentificationNumber?: string;
  Address: UPSAddress;
}

export interface UPSAddress {
  AddressLine: string;
  City: string;
  StateProvinceCode?: string;
  PostalCode: string;
  CountryCode: string;
}

export interface UPSService {
  Code: string;
  Description: string;
}

export interface UPSWeight {
  UnitOfMeasurement: {
    Code: string;
    Description?: string;
  };
  Weight: string;
}

export interface UPSPackage {
  PackagingType: UPSPackagingType;
  Dimensions: UPSDimensions;
  PackageWeight: UPSWeight;
}

export interface UPSPackagingType {
  Code: string;
  Description: string;
}

export interface UPSDimensions {
  UnitOfMeasurement: {
    Code: string;
  };
  Length: string;
  Width: string;
  Height: string;
}

export interface UPSProductResponse {
  RateResponse: {
    Response: UPSResponse;
    RatedShipment: UPSRatedShipment[] | UPSRatedShipment;
  };
  response?: UPSErroResponse;
}

export interface UPSResponse {
  ResponseStatus: {
    Code: string;
    Description: string;
  };
  Alert?: UPSAlert[];
  TransactionReference?: {
    CustomerContext?: string;
    TransactionIdentifier?: string;
  };
}

export interface UPSAlert {
  Code: string;
  Description: string;
}

export interface UPSCharges {
  CurrencyCode: string;
  MonetaryValue: string;
}

export interface UPSItemizedCharges {
  Code: string;
  CurrencyCode: string;
  MonetaryValue: string;
  SubType?: string;
}

export interface UPSRatedPackage {
  TransportationCharges: UPSCharges;
  BaseServiceCharge: UPSCharges;
  ServiceOptionsCharges: UPSCharges;
  ItemizedCharges: UPSItemizedCharges[];
  TotalCharges: UPSCharges;
  Weight: string;
  BillingWeight: UPSWeight;
}

export interface UPSRatedShipment {
  Service: UPSService;
  RatedShipmentAlert?: UPSAlert[];
  BillingWeight: UPSWeight;
  TransportationCharges: UPSCharges;
  BaseServiceCharge: UPSCharges;
  ServiceOptionsCharges: UPSCharges;
  TotalCharges: UPSCharges;
  NegotiatedRateCharges?: {
    TotalCharge: UPSCharges;
  };
  GuaranteedDelivery?: {
    BusinessDaysInTransit: string;
    DeliveryByTime?: string;
  };
  RatedPackage: UPSRatedPackage | UPSRatedPackage[];
  TimeInTransit: {
    PickupDate: string;
    PackageBillType: string;
    Disclaimer: string;
    ServiceSummary: {
      Service: { Description: string };
      EstimatedArrival: {
        Arrival: { Date: string; Time: string };
        BusinessDaysInTransit: string;
        Pickup: { Date: string; Time: string };
        DayOfWeek: string;
      };
      SaturdayDelivery: string;
    };
  };
}

export interface UPSErroResponse {
  errors: UPSError[];
}

export interface UPSError {
  code: string;
  message: string;
}

export interface UPSLabelReqBody {
  ShipmentRequest: {
    Shipment: UPSLabelShipment;
    LabelSpecification: {
      LabelImageFormat: {
        Code: string;
      };
      LabelStockSize: {
        Height: string;
        Width: string;
      };
    };
  };
}

export interface UPSLabelShipment {
  Description?: string;
  Shipper: UPSShipper;
  ShipTo: UPSShipInfo;
  ShipFrom: UPSShipInfo;
  PaymentInformation: UPSLabelPaymentInfo;
  Service: UPSService;
  ShipmentServiceOptions?: UPSShipmentServiceOptions;
  Package: UPSLabelPackage[];
  ItemizedChargesRequestedIndicator: '';
  RatingMethodRequestedIndicator: '';
  TaxInformationIndicator: '';
  ShipmentRatingOptions: {
    NegotiatedRatesIndicator: '';
  };
}

export interface UPSProduct {
  Description: string;
  Unit: {
    Number: string;
    UnitOfMeasurement: {
      Code: string;
    };
    Value: string;
  };
  CommodityCode?: string;
  OriginCountryCode: string;
}

export interface InternationalForms {
  FormType: string;
  InvoiceDate: string;
  InvoiceNumber: string;
  ReasonForExport: string;
  CurrencyCode: string;
  Contacts: {
    SoldTo: UPSShipInfo;
  };
  Product: UPSProduct[];
}

export interface UPSShipmentServiceOptions {
  InternationalForms: InternationalForms;
}

export interface UPSLabelPaymentInfo {
  ShipmentCharge: {
    Type: string;
    BillShipper?: {
      AccountNumber: string;
    };
    BillReceiver?: {
      AccountNumber: string;
      Address: {
        PostalCode: string;
        CountryCode?: string;
      };
    };
  };
}

export interface UPSLabelPackage {
  Description?: string;
  Packaging: UPSPackagingType;
  Dimensions: UPSDimensions;
  PackageWeight: UPSWeight;
}

export interface UPSLabelResponse {
  ShipmentResponse: {
    Response: UPSResponse;
    ShipmentResults: UPSShipmentResult;
  };
}

export interface UPSShipmentResult {
  Disclaimer?: {
    Code: string;
    Description: string;
  };
  ShipmentCharges: {
    TransportationCharges: UPSCharges;
    ItemizedCharges: UPSItemizedCharges;
    ServiceOptionsCharges: UPSCharges;
    TotalCharges: UPSCharges;
  };
  RatingMethod: string;
  BillableWeightCalculationMethod: string;
  BillingWeight: UPSWeight;
  ShipmentIdentificationNumber: string;
  PackageResults: UPSLabelResPackage | UPSLabelResPackage[];
  Form?: UPSForm;
}

export interface UPSForm {
  Code: string;
  Description?: string;
  Image: {
    ImageFormat: { Code: string; Description: string };
    GraphicImage: string;
  };
}

export interface UPSLabelResPackage {
  TrackingNumber: string;
  BaseServiceCharge: UPSCharges;
  ServiceOptionsCharges: UPSCharges;
  ShippingLabel: {
    ImageFormat: { Code: string; Description: string };
    GraphicImage: string;
    HTMLImage: string;
  };
  ItemizedCharges: UPSItemizedCharges[];
}
