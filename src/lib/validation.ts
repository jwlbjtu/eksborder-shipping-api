import LRes from './lresponse.lib';
import {
  errorTypes,
  CARRIERS,
  SUPPORTED_PROVIDERS,
  massUnits,
  SUPPORTED_PARCEL_TYPES,
  dimensionUnits
} from './constants';
import HelperLib from './helper.lib';
import { IUser, IAccount } from '../types/user.types';
import { IDimension } from '../types/shipping.types';

export const validateCarrierAccount = async (
  carrierAccount: string | undefined,
  user: IUser
): Promise<{ carrierAccount: string; account: IAccount }> => {
  if (!carrierAccount)
    throw LRes.fieldErr('carrierAccount', '/', errorTypes.MISSING);
  const account = await HelperLib.getCurrentUserAccount(carrierAccount, user);
  if (!account)
    throw LRes.fieldErr(
      'carrierAccount',
      '/',
      errorTypes.INVALID,
      carrierAccount
    );
  return { carrierAccount, account };
};

export const validateCarrier = (
  account: IAccount,
  carrier?: string,
  provider?: string
): { carrier: string; provider: string | undefined } => {
  if (!carrier) throw LRes.fieldErr('carrier', '/', errorTypes.MISSING);
  if (account.carrier !== carrier)
    throw LRes.fieldErr(
      'carrierAccount',
      '/',
      errorTypes.ACCOUNT_ERROR,
      account.accountId,
      carrier
    );

  //START !!! TODO: need to remove these PB related logics
  if (carrier === CARRIERS.PITNEY_BOWES && !provider)
    throw LRes.fieldErr('provider', '/', errorTypes.MISSING);
  if (
    carrier === CARRIERS.PITNEY_BOWES &&
    provider &&
    !SUPPORTED_PROVIDERS[carrier].includes(provider)
  ) {
    throw LRes.fieldErr(
      'provider',
      '/',
      errorTypes.UNSUPPORTED,
      provider,
      carrier
    );
  }
  //END !!! TODO: need to remove these PB related logics

  return { carrier, provider };
};

export const validateService = (
  account: IAccount,
  service?: string
): string => {
  if (!service) throw LRes.fieldErr('service', '/', errorTypes.MISSING);
  const supportedServices = account.services;
  if (!supportedServices.find((ele) => service === ele.key))
    throw LRes.fieldErr(
      'carrierAccount',
      '/',
      errorTypes.ACCOUNT_ERROR,
      account.accountId,
      service
    );
  return service;
};

export const validateFacility = (
  account: IAccount,
  facility?: string
): string | undefined => {
  if (account.carrier !== CARRIERS.DHL_ECOMMERCE) return;
  if (!facility) throw LRes.fieldErr('facility', '/', errorTypes.MISSING);
  const supportedFacilities = account.facilities;
  if (!supportedFacilities.includes(facility))
    throw LRes.fieldErr(
      'carrierAccount',
      '/',
      errorTypes.ACCOUNT_ERROR,
      account.accountId,
      facility
    );
  return facility;
};

export const validateParcelType = (
  carrier: string,
  service: string,
  parcelType?: string
): string | undefined => {
  if (carrier === CARRIERS.DHL_ECOMMERCE) return;
  if (!parcelType)
    throw LRes.fieldErr(
      'parcelType',
      '/packageDetail/parcelType',
      errorTypes.MISSING,
      carrier
    );
  if (!SUPPORTED_PARCEL_TYPES[service].includes(parcelType)) {
    throw LRes.fieldErr(
      'parcelType',
      '/packageDetail/parcelType',
      errorTypes.UNSUPPORTED,
      parcelType
    );
  }
  return parcelType;
};

export const validateWeight = (
  weight: number,
  unitOfMeasure: string,
  carrier: string
): void => {
  if (weight <= 0) {
    throw LRes.fieldErr(
      'weight',
      '/packageDetail/weight/weight',
      errorTypes.UNSUPPORTED,
      weight,
      carrier
    );
  }
  if (!massUnits.includes(unitOfMeasure.toLowerCase())) {
    throw LRes.fieldErr(
      'unitOfMeasure',
      '/packageDetail/weight/unitOfMeasure',
      errorTypes.UNSUPPORTED,
      unitOfMeasure,
      carrier
    );
  }
};

export const validateDimensions = (
  dimension: IDimension | undefined,
  carrier: string
): void => {
  if (!dimension) {
    throw LRes.fieldErr(
      'dimention',
      '/packageDetail/dimention',
      errorTypes.MISSING,
      dimension,
      carrier
    );
  }
  if (dimension.length <= 0) {
    throw LRes.fieldErr(
      'length',
      '/packageDetail/dimention/length',
      errorTypes.UNSUPPORTED,
      dimension.length,
      carrier
    );
  }
  if (dimension.width <= 0) {
    throw LRes.fieldErr(
      'width',
      '/packageDetail/dimention/width',
      errorTypes.UNSUPPORTED,
      dimension.width,
      carrier
    );
  }
  if (dimension.height <= 0) {
    throw LRes.fieldErr(
      'height',
      '/packageDetail/dimention/height',
      errorTypes.UNSUPPORTED,
      dimension.height,
      carrier
    );
  }
  if (!dimensionUnits.includes(dimension.unitOfMeasure.toLowerCase())) {
    throw LRes.fieldErr(
      'unitOfMeasure',
      '/packageDetail/weight/unitOfMeasure',
      errorTypes.UNSUPPORTED,
      dimension.unitOfMeasure,
      carrier
    );
  }
};
