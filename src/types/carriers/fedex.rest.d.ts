import { DistanceUnit, WeightUnit } from '../../lib/constants';

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

interface FedexAuthErrorResponse {
  transactionId: string;
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
  urbanizationCode?: string;
  addressVerificationId?: string;
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
