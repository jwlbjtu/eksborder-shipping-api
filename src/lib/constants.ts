import { Types } from 'mongoose';
import { PrintFormatData } from '../types/client/printformat';

export const DHL_ECOMMERCE = 'DHL eCommerce';
export const PITNEY_BOWES = 'Pitney Bowes';
export const USPS = 'USPS';

export const massUnits = ['LB', 'OZ', 'KG', 'G'];

export const dimensionUnits = ['IN', 'CM'];

export const errorTypes = {
  UNKNOWN: 'unknown',
  MISSING: 'missing',
  UNSUPPORTED: 'unsupported',
  EMPTY: 'empty',
  INVALID: 'invalid',
  ACCOUNT_ERROR: 'account_error'
};

// This is the FLAT price of DHL eCommerce
// Weight Unit is OZ, Currency is USD
export const DHL_FLAT_PRICES: { [key: string]: number } = {
  '1': 0.96,
  '2': 1.01,
  '3': 1.05,
  '4': 1.09,
  '5': 1.19,
  '6': 1.29,
  '7': 1.39,
  '8': 1.5,
  '9': 1.59,
  '10': 1.7,
  '11': 1.79,
  '12': 1.9,
  '13': 1.99,
  '14': 2.1,
  '15': 2.2,
  '16': 2.3
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
  DHL_ECOMMERCE: 'dhl ecommerce',
  PITNEY_BOWES: 'pitney bowes',
  USPS: 'usps'
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
  CHINA = 'CN'
}

export const COUNTRIES_LIST = [Country.USA, Country.CHINA];

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
