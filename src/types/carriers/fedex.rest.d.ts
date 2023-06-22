import { Currency, DistanceUnit, WeightUnit } from '../../lib/constants';

interface FedexAuthResponse {
  access_token: string;
  toekn_type: string;
  expires_in: number;
  scope: string;
}

interface FedexAuthToken {
  access_token: string;
  tokenExpirationTime: number;
}

interface FedexErrorResponse {
  transactionId: string;
  customerTransactionId?: 'AnyCo_order123456789';
  errors: FedexRestError[];
}

interface FedexRestError {
  code: string;
  message: string;
}

interface FedexAddressValidationRequest {
  inEffectAsOfTimestamp?: string;
  validateAddressControlParameters?: Record<string, any>;
  addressesToValidate: FedexAddressToValidate[];
}

interface FedexAddressToValidate {
  address: FedexRestAddress;
}

interface FedexRestAddress {
  streetLines: string[];
  city?: string;
  stateOrProvinceCode?: string;
  postalCode?: string;
  countryCode: string; // US
  countryName?: string; // United States
  urbanizationCode?: string;
  addressVerificationId?: string;
  residential?: boolean;
}

interface FedexAddressValidationResponse {
  transactionId: string;
  customerTransactionId: string;
  output: FedexAddressValidationOutput;
}

interface FedexAddressValidationOutput {
  resolvedAddresses: FedexResolvedAddress[];
  alerts: FedexAlert[];
}

interface FedexResolvedAddress {
  streetLinesToken: string[];
  city: string;
  stateOrProvinceCode: string;
  countryCode: string;
  customerMessage: string[];
  cityToken: string[];
  postalCodeToken: string[];
  parsedPostalCode: FedexPostalCode;
  classification: 'MIXED' | 'UNKNOWN' | 'BUSINESS' | 'RESIDENTIAL';
  postOfficeBox: boolean;
  normalizedStatusNameDPV: boolean;
  standardizedStatusNameMatchSource: string;
  resolutionMethodName:
    | 'USPS_VALIDATE'
    | 'CA_VALIDATE'
    | 'GENERIC_VALIDATE'
    | 'NAVTEQ_GEO_VALIDATE'
    | 'TELEATLAS_GEO_VALIDATE';
  ruralRouteHighwayContract: boolean;
  generalDelivery: boolean;
  attributes: Record<string, any>;
}

interface FedexAlert {
  code: string;
  message: string;
  alertType: 'NOTE' | 'WARNING';
}

interface FedexPostalCode {
  base: string;
  addOn: string;
  deliveryPoint: string;
}

interface FedexAddressValidationErrorResponse {
  transactionId: string;
  customerTansactionId: string;
  errors: FedexRestError[];
}

// FedEx Product Service

interface FedexProductRequest {
  accountNumber: FedexAccountNumber;
  rateRequestControlParameters?: FedexProductRequestParams;
  requestedShipment: RequestedShipment;
  carrierCodes?: string[];
}

interface FedexAccountNumber {
  value: string;
}

interface FedexProductRequestParams {
  returnTransitTimes?: boolean;
  servicesNeededOnRateFailure?: boolean;
  variableOptions?:
    | 'SATURDAY_DELIVERY'
    | 'FREIGHT_GUARANTEE'
    | 'SMART_POST_ALLOWED_INDICIA'
    | 'SMARTPOST_HUB_ID';
  rateSortOrder?:
    | 'COMMITASCENDING'
    | 'SERVICENAMETRADITIONAL'
    | 'COMMITDESCENDING';
}

interface RequestedShipment {
  shipper: { address: FedexRestShippingAddress };
  recipient: { address: FedexRestShippingAddress };
  serviceType?: string;
  emailNotificationDetail?: EmailNotificationDetail;
  preferredCurrency?: string;
  rateRequestType?: ['LIST' | 'INCENTIVE' | 'ACCOUNT' | 'PREFERRED'];
  shipDateStamp?: string;
  pickupType:
    | 'CONTACT_FEDEX_TO_SCHEDULE'
    | 'DROPOFF_AT_FEDEX_LOCATION'
    | 'USE_SCHEDULED_PICKUP';
  requestedPackageLineItems: FedexRestPackageLineItem[];
  documentShipment?: boolean;
  variableHandlingChargeDetail?: VariableHandlingChargeDetail;
  packagingType?: string;
  totalPackageCount?: number;
  totalWeight?: number;
  shipmentSpecialServices?: ShipmentSpecialServices;
  customsClearanceDetail?: CustomsClearanceDetail;
  groupShipment?: boolean;
  serviceTypeDetail?: ServiceTypeDetail;
  smartPostInfoDetail?: SmartPostInfoDetail;
  expressFreightDetail?: ExpressFreightDetail;
  groundShipment?: boolean;
}

interface FedexRestShippingAddress {
  streetLines?: string[];
  city?: string;
  stateOrProvinceCode?: string;
  postalCode?: string;
  countryCode: string;
  residential?: boolean;
}

interface EmailNotificationDetail {
  recipients: NotificationRecipient[];
  personalMessage?: string;
  PrintedReference?: PrintedReference;
}

interface NotificationRecipient {
  emailAddress: string;
  notificationEventType?:
    | 'ON_DELIVERY'
    | 'ON_EXCEPTION'
    | 'ON_SHIPMENT'
    | 'ON_TENDER'
    | 'ON_ESTIMATED_DELIVERY'
    | 'ON_PICKUP'
    | 'ON_LABEL'
    | 'ON_BILL_OF_LADING'[];
  smsDetail?: SmsDetail;
  notificationFormatType?: 'HTML' | 'TEXT';
  emailNotificationRecipientType?:
    | 'BROKER'
    | 'OTHER'
    | 'RECIPIENT'
    | 'SHIPPER'
    | 'THIRD_PARTY'
    | 'OTHER1'
    | 'OTHER2';
  notificationType?: 'EMAIL' | 'SMS_TEXT_MESSAGE';
  locale: string;
}

interface SmsDetail {
  phoneNumber: string;
  phoneNumberCountryCode: string;
}

interface PrintedReference {
  printedReferenceType:
    | 'BILL_OF_LADING'
    | 'CONSIGNEE_ID_NUMBER'
    | 'INTERLINE_PRO_NUMBER'
    | 'PO_NUMBER'
    | 'SHIPPER_ID_NUMBER'
    | 'SHIPPER_ID1_NUMBER'
    | 'SHIPPER_ID2_NUMBER';
  value: string;
}

interface FedexRestPackageLineItem {
  sequenceNumber?: number;
  subPackagingType?: string;
  groupPackageCount: number;
  countentRecord?: ContentRecord;
  declaredValue?: FedexRestValue;
  weight: FedexRestWeight;
  dimensions?: FedexRestDimensions;
  variableHandlingChargeDetail?: VariableHandlingChargeDetail;
  packageSpecialServices?: PackageSpecialServices;
}

interface ContentRecord {
  itemNumber: string;
  receivedQuantity: number;
  description: string;
  partNumber: string;
}

interface FedexRestValue {
  amount: number;
  currency: string;
}

interface FedexRestWeight {
  value: number;
  units: 'KG' | 'LB';
}

interface FedexRestDimensions {
  length: number;
  width: number;
  height: number;
  units: string; // 'CM' | 'IN';
}

interface VariableHandlingChargeDetail {
  rateType?:
    | 'ACCOUNT'
    | 'ACTUAL'
    | 'CURRENT'
    | 'CUSTOM'
    | 'LIST'
    | 'INCENTIVE'
    | 'PREFERRED'
    | 'PREFERRED_INCENTIVE'
    | 'PREFERRED_CURRENCY';
  percetValue?: number;
  rateLevelType?: 'BUNDLED_RATE' | 'INDIVIDUAL_PACKAGE_RATE';
  fixedValue?: FedexRestValue;
  rateElementBasis:
    | 'NET_CHARGE'
    | 'NET_FREIGHT'
    | 'BASE_CHARGE'
    | 'NET_CHARGE_EXCLUDING_TAXES';
}

interface PackageSpecialServices {
  specialServiceTypes?: string[];
  signatureOptionType?:
    | 'SERVICE_DEFAULT'
    | 'NO_SIGNATURE_REQUIRED'
    | 'INDIRECT'
    | 'DIRECT'
    | 'ADULT';
  alcoholDetail?: AlcoholDetail;
  dangerousGoodsDetail?: DangerousGoodsDetail;
  packageCODDetail?: PackageCODDetail;
  pieceCountVerificationBoxCount?: number;
  batteryDetails?: BatteryDetail[];
  dryIceWeight?: FedexRestWeight;
}

interface AlcoholDetail {
  alcoholRecipientType: 'CONSUMER' | 'LICENSEE';
  shipperAgreementType?: string;
}

interface DangerousGoodsDetail {
  offeror?: string;
  accessibility?: 'ACCESSIBLE' | 'INACCESSIBLE';
  emergencyContactNumber?: string;
  options?:
    | 'HAZARDOUS_MATERIALS'
    | 'BATTERY'
    | 'ORM_D'
    | 'REPORTABLE_QUANTITIES'
    | 'SMALL_QUANTITY_EXCEPTION'
    | 'LIMITED_QUANTITIES_COMMODITIES'[];
  containers?: FedexRestContainer[];
  packaging?: FedexRestPacking;
}

interface FedexRestContainer {
  offeror?: string;
  hazardousCommodities?: FedexRestHazardousCommodity[];
  numberOfContainers?: number;
  containerType?: string;
  emergencyContactNumber?: FedexRestPhoneNumber;
  packaging?: FedexRestPacking;
  packingType?: 'ALL_PACKED_IN_ONE'[];
  radioactiveContainerClass?:
    | 'EXCEPTED_PACKAGE'
    | 'INDUSTRIAL_IP1'
    | 'INDUSTRIAL_IP2'
    | 'INDUSTRIAL_IP3'
    | 'TYPE_A'
    | 'TYPE_B_M'
    | 'TYPE_B_U'
    | 'TYPE_C';
}

interface FedexRestHazardousCommodity {
  quantity?: FedexRestHazardousCommodityQuantity;
  innerReceptacles?: FedexRestHazardousCommodityInnerReceptacle[];
  options?: FedexRestHazardousCommodityOption;
  description?: FedexRestHazardousCommodityDescription;
}

interface FedexRestHazardousCommodityQuantity {
  auantityType: 'GROSS' | 'NET';
  amount: number;
  units: string;
}

interface FedexRestHazardousCommodityInnerReceptacle {
  quantity?: FedexRestHazardousCommodityQuantity;
}

interface FedexRestHazardousCommodityOption {
  labelTextOption?: 'APPEND' | 'OVERRIDE' | 'STANDARD';
  customerSuppliedLabelText?: string;
}

interface FedexRestHazardousCommodityDescription {
  sequenceNumber?: number;
  processingOptions?: 'INCLUDE_SPECIAL_PROVISIONS'[];
  subsidiaryClasses?: string[];
  labelText?: string;
  technicalName?: string;
  packingDetails?: FedexRestHazardousCommodityPackingDetail[];
  authorization?: string;
  reportableQuantity?: boolean;
  percentage?: number;
  id?: string;
  packingGroup?: 'DEFAULT' | 'I' | 'II' | 'III';
  properShippingName?: string;
  hazardClass?: string;
}

interface FedexRestHazardousCommodityPackingDetail {
  packingInstructions?: string;
  cargoAirCraftOnly?: boolean;
}

interface FedexRestPhoneNumber {
  areaCode: string;
  extension?: string;
  countryCode: string;
  personalIdentificationNumber?: string;
  localNumber?: string;
}

interface FedexRestPacking {
  count: number;
  units: string;
}

interface PackageCODDetail {
  codCollectionAmount?: FedexRestMoney;
  collectionType?:
    | 'ANY'
    | 'CASH'
    | 'GUARANTEED_FUNDS'
    | 'COMPANY_CHECK'
    | 'PERSONAL_CHECK';
}

interface BatteryDetail {
  material: 'LITHIUM_METAL' | 'LITHIUM_ION';
  regulatorySubType: 'IATA_SECTION_II';
  packing: 'CONTAINED_IN_EQUIPMENT' | 'PACKED_WITH_EQUIPMENT';
}

interface ShipmentSpecialServices {
  returnShipmentDetaiul?: { returnType: string };
  deliveryOnInvoiceAcceptanceDetail?: DeliveryOnInvoiceAcceptanceDetail;
  internationalTrafficInArmsRegulationsDetail?: {
    licenseOrExemptionNumber: string;
  };
  pendingShipmentDetail?: PendingShipmentDetail;
  holdAtLocationDetail?: HoldAtLocationDetail;
  shipmentCODDetail?: ShipmentCODDetail;
  shipmentDryIceDetail?: ShipmentDryIceDetail;
  internationalControlledExportDetail?: { type: string };
  homeDelioveryPremiumDetail?: HomeDeliveryPremiumDetail;
  specialServiceTypes: string[];
}

interface DeliveryOnInvoiceAcceptanceDetail {
  recipient?: FedexRestAddress;
}

interface FedexRestRecipient {
  address: FedexRestAddress;
  contact: FedexRestContact;
  accountNumber?: { value: string };
}

interface FedexRestContact {
  personName: string;
  emailAddress?: string;
  phoneNumber: string;
  phoneExtension?: string;
  faxzNumber?: string;
  companyName?: string;
}

interface PendingShipmentDetail {
  pendingShipmentType: 'EMAIL';
  processingOptions: { options: string[] };
  recommendedDocumentSpecification?: { types: string[] };
  emailLabelDetail?: EmailLabelDetail;
  documentReferences?: DocumentReference[];
  expirationTimeStamp?: string;
  shipmentDryIceDetail?: ShipmentDryIceDetail;
}

interface EmailLabelDetail {
  recipients: EmailLabelDetailRecipient[];
  mesasge: string;
}

interface EmailLabelDetailRecipient {
  emailAddress: string;
  optionsReqested?: { options: string[] };
  role?: string;
  locale?: { country: string; language: string };
}

interface DocumentReference {
  documentType: string;
  customerReference: string;
  description: string;
  documentId: string;
}

interface ShipmentDryIceDetail {
  totalWeight: FedexRestWeight;
  packageCount: number;
}

interface HoldAtLocationDetail {
  locationId: string;
  locationContactAndAddress: {
    contact: FedexRestContact;
    address: FedexRestAddress;
  };
  locationType: string;
}

interface ShipmentCODDetail {
  addTransportationChargeDetail?: addTransportationChargeDetail;
  codRecipient: codRecipient;
  remitToName: string;
  codCollectionType: string;
  financialInstitutionContactAndAddress: {
    contact: FedexRestContact;
    address: FedexRestAddress;
  };
  returnReferenceIndicatorType: string;
}

interface addTransportationChargeDetail {
  rateType: string;
  rateLevelType: string;
  chargeLevelType: string;
  chargeType: string;
}

interface codRecipient {
  address: FedexRestAddress;
  contact: FedexRestContact;
  accountNumber: FedexAccountNumber;
}

interface ShipmentDryIceDetail {
  totalWeight: FedexRestWeight;
  packageCount: number;
}

interface HomeDeliveryPremiumDetail {
  phoneNumber: FedexRestPhoneNumber;
  shipTimestamp: string;
  homedeliveryPremiumType: string;
}

interface CustomsClearanceDetail {
  commercialInvoice?: {
    shipmentPurpose:
      | 'GIFT'
      | 'NOT_SOLD'
      | 'PERSONAL_EFFECTS'
      | 'REPAIR_AND_RETURN'
      | 'SAMPLE'
      | 'SOLD'
      | 'COMMERCIAL'
      | 'RETURN_AND_REPAIR'
      | 'PERSONAL_USE';
  };
  freightOnValue?: 'CARRIER_RISK' | 'OWN_RISK';
  dutiesPayment?: DutiesPayment;
  commodities: FedexRestCustomsCommodity[];
}

interface DutiesPayment {
  payor: FedexRestDutyPayor;
  paymentType: string;
}

interface FedexRestDutyPayor {
  responsibleParty: FedexRestRecipient;
}

interface FedexRestCustomsCommodity {
  description?: string;
  weight?: FedexRestWeight;
  quantity?: number;
  customsValue?: FedexRestMoney;
  unitPrice?: FedexRestMoney;
  numberOfPieces?: number;
  countryOfManufacture?: string;
  quantityUnits?: string;
  name?: string;
  harmonizedCode?: string;
  partNumber?: string;
}

interface ServiceTypeDetail {
  carrierCode: string;
  description: string;
  serviceName: string;
  serviceCategory: string;
}

interface SmartPostInfoDetail {
  ancillaryEndorsement?: string;
  hubId?: string;
  indicia?: string;
  specialSerivces?: string;
}

interface ExpressFreightDetail {
  bookingConfirmationNumber: string;
  shippersLoadAndCount: number;
  packingListEnclosed?: boolean;
}

interface FedexRestProductResponse {
  transactionId: string;
  customerTransactionId: string;
  output: FedexRestProductOutput;
}

interface FedexRestProductOutput {
  rateReplyDetails: FedexRestRateReplyDetail[];
  quoteDate: string;
  encoded: boolean;
  alerts: FedexAlert[];
}

interface FedexRestRateReplyDetail {
  serviceType: string;
  serviceName: string;
  packagingType: string;
  cutomerMessages: FedexRestMessage[];
  ratedShipmentDetails: RatedShipmentDetail[];
  anonymouslyAllowalbe: boolean;
  optionalDetail: OptionalDetail;
  signatureOptionType: string;
}

interface FedexRestMessage {
  code: string;
  message: string;
}

interface RatedShipmentDetail {
  rateType: string;
  ratedWeightMethod: string;
  totalDiscounts: number;
  totalBaseCharge: number;
  totalNetCharge: number;
  totalVatCharge: number;
  totalNetFedExCharge: number;
  totalDutiesAndTaxes: number;
  totalNetChargeWithDutiesAndTaxes: number;
  totalDutiesTaxesAndFees: number;
  totalAncillaryFeesAndTaxes: number;
  shipmentRateDetail: ShipmentRateDetail;
  currency: stringl;
}

interface ShipmentRateDetail {
  rateZone: string;
  dimDivisor: number;
  fuelSurchargePercent: number;
  totalSurcharges: number;
  totalFrightDiscount: number;
  surCharges: FedexRateSurchange[];
  pricingCode: string;
  currencyExchangeRate: FedexCurrencyExchangeRate;
  totalBillingWeight: FedexRestWeight;
  currency: string;
}

interface FedexRateSurchange {
  type: string;
  description: string;
  amount: number;
  level: string;
  name: string;
}

interface FedexCurrencyExchangeRate {
  fromCurrency: string;
  intoCurrency: string;
  rate: number;
}

interface OptionalDetail {
  originLocationIds: string[];
  commitDays: string[];
  serviceCode: string;
  airportId: string;
  scac: string;
  origniServiceAreas: string[];
  deliveryDay: string;
  originLocationNumbers: number[];
  destinationPostalCode: string;
  commitDate: string;
  astraDescription: string;
  deliveryDate: string;
  deliveryEligibilities: string[];
  ineligibleForMoneyBackGuarantee: boolean;
  MaximumTransitTime: string;
  astraPlannedServiceLevel: string;
  destinationLocationIds: string[];
  destinationLocationStateOrProvinceCodes: string[];
  transitTime: string;
  packagingCode: string;
  destinationLocationNumbers: number[];
  publishedDeliveryTime: string;
  countryCodes: string[];
  stateOrProvinceCodes: string[];
  ursaPrefixCode: string;
  ursaSuffixCode: string;
  destinationServiceAreas: string[];
  originPostalCodes: string[];
  customTransitTime: string;
}

// Fedex REST API Label
interface FedexRestLabelRequest {
  mergeLabelDocOption?: 'NONE' | 'LABELS_AND_DOCS' | 'LABELS_ONLY';
  requestedShipment: FedexRestRequestedShipment;
  labelResponseOptions: 'URL_ONLY' | 'LABEL';
  accountNumber: FedexAccountNumber;
}

interface FedexRestRequestedShipment {
  shipDatestamp: string;
  shipper: FedexRestLabelShipper;
  recipients: FedexRestLabelRecipient[];
  pickupType:
    | 'CONTACT_FEDEX_TO_SCHEDULE'
    | 'DROPOFF_AT_FEDEX_LOCATION'
    | 'USE_SCHEDULED_PICKUP';
  serviceType: string;
  packagingType: string;
  totalWeight: number;
  shippingChargesPayment: {
    paymentType: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY' | 'COLLECT';
    payor: {
      accountNumber: FedexAccountNumber;
    };
  };
  shipmentSpecialServices?: FedexRestLabelSpecialServices;
  expressFreightDetail?: ExpressFreightDetail;
  customsClearanceDetail?: FedexRestCustomsClearanceDetail;
  smartPostDetail?: SmartPostInfoDetail;
  labelSpecification?: LabelSpecifiaction;
  shippingDocumentSpecification?: FedexRestShippingDocumentSpecification;
  totalPackageCount?: number;
  requestedPackageLineItems?: FedexRestPackageLineItem[];
}

interface FedexRestLabelShipper {
  address: FedexRestShippingAddress;
  contact: FedexRestContact;
  tin?: FedexRestTin[];
}

interface FedexRestLabelRecipient extends FedexRestLabelShipper {
  deliveryInstructions?: string;
}

interface LabelSpecifiaction {
  labelFormatType: 'COMMON2D' | 'LABEL_DATA_ONLY';
  labelOrder: 'SHIPPING_LABEL_FIRST' | 'SHIPPING_LABEL_LAST';
  labelStockType: string;
  imageType: 'PNG' | 'PDF' | 'ZPLII' | 'EPL2';
}

interface FedexRestTin {
  number: string;
  tinType: string;
  usage: string;
  effectiveDate: string;
  expirationDate: string;
}

interface FedexRestLabelResponse {
  transcationId: string;
  cutomerTransactionId: string;
  output: FedexRestLabelResponseOutput;
}

interface FedexRestLabelResponseOutput {
  transactionShipments: FedexRestTransactionShipment[];
  alerts: FedexAlert[];
  jobId: string;
}

interface FedexRestTransactionShipment {
  serviceType: string;
  shipDatestamp: string;
  serviceCategory: string;
  shipmentDocuments: FedexRestShipmentDocument[];
  pieceResponses: FedexRestPieceResponse[];
  serviceName: string;
  alerts: FedexAlert[];
  completedShipmentDetail: FedexRestCompletedShipmentDetail;
  masterTrackingNumber: string;
}

interface FedexRestPieceResponse {
  masterTrackingNumber: string;
  deliveryDatestamp: string;
  packageSequenceNumber: number;
  trackingNumber: string;
  additionalChargesDiscount: number;
  netRateAmount: number;
  netChargeAmount: number;
  netDiscountAmount: number;
  packageDocuments: PackageDocument[];
  currency: Currency;
  customerReferences: string[];
  codcollectionAmount: number;
  baseRateAmount: number;
}

interface PackageDocument {
  contentType: string;
  copiesToPrint: number;
  encodedLabel: string;
  docType: string;
}

interface FedexRestCompletedShipmentDetail {
  shipmentRating: FedexRestShipmentRating;
}

interface FedexRestShipmentRating {
  shipmentRateDetails: FedexRestShipmentRateDetail[];
}

interface FedexRestShipmentRateDetail {
  rateZone: string;
  totalNetChargeWithDutiesAndTaxes: number;
  totalNetCharge: number;
  totalNetFedExCharge: number;
  currency: string;
}

interface FedexRestShipmentDocument {
  contentKey: string;
  copiesToPrint: number;
  contentType: string;
  trackingNumber: string;
  docType: string;
  alerts: FedexAlert[];
  encodedLabel: string;
  url?: string;
}

interface FedexRestLabelSpecialServices {
  specialServiceTypes: string[];
  etdDetail: FedexRestLabelEtdDetail;
}

interface FedexRestLabelEtdDetail {
  attributes?: string[];
  requestedDocumentTypes: string[];
}

interface FedexRestShippingDocumentSpecification {
  shippingDocumentTypes: string[];
  commercialInvoiceDetail: FedexRestCommercialInvoiceDetail;
}

interface FedexRestCommercialInvoiceDetail {
  documentFormat: FedexRestDocumentFormat;
}

interface FedexRestDocumentFormat {
  stockType: string;
  docType: string;
}

interface FedexRestCustomsClearanceDetail {
  regulatoryControls?: string[];
  brokers?: FedexRestBroker[];
  commercialInvoice: FedexRestCommercialInvoice;
  freightOnValue?: string;
  dutiesPayment?: FedexRestDutiesPayment;
  commodities: FedexRestCommodity[];
  isDocumentOnly?: boolean;
  totalCustomsValue?: {
    amount: number;
    currency: string;
  };
}

interface FedexRestBroker {
  broker: {
    address: FedexRestShippingAddress;
    contact: FedexRestContact;
    accountNumber: FedexAccountNumber;
    tins: FedexRestTin[];
  };
  type: string;
}

interface FedexRestCommercialInvoice {
  shipmentPurpose: string;
}

interface FedexRestCommodity {
  numberOfPieces: number;
  description: string;
  countryOfManufacture: string;
  weight: FedexRestWeight;
  quantity: number;
  quantityUnits: string;
  unitPrice: {
    amount: number;
    currency: string;
  };
  customsValue: {
    amount: number;
    currency: string;
  };
}

interface FedexRestDutiesPayment {
  payor: {
    responsibleParty: {
      address?: FedexRestShippingAddress;
      contact?: FedexRestContact;
      accountNumber: FedexAccountNumber;
      tins?: FedexRestTin[];
    };
  };
  paymentType: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY' | 'COLLECT';
}

interface FedexTrackingRequest {
  includeDetailedScans: boolean;
  trackingInfo: FedexTrackingInfo[];
}

interface FedexTrackingInfo {
  trackingNumberInfo: FedexTrackingNumberInfo;
  trackingNumberUniqueId?: string;
  carrierCode?: string;
}

interface FedexTrackingNumberInfo {
  trackingNumber: string;
}

interface FedexTrackingResponse {
  transactionId: string;
  output: FedexTrackingResponseOutput;
}

interface FedexTrackingResponseOutput {
  completeTrackResults: FedexCompleteTrackResult[];
}

interface FedexCompleteTrackResult {
  trackingNumber: string;
  trackResults: FedexTrackResult[];
}

interface FedexTrackResult {
  trackingNumberInfo: FedexTrackingNumberInfo;
  shipperInformation: FedexRestRecipient;
  recipientInformation: FedexRestRecipient;
  latestStatusDetail: FedexTrackingLatestStatusDetail;
  scanEvents: FedexScanEvent[];
  serviceDetail: FedexServiceDetail;
  standardTransitTimeWindow: FedexTransitionTimeWindow;
  estimatedDeliveryTimeWindow: FedexTransitionTimeWindow;
}

interface FedexTrackingLatestStatusDetail {
  code: string;
  derivedCode: string;
  statusByLocation: string;
  description: string;
  scanLocation: FedexScanLocation;
  delayDetail: FedexDelayDetail;
}

interface FedexScanLocation {
  city: string;
  countryCode: string;
  residential: boolean;
  countryName: string;
  stateOrProvinceCode?: string;
}

interface FedexDelayDetail {
  status?: string;
  type?: string;
}

interface FedexScanEvent {
  date: Date;
  eventType: string;
  eventDescription: string;
  exceptionCode: string;
  exceptionDescription: string;
  scanLocation: FedexRestAddress;
  locationId: string;
  locationType: string;
  derivedStatusCode: string;
  derivedStatus: string;
  delayDetail?: FedexDelayDetail;
}

interface FedexServiceDetail {
  type: string;
  description: string;
  shortDescription: string;
}

interface FedexTransitionTimeWindow {
  window: {
    ends: Date;
  };
}
