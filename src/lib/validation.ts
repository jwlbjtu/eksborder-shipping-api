import LRes from './lresponse.lib';
import {
  errorTypes,
  CARRIERS,
  SUPPORTED_PROVIDERS,
  massUnits,
  SUPPORTED_PARCEL_TYPES
} from './constants';
import HelperLib from './helper.lib';
import { IUser, IAccount } from '../types/user.types';

export const validateCarrierAccount = async (
  carrierAccount: string | undefined,
  user: IUser
): Promise<{ carrierAccount: string; account: IAccount }> => {
  if (!carrierAccount)
    throw LRes.fieldErr('carrierAccount', '/', errorTypes.MISSING);
  const account = await HelperLib.getCurrentUserAccount(carrierAccount, user);
  if (!account || !account.carrierRef || !account.carrierRef.isActive)
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
  if (carrier.toLowerCase() === CARRIERS.PITNEY_BOWES && !provider)
    throw LRes.fieldErr('provider', '/', errorTypes.MISSING);
  if (
    carrier.toLowerCase() === CARRIERS.PITNEY_BOWES &&
    provider &&
    !SUPPORTED_PROVIDERS[carrier.toLowerCase()].includes(provider)
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
  if (
    !supportedServices.find((ele) => service === ele.id || service === ele.key)
  )
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
  if (account.carrier.toLowerCase() !== CARRIERS.DHL_ECOMMERCE) return;
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
  if (carrier.toLowerCase() === CARRIERS.DHL_ECOMMERCE) return;
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

export const validateMassUnit = (
  unitOfMeasure: string,
  carrier: string
): void => {
  if (!massUnits.includes(unitOfMeasure.toUpperCase())) {
    throw LRes.fieldErr(
      'unitOfMeasure',
      '/packageDetail/weight/unitOfMeasure',
      errorTypes.UNSUPPORTED,
      unitOfMeasure,
      carrier
    );
  }
};
