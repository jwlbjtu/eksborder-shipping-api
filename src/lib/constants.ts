import { Types } from 'mongoose';
import { PrintFormatData } from '../types/client/printformat';

export const DHL_ECOMMERCE = 'DHL eCommerce';
export const PITNEY_BOWES = 'Pitney Bowes';
export const USPS = 'USPS';

export const massUnits = ['lb', 'oz', 'kg', 'g'];

export const dimensionUnits = ['in', 'cm'];

export const errorTypes = {
  UNKNOWN: 'unknown',
  MISSING: 'missing',
  UNSUPPORTED: 'unsupported',
  EMPTY: 'empty',
  INVALID: 'invalid',
  ACCOUNT_ERROR: 'account_error'
};

export const BILLING_TYPES = {
  AMOUNT: 'amount',
  PROPORTION: 'proportions'
};

export const FEE_BASES = {
  ORDER_BASED: 'order',
  WEIGHT_BASED: 'weight'
};

export const USER_ROLES = {
  ADMIN_SUPER: 'admin_super',
  ADMIN: 'admin',
  API_USER: 'customer'
};

// !!! The ordor of the roles matters here
// index 0 is the highest permission !!!
export const UserRoleList: Array<string> = [
  USER_ROLES.ADMIN_SUPER,
  USER_ROLES.ADMIN,
  USER_ROLES.API_USER
];

export const CARRIERS = {
  DHL_ECOMMERCE: 'DHL eCommerce',
  PITNEY_BOWES: 'pitney bowes',
  USPS: 'USPS',
  UPS: 'UPS',
  FEDEX: 'FedEx',
  RUI_YUN: 'Rui Yun',
  USPS3: 'USPS3'
};

export const SUPPORTED_CARRIERS = [
  CARRIERS.DHL_ECOMMERCE,
  CARRIERS.PITNEY_BOWES
];

export const SUPPORTED_SERVICES = {
  [CARRIERS.DHL_ECOMMERCE]: [
    'FLAT', // DHL Large Envelope/Flat
    'EXP', // DHL Parcel Expedited
    'GND', // DHL Parcel Ground
    'MAX' // DHL Parcel Expedited Max
  ],
  [USPS]: [
    'FCM', // First-Class Mail
    'PM' // Priority Mail
  ]
};

export const SUPPORTED_PARCEL_TYPES: { [key: string]: string[] } = {
  FCM: [
    'FLAT', // Large Envelope/Flat. Only with FCM, and a label size of DOC_6X4
    'PKG' // Package
  ],
  PM: [
    'FRE', // Flat Rate Envelope
    'LGLFRENV', // Legal Flat Rate Envelope
    'PFRENV', // Padded Flat Rate Envelope
    'SFRB', // Small Flat Rate Box
    'FRB', // Medium Flat Rate Box
    'LFRB', // Large Flat Rate Box
    'PKG' // Package
  ]
};

export const SUPPORTED_PROVIDERS: { [key: string]: string[] } = {
  [CARRIERS.PITNEY_BOWES]: ['USPS']
};

export const DHL_ECOMMERCE_MANIFEST_STATUS = {
  CREATED: 'CREATED',
  IN_PROGRESS: 'IN PROGRESS',
  COMPLETED: 'COMPLETED'
};

export enum CarrierRateType {
  FLAT = 'flat',
  PERSENTAGE = 'persentage'
}

export const RATE_BASES = {
  ORDER: '每票',
  PACKAGE: '每件',
  WEIGHT: '重量'
};

export enum WeightUnit {
  G = 'g',
  KG = 'kg',
  OZ = 'oz',
  LB = 'lb'
}

export const WEIGHT_UNIT_LIST = [
  WeightUnit.G,
  WeightUnit.KG,
  WeightUnit.OZ,
  WeightUnit.LB
];

export enum DistanceUnit {
  IN = 'in',
  CM = 'cm'
}

export const DISTANCE_UNIT_LIST = [DistanceUnit.IN, DistanceUnit.CM];

export const FILE_FORMATS = {
  a4: 'a4',
  standard: 'standard',
  thermal: 'thermal'
};

export const FILE_FORMAT_LIST = [
  FILE_FORMATS.a4,
  FILE_FORMATS.standard,
  FILE_FORMATS.thermal
];

export const FILE_TYPES = {
  pdf: 'PDF',
  png: 'PNG',
  csv: 'CSV'
};

export const FILE_TYPE_LIST = [FILE_TYPES.pdf, FILE_TYPES.png, FILE_TYPES.csv];

export enum Country {
  USA = 'US',
  CHINA = 'CN',
  CANADA = 'CA'
}

export const COUNTRY_NAMES: Record<string, string> = {
  [Country.USA]: 'United States',
  [Country.CHINA]: 'China'
};

export enum Currency {
  USD = 'USD'
}

export const COUNTRIES_LIST = [Country.USA, Country.CHINA];
export const CURRENCY_LIST = [Currency.USD];

//*************************************//
//*********** Default Data ************//
//*************************************//

export const defaultPrintFormat: PrintFormatData = {
  labelFormat: {
    format: FILE_FORMATS.thermal,
    type: FILE_TYPES.pdf
  },
  packSlipFormat: {
    format: FILE_FORMATS.standard,
    type: FILE_TYPES.pdf
  },
  userRef: Types.ObjectId('000000000000')
};

export enum REST_ERROR_CODE {
  EMAIL_IN_USE = 'EMAIL_IN_USE',
  EMAIL_NOT_FOUND = 'EMAIL_NOT_FOUND',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED'
}

export enum ShipmentStatus {
  PENDING = 'Pending',
  FULFILLED = 'Shipped'
}

export const SHIPMENT_UPDATE_FIELDS = [
  'accountName',
  'carrierAccount',
  'carrier',
  'provider',
  'service',
  'facility',
  'sender',
  'toAddress',
  'return',
  'customDeclaration',
  'packageInfo',
  'morePackages',
  'shipmentOptions'
];

//*******************************//
//*** DHL eCommerce Constants ***//
//*******************************//
export const DHL_ECOMMERCE_HOSTS = {
  DHL_ECOMMERCE_TEST: 'https://api-sandbox.dhlecs.com',
  DHL_ECOMMERCE_PROD: 'https://api.dhlecs.com'
};

export const DHL_ECOM_SERVICE_TIMES: Record<string, string> = {
  PLY: '4 - 14 days',
  PLT: '3 - 10 days',
  PKY: '4 - 8 days'
};

//*******************************//
//******** USPS Constants *******//
//*******************************//
export const USPS_HOSTS = {
  //USPS_TEST: 'https://stg-secure.shippingapis.com/ShippingAPI.dll',
  USPS_TEST: 'https://secure.shippingapis.com/ShippingAPI.dll',
  USPS_PROD: 'https://secure.shippingapis.com/ShippingAPI.dll'
};

export const USPS_PRODUCTS_APIS = {
  US_DOMESTIC: 'RateV4',
  US_INTERNATIONAL: 'IntlRateV2'
};

export const USPS_LABEL_APIS = {
  US_DOMESTIC: 'eVS',
  US_INTERNATIONAL_PM_EXPRESS: 'eVSExpressMailIntl',
  US_INTERNATIONAL_PM: 'eVSPriorityMailIntl',
  US_INTERNATIONAL_FCM: 'eVSFirstClassMailIntl'
};

export const USPS_LABEL_TEST_APIS = {
  US_DOMESTIC: 'eVSCertify',
  US_INTERNATIONAL_PM_EXPRESS: 'eVSExpressMailIntlCertify',
  US_INTERNATIONAL_PM: 'eVSPriorityMailIntlCertify',
  US_INTERNATIONAL_FCM: 'eVSFirstClassMailIntlCertify'
};

export const USPS_SERVICES = {
  PRIORITY_EXPRESS: 'PRIORITY EXPRESS',
  PRIORITY: 'PRIORITY',
  FIRST_CLASS: 'FIRST CLASS COMMERCIAL'
};

export const USPS_LABEL_SERVICES = {
  [USPS_SERVICES.FIRST_CLASS]: 'FIRST CLASS',
  [USPS_SERVICES.PRIORITY]: 'PRIORITY',
  [USPS_SERVICES.PRIORITY_EXPRESS]: 'PRIORITY EXPRESS'
};

export const USPS_SERVICES_LIST = [
  USPS_SERVICES.PRIORITY_EXPRESS,
  USPS_SERVICES.PRIORITY,
  USPS_SERVICES.FIRST_CLASS
];

export const USPS_CLASSID = {
  PRIORITY_EXPRESS: '3',
  PRIORITY: '1',
  FIRST_CLASS: '61'
};

export const USPS_CLASSID_TO_SERVICEID = {
  [USPS_CLASSID.PRIORITY_EXPRESS]: USPS_SERVICES.PRIORITY_EXPRESS,
  [USPS_CLASSID.PRIORITY]: USPS_SERVICES.PRIORITY,
  [USPS_CLASSID.FIRST_CLASS]: USPS_SERVICES.FIRST_CLASS
};

export const USPS_CLASSID_TO_SERVICE = {
  [USPS_CLASSID.PRIORITY_EXPRESS]: {
    serviceId: USPS_SERVICES.PRIORITY_EXPRESS,
    serviceName: 'Priority Mail Express',
    eta: '1 day'
  },
  [USPS_CLASSID.PRIORITY]: {
    serviceId: USPS_SERVICES.PRIORITY,
    serviceName: 'Priority Mail',
    eta: '2 days'
  },
  [USPS_CLASSID.FIRST_CLASS]: {
    serviceId: USPS_SERVICES.FIRST_CLASS,
    serviceName: 'First Class Commercial',
    eta: '5 days'
  }
};

export const USPS_INTL_SERVICE_IDS = {
  EXPRESS_INTL: '1',
  PRIORITY_INTL: '2'
};

export const USPS_INTL_ID_TO_SERVICE = {
  [USPS_INTL_SERVICE_IDS.EXPRESS_INTL]: {
    serviceId: '1',
    service: 'Priority Mail Express International',
    eta: '3-5 days'
  },
  [USPS_INTL_SERVICE_IDS.PRIORITY_INTL]: {
    serviceId: '2',
    service: 'Priority Mail International',
    eta: '6-10 days'
  }
};

export const USPS_INTL_ID_TO_API = {
  [USPS_INTL_SERVICE_IDS.EXPRESS_INTL]:
    USPS_LABEL_APIS.US_INTERNATIONAL_PM_EXPRESS,
  [USPS_INTL_SERVICE_IDS.PRIORITY_INTL]: USPS_LABEL_APIS.US_INTERNATIONAL_PM
};

export const USPS_INTL_ID_TO_TEST_API = {
  [USPS_INTL_SERVICE_IDS.EXPRESS_INTL]:
    USPS_LABEL_TEST_APIS.US_INTERNATIONAL_PM_EXPRESS,
  [USPS_INTL_SERVICE_IDS.PRIORITY_INTL]:
    USPS_LABEL_TEST_APIS.US_INTERNATIONAL_PM
};

//*******************************//
//********* UPS Constants *******//
//*******************************//
export const UPS_HOSTS = {
  UPS_TEST: 'https://wwwcie.ups.com',
  UPS_PROD: 'https://onlinetools.ups.com'
};

export const UPS_WEIGHT_UNITS: Record<string, string> = {
  [WeightUnit.LB]: 'LBS',
  [WeightUnit.KG]: 'KGS',
  [WeightUnit.OZ]: 'OZS'
};

export const UPS_WEIGHT_UNITS_REVERSE: Record<string, string> = {
  LBS: WeightUnit.LB,
  KGS: WeightUnit.KG,
  OZS: WeightUnit.OZ
};

export const UPS_WEIGHT_UNIT_TO_UNIT: Record<string, string> = {
  LBS: WeightUnit.LB,
  OZS: WeightUnit.OZ,
  KGS: WeightUnit.KG
};

export const UPS_SERVICE_IDS = {
  UPS_WORLDWIDE_SAVER: '65',
  UPS_WORLDWIDE_EXPRESS: '07',
  UPS_WORLDWIDE_EXPEDITED: '08',
  UPS_SUREPOST_LIGHT: '92',
  UPS_SUREPOST: '93'
};

export const UPS_SERVICES = {
  [UPS_SERVICE_IDS.UPS_WORLDWIDE_SAVER]: {
    serviceId: '65',
    service: 'UPS Worldwide Saver',
    eta: '2 days'
  },
  [UPS_SERVICE_IDS.UPS_WORLDWIDE_EXPRESS]: {
    serviceId: '07',
    service: 'UPS WorldWide Express',
    eta: '2 days'
  },
  [UPS_SERVICE_IDS.UPS_WORLDWIDE_EXPEDITED]: {
    serviceId: '08',
    service: 'UPS WorldWide Expedited',
    eta: '8 days'
  },
  [UPS_SERVICE_IDS.UPS_SUREPOST_LIGHT]: {
    serviceId: '92',
    service: 'UPS Surepost',
    eta: '5-7 days'
  },
  [UPS_SERVICE_IDS.UPS_SUREPOST]: {
    serviceId: '93',
    service: 'UPS Surepost',
    eta: '5-7 days'
  }
};

//*******************************//
//******** FEDEX Constants *******//
//*******************************//
export const FEDEX_HOSTS = {
  FEDEX_TEST: 'https://wsbeta.fedex.com',
  FEDEX_PROD: 'https://ws.fedex.com',
  FEDEX_REST_TEST: 'https://apis-sandbox.fedex.com',
  FEDEX_REST_PROD: 'https://apis.fedex.com'
};

export const getFedexHost = (isTest: boolean): string => {
  let fedexUrl = process.env.FEDEX_REST_PROD
    ? process.env.FEDEX_REST_PROD
    : FEDEX_HOSTS.FEDEX_REST_PROD;
  if (isTest) {
    fedexUrl = process.env.FEDEX_REST_TEST
      ? process.env.FEDEX_REST_TEST
      : FEDEX_HOSTS.FEDEX_REST_TEST;
  }
  return fedexUrl;
};

export const PARCELSELITE_NAME = 'ParcelsElite';

// Custom Constents
export const TYPE_OF_CONTENT: Record<string, string> = {
  DOCUMENTS: 'Documents',
  GIFT: 'Gift',
  SAMPLE: 'Sample',
  MERCHANDISE: 'Merchandise',
  RETURN: 'Return merchandise',
  DONATION: 'Humanitarian donation',
  OTHER: 'Other'
};

export const INCOTERM: Record<string, Record<string, string>> = {
  DDU: {
    name: 'DDU(bill recipient)',
    value: 'DDU'
  },
  DDP: {
    name: 'DDP(bill sender)',
    value: 'DDP'
  }
};

export const NON_DELIVERY_HANDLING: Record<string, string> = {
  RETURN: 'Return',
  ABANDON: 'Abandon'
};

export const CARRIER_REGIONS = {
  US_DOMESTIC: 'US_DOMESTIC',
  US_INTERNATIONAL: 'US_INTERNATIONAL',
  CN_IMPORT: 'CN_IMPORT'
};

//**********************************//
//******** RUI YUN Constants *******//
//**********************************//
export const RUIYUN_HOSTS = {
  RUIYUN_TEST: 'http://aa94.rui-y.com:8401/lgtbws/eship/orderShip',
  RUIYUN_PROD: 'http://www.pm-l.com:8401/lgtbws/eship/orderShip'
};

//**********************************//
//******** USPS 3 Constants *******//
//**********************************//
export const USPS3_HOSTS = {
  USPS3_PROD: 'https://api.apparcel.com'
};
