import LRes from './lresponse.lib';
import {
  errorTypes,
  SUPPORTED_CARRIERS,
  CARRIERS,
  SUPPORTED_PROVIDERS,
  SUPPORTED_SERVICES,
  massUnits,
  DHL_ECOMMERCE,
  SUPPORTED_PARCEL_TYPES
} from './constants';
import HelperLib from './helper.lib';
import { IUser, IAccount } from '../types/user.types';

export const validateCarrier = (carrier?: string, provider?: string) => {
  if (!carrier) throw LRes.fieldErr('carrier', '/', errorTypes.MISSING);
  if (!SUPPORTED_CARRIERS.includes(carrier.toLowerCase()))
    throw LRes.fieldErr('carrier', '/', errorTypes.UNSUPPORTED, carrier);
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
  return { carrier, provider };
};

export const validateService = (
  carrier: string,
  provider?: string,
  service?: string
): string => {
  if (!service) throw LRes.fieldErr('service', '/', errorTypes.MISSING);
  let supportedServices = SUPPORTED_SERVICES[carrier.toLowerCase()];
  if (carrier.toLowerCase() === CARRIERS.PITNEY_BOWES && provider) {
    supportedServices = SUPPORTED_SERVICES[provider];
  }
  if (!supportedServices.includes(service))
    throw LRes.fieldErr(
      'service',
      '/',
      errorTypes.UNSUPPORTED,
      service,
      carrier
    );
  return service;
};

export const validateParcelType = (
  carrier: string,
  service: string,
  parcelType?: string
) => {
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

export const validateMassUnit = (unitOfMeasure: string, carrier: string) => {
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
