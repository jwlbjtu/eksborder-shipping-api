import { FeeRate, IShipping } from '../../types/record.types';
import {
  CarrierRateType,
  CARRIER_REGIONS,
  Country,
  RATE_BASES,
  WeightUnit
} from '../constants';
import convertlib from 'convert-units';
import { IWeight } from '../../types/shipping.types';
import fs from 'fs';

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

export const computeFee = (
  shipmentData: IShipping,
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
      let count = shipmentData.packageInfo ? 1 : 0;
      if (shipmentData.morePackages && shipmentData.morePackages.length > 0) {
        count += shipmentData.morePackages.length;
      }
      fee += computePackageRate(count, rate.rate, rate.ratetype);
    } else if (rate.ratebase === RATE_BASES.WEIGHT) {
      const totalWeight = computeTotalShipmentWeight(shipmentData);
      fee += computeWeightRate(
        totalWeight,
        rate.weightUnit,
        rate.rate,
        rate.ratetype
      );
    }
  }
  return parseFloat(fee.toFixed(2));
};

export const roundToTwoDecimal = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const base64Encode = (file: string): string => {
  return fs.readFileSync(file).toString('base64');
};

export const computeTotalShipmentWeight = (shipment: IShipping): IWeight => {
  const packageinfo = shipment.packageInfo;
  const morePackages = shipment.morePackages;
  if (packageinfo) {
    const data = { ...packageinfo.weight };
    if (morePackages && morePackages.length > 0) {
      const total = morePackages.reduce(
        (acumulator, ele) => acumulator + ele.weight.value,
        0
      );
      data.value += total;
    }
    return data;
  }
  return { value: 0, unitOfMeasure: WeightUnit.LB };
};

export const checkShipmentRegion = (
  shipment: IShipping
): string | undefined => {
  const sender = shipment.sender;
  const recipient = shipment.toAddress;

  if (sender.country === Country.USA && recipient.country === Country.USA) {
    return CARRIER_REGIONS.US_DOMESTIC;
  } else if (
    sender.country !== Country.CHINA &&
    recipient.country === Country.CHINA
  ) {
    return CARRIER_REGIONS.CN_IMPORT;
  } else if (sender.country === Country.USA) {
    return CARRIER_REGIONS.US_INTERNATIONAL;
  }
  return undefined;
};

export const getPoundAndOunces = (
  weight: number,
  weightUnit: WeightUnit
): number[] => {
  const weightInPound = convertlib(weight).from(weightUnit).to(WeightUnit.LB);
  const pound = parseInt(weightInPound.toString().split('.')[0]);
  const weightInOunces = convertlib(weightInPound - pound)
    .from(WeightUnit.LB)
    .to(WeightUnit.OZ);
  const ounce = Math.ceil(weightInOunces);
  return [pound, ounce];
};
