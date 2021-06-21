import { FeeRate } from '../../types/record.types';
import { CarrierRateType, RATE_BASES, WeightUnit } from '../constants';
import convertlib from 'convert-units';
import { IWeight } from '../../types/shipping.types';

export const computeOrderRate = (
  amount: number,
  rate: number,
  rateType: string
): number => {
  switch (rateType) {
    case CarrierRateType.FLAT:
      return rate;
    case CarrierRateType.PERSENTAGE:
      return amount * (rate / 100);
    default:
      return 0;
  }
};

export const computePackageRate = (
  packageCount: number,
  rate: number,
  rateType: string
): number => {
  switch (rateType) {
    case CarrierRateType.FLAT:
      return packageCount * rate;
    case CarrierRateType.PERSENTAGE:
      return 0;
    default:
      return 0;
  }
};

export const computeWeightRate = (
  weight: IWeight,
  weightUnit: string | undefined,
  rate: number,
  rateType: string
): number => {
  if (!weightUnit) return 0;
  const targetWeight = Math.ceil(
    convertlib(weight.value)
      .from(weight.unitOfMeasure)
      .to(weightUnit as WeightUnit)
  );
  switch (rateType) {
    case CarrierRateType.FLAT:
      return targetWeight * rate;
    case CarrierRateType.PERSENTAGE:
      return 0;
    default:
      return 0;
  }
};

// TODO!!!: come back later
export const applyRates = (
  //shipment: Ship,
  amount: number,
  currency: string,
  rates: FeeRate[]
): number => {
  let fee = 0;
  for (let i = 0; i < rates.length; i += 1) {
    const rate = rates[i];
    if (rate.ratebase === RATE_BASES.ORDER) {
      fee += computeOrderRate(amount, rate.rate, rate.ratetype);
    } else if (rate.ratebase === RATE_BASES.PACKAGE) {
      //   let count = order.packageInfo ? 1 : 0;
      //   if (order.morePackages && order.morePackages.length > 0) {
      //     count += order.morePackages.length;
      //   }
      //   fee += computePackageRate(count, rate.rate, rate.ratetype);
    } else if (rate.ratebase === RATE_BASES.WEIGHT) {
      //TODO!!!
      //   fee += computeWeightRate(
      //     order.packageInfo!.weight,
      //     rate.weightUnit,
      //     rate.rate,
      //     rate.ratetype
      //   );
    }
  }
  return parseFloat(fee.toFixed(2));
};
