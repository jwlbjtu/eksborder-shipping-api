interface StringKeyRecord {
  [key: string]: unknown;
}

export interface UspsDomasticProductRequest extends StringKeyRecord {
  RateV4Request: {
    '@_USERID': string;
    Revision: string;
    Package: UspsPackage[];
  };
}

export interface UspsPackage {
  '@_ID': string;
  Service: string;
  FirstClassMailType?: string;
  ZipOrigination: string;
  ZipDestination: string;
  Pounds: number;
  Ounces: number;
  Container: Record<string, string>;
  Size: Record<string, string>;
  Width: number;
  Length: number;
  Height: number;
  Girth: Record<string, string>;
  Machinable: boolean;
  ShipDate: { '@_Option': string; '#text': string };
}

export interface UspsInternationalProductRequest extends StringKeyRecord {
  IntlRateV2Request: {
    '@_USERID': string;
    Revision: string;
    Package: UspsInternationalPackage[];
  };
}

export interface UspsInternationalPackage {
  '@_ID': string;
  Pounds: number;
  Ounces: number;
  Width: number;
  Length: number;
  Height: number;
  Girth: Record<string, string>;
  Machinable: boolean;
  MailType: string;
  ValueOfContents: number;
  Country: string;
  Container: Record<string, string>;
  Size: Record<string, string>;
  OriginZip: string;
  CommercialFlag: string;
  CommercialPlusFlag?: string;
}

export interface UspsDomasticProductResponse {
  Error?: UspsError;
  RateV4Response?: { Package: UspsResponsePackage };
}

export interface UspsError {
  Number: string;
  Source: string;
  Description: string;
  HelpFile: string;
  HelpContext: string;
}

export interface UspsResponsePackage {
  '@_ID': string;
  ZipOrigination: string;
  ZipDestination: string;
  Pounds: number;
  Ounces: number;
  Machinable?: string;
  Zone?: string;
  Postage: UspsPostage | UspsPostage[];
  Error?: UspsError;
}

export interface UspsPostage {
  '@_CLASSID': string;
  MailService: stirng;
  Rate: string;
  CommercialRate?: string;
  Commitment?: {
    CommitmentDate: string;
    CommitmentName: string;
    CommitmentTime: string;
  };
}

export interface UspsInternationalProductResponse {
  Error?: UspsError;
  IntlRateV2Response?: { Package: UspsIntlResponsePackage };
}

export interface UspsIntlResponsePackage {
  '@_ID': string;
  Prohibitions: string;
  Restrictions: string;
  Observations: string;
  CustomsForms: string;
  ExpressMail: string;
  AreasServed: string;
  AdditionalRestrictions: string;
  Service: UspsIntlService[];
  Error?: UspsError;
}

export interface UspsIntlService {
  '@_ID': string;
  Pounds: number;
  Ounces: number;
  Machinable: boolean;
  MailType: string;
  Width: number;
  Length: number;
  Height: number;
  Country: number;
  Postage: number;
  CommercialPostage: number;
  ExtraServices: { ExtraService: UspsIntlExtraServices[] };
  ValueOfContents: number;
  SvcCommitments: string;
  SvcDescription: string;
  MaxDimensions: string;
  MaxWeight: number;
}

export interface UspsIntlExtraServices {
  ServiceID: string;
  ServiceName: string;
  Available: boolean;
  OnlineAvailable: boolean;
  Price: number;
  PriceOnline: number;
  DeclaredValueRequired: boolean;
}

export interface ImageParameters {
  ImageParameter: string;
  XCoordinate?: number;
  YCoordinate?: number;
}

export interface UspsExtraServices {
  ExtraService: string[];
}

export interface UspsDomesticLabelReqBody extends StringKeyRecord {
  eVSCertifyRequest?: UspsDomesticRequestObj;
  eVSRequest?: UspsDomesticRequestObj;
}

export interface UspsDomesticRequestObj {
  '@_USERID': stirng;
  Option: string;
  Revision: string;
  ImageParameters: ImageParameters;
  FromName: string;
  FromFirm: string;
  FromAddress1: string;
  FromAddress2: string;
  FromCity: string;
  FromState: string;
  FromZip5: string;
  FromZip4: string;
  FromPhone: string;
  AllowNonCleansedOriginAddr: boolean;
  ToName: string;
  ToFirm: string;
  ToAddress1: string;
  ToAddress2: string;
  ToCity: string;
  ToState: string;
  ToZip5: string;
  ToZip4: string;
  ToPhone: string;
  AllowNonCleansedDestAddr: boolean;
  WeightInOunces: number;
  ServiceType: string;
  Container: string;
  Width: number;
  Length: number;
  Height: number;
  Machinable: Record<string, string>;
  CustomerRefNo: string;
  CustomerRefNo2: string;
  ExtraServices: UspsExtraServices;
  ReceiptOption: string;
  ImageType: string;
  HoldForManifest: string;
  PrintCustomerRefNo: boolean;
  PrintCustomerRefNo2: boolean;
}

export interface UspsDomesticLabelResponse {
  Error?: UspsError;
  eVSCertifyResponse?: UspsDomesticResponseObj;
  eVSResponse?: UspsDomesticResponseObj;
}

export interface UspsDomesticResponseObj {
  BarcodeNumber: string;
  LabelImage: string;
  ToName: string;
  ToFirm: string;
  ToAddress1: string;
  ToAddress2: string;
  ToCity: string;
  ToState: string;
  ToZip5: string;
  ToZip4: string;
  RDC: string;
  Postage: number;
  ExtraServices?: {
    ExtraService: ExtraService | ExtraService[];
  };
  Zone: string;
  CarrierRoute: string;
  PermitHolderName: string;
  InductionType: string;
  LogMessage: string;
}

export interface ExtraService {
  ServiceID: string;
  ServiceName: string;
  Price: number;
}

export interface USPSIntlPMExpressLabelReqBody {
  eVSExpressMailIntlCertifyRequest?: UspsIntlPMExpressRequestObj;
  eVSExpressMailIntlRequest?: UspsIntlPMExpressRequestObj;
}

export interface UspsIntlPMExpressRequestObj {
  '@_USERID': string;
  Option: Record<string, string>;
  Revision: string;
  ImageParameters: ImageParameters;
  FromFirstName: string;
  FromMiddleInitial?: string;
  FromLastName: string;
  FromFirm: string;
  FromAddress1?: string;
  FromAddress2: string;
  FromCity: string;
  FromState: string;
  FromZip5: string;
  FromZip4?: string;
  FromPhone: string;
  FromCustomsReference?: string;
  ToFirstName: string;
  ToLastName: string;
  ToFirm: string;
  ToAddress1?: string;
  ToAddress2: string;
  ToCity: string;
  ToProvince?: string;
  ToCountry: string;
  ToPostalCode: string;
  ToPOBoxFlag: string;
  ToPhone?: string;
  ToEmail?: string;
  ImportersReferenceNumber?: string;
  NonDeliveryOption?: string;
  ShippingContents: {
    ItemDetail: UspsIntlShippingItem[];
  };
  InsuredNumber?: string;
  InsuredAmount?: number;
  Postage?: number;
  GrossPounds: number;
  GrossOunces: number;
  ContentType: string;
  ContentTypeOther?: string;
  Agreement: string;
  Comments?: string;
  LicenseNumber?: string;
  CertificateNumber?: string;
  InvoiceNumber?: string;
  ImageType: string;
  ImageLayout?: string;
  CustomerRefNo?: string;
  CustomerRefNo2?: string;
  POZipCode?: string;
  LabelDate?: string;
  HoldForManifest?: string;
  Length: number;
  Width: number;
  Height: number;
  Girth: Record<string, string>;
  LabelTime?: string;
  MeterPaymentFlag?: string;
  ActionCode?: string;
  OptOutOfSPE?: boolean;
  ImportersReferenceType?: string;
  ImportersTelephoneNumber?: string;
  ImportersEmail?: string;
  Machinable: boolean;
  DestinationRateIndicator: string;
}

export interface UspsIntlShippingItem {
  Description: string;
  Quantity: number;
  Value: number;
  NetPounds: number;
  NetOunces: number;
  HSTariffNumber?: string;
  CountryOfOrigin?: string;
}

export interface USPSIntlPMExpressLabelResponse {
  Error?: UspsError;
  eVSExpressMailIntlCertifyResponse?: UspsIntlPMExpressResponseObj;
  eVSExpressMailIntlResponse?: UspsIntlPMExpressResponseObj;
}

export interface UspsIntlPMExpressResponseObj {
  Postage: number;
  TotalValue: number;
  SDRValue: number;
  BarcodeNumber: string;
  LabelImage: string;
  Page2Image: string;
  Page3Image: string;
  Page4Image: string;
  Page5Image: string;
  Page6Image: string;
  Prohibitions: string;
  Restrictions: string;
  Observations: string;
  Regulations: string;
  AdditionalRestrictions: string;
  InsuranceFee?: number;
  GuaranteeAvailability?: string;
  RemainingBarcodes?: string;
}

export interface UspsIntlPriorityMailLabelRequestBody {
  eVSPriorityMailIntlCertifyRequest?: UspsIntlPriorityMailRequestObj;
  eVSPriorityMailIntlRequest?: UspsIntlPriorityMailRequestObj;
}

export interface UspsIntlPriorityMailRequestObj {
  '@_USERID': string;
  Option: Record<string, string>;
  Revision: string;
  ImageParameters: ImageParameters;
  FromFirstName: string;
  FromMiddleInitial?: string;
  FromLastName: string;
  FromFirm: string;
  FromAddress1?: string;
  FromAddress2: string;
  FromCity: string;
  FromState: string;
  FromZip5: string;
  FromZip4?: string;
  FromPhone: string;
  FromCustomsReference?: string;
  ToFirstName: string;
  ToLastName: string;
  ToFirm: string;
  ToAddress1?: string;
  ToAddress2: string;
  ToCity: string;
  ToProvince?: string;
  ToCountry: string;
  ToPostalCode: string;
  ToPOBoxFlag: string;
  ToPhone?: string;
  ToEmail?: string;
  ImportersReferenceNumber?: string;
  NonDeliveryOption?: string;
  ShippingContents: {
    ItemDetail: UspsIntlShippingItem[];
  };
  InsuredNumber?: string;
  InsuredAmount?: number;
  Postage?: number;
  GrossPounds: number;
  GrossOunces: number;
  ContentType: string;
  ContentTypeOther?: string;
  Agreement: string;
  Comments?: string;
  LicenseNumber?: string;
  CertificateNumber?: string;
  InvoiceNumber?: string;
  ImageType: string;
  ImageLayout?: string;
  CustomerRefNo?: string;
  CustomerRefNo2?: string;
  POZipCode?: string;
  LabelDate?: string;
  HoldForManifest?: string;
  Length: number;
  Width: number;
  Height: number;
  Girth: Record<string, string>;
  MeterPaymentFlag?: string;
  ActionCode?: string;
  OptOutOfSPE?: boolean;
  ImportersReferenceType?: string;
  ImportersTelephoneNumber?: string;
  ImportersEmail?: string;
  Machinable: boolean;
  DestinationRateIndicator: string;
}

export interface UspsIntlPriorityMailLabelResponse {
  Error?: UspsError;
  eVSPriorityMailIntlCertifyResponse?: UspsIntlPMResponseObj;
  eVSPriorityMailIntlResponse?: UspsIntlPMResponseObj;
}

export interface UspsIntlPMResponseObj {
  Postage: number;
  TotalValue: number;
  SDRValue: number;
  BarcodeNumber: string;
  LabelImage: string;
  Page2Image: string;
  Page3Image: string;
  Page4Image: string;
  Page5Image: string;
  Page6Image: string;
  Prohibitions: string;
  Restrictions: string;
  Observations: string;
  Regulations: string;
  AdditionalRestrictions: string;
  InsuranceFee?: number;
  GuaranteeAvailability?: string;
  RemainingBarcodes?: string;
}
