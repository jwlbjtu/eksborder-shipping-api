import convertlib from 'convert-units';
import { Rate } from '../../types/carriers/carrier';
import {
  IShipping,
  ThirdPartyPrice,
  ThirdPartySummary
} from '../../types/record.types';
import { Currency, WeightUnit } from '../constants';
import { logger } from '../logger';
import {
  computeFee,
  computeTotalShipmentWeight,
  roundToTwoDecimal
} from '../utils/helpers';
import ThirdPartySchema from '../../models/thirdparty.model';
import { IAccount } from '../../types/user.types';

export const findSuitableTirdpartyAccounts = (
  thirdpartyList: ThirdPartySummary[],
  shipmentData: IShipping
): string[] => {
  logger.info('Finding Suitable Thirdparty Price Tables...');
  const thirdpartyIDs: string[] = [];
  for (let i = 0; i < thirdpartyList.length; i += 1) {
    const price = thirdpartyList[i];
    const condition = price.condition;
    if (condition && condition.weightUnit) {
      const minWeight = condition.minWeight;
      const maxWeight = condition.maxWeight;
      const totalWeight = computeTotalShipmentWeight(shipmentData);
      const orderWeight = convertlib(totalWeight.value)
        .from(totalWeight.unitOfMeasure)
        .to(condition.weightUnit as WeightUnit);
      if (
        minWeight !== undefined &&
        maxWeight !== undefined &&
        orderWeight >= minWeight &&
        orderWeight <= maxWeight
      ) {
        thirdpartyIDs.push(price.thirdpartyRef);
      } else if (
        minWeight === undefined &&
        maxWeight !== undefined &&
        orderWeight <= maxWeight
      ) {
        thirdpartyIDs.push(price.thirdpartyRef);
      } else if (
        minWeight !== undefined &&
        maxWeight === undefined &&
        orderWeight >= minWeight
      ) {
        thirdpartyIDs.push(price.thirdpartyRef);
      }
    } else {
      thirdpartyIDs.push(price.thirdpartyRef);
    }
  }
  return thirdpartyIDs;
};

const findThirdpartyPriceByWeight = (
  weight: number,
  weightUnit: WeightUnit,
  price: ThirdPartyPrice
) => {
  let foundPriceData = undefined;
  const targetWeight = convertlib(weight)
    .from(weightUnit)
    .to(price.weightUnit as WeightUnit);
  for (let i = 0; i < price.data.length; i += 1) {
    const priceObj = price.data[i];
    const priceWeightString = priceObj[Object.keys(priceObj)[0]];
    if (priceWeightString.includes('-')) {
      const [minWeight, maxWeight] = priceWeightString.split('-');
      if (
        parseFloat(minWeight) <= Math.ceil(targetWeight) &&
        Math.ceil(targetWeight) <= parseFloat(maxWeight)
      ) {
        foundPriceData = priceObj;
        break;
      }
    } else if (priceWeightString.includes('>')) {
      const minWeight = parseFloat(priceWeightString.substring(1));
      if (minWeight <= Math.ceil(targetWeight)) {
        foundPriceData = priceObj;
        break;
      }
    } else {
      const priceWeight = parseFloat(priceWeightString);
      if (priceWeight >= targetWeight) {
        if (!foundPriceData) {
          foundPriceData = priceObj;
        } else {
          if (priceWeight < parseFloat(foundPriceData.weight)) {
            foundPriceData = priceObj;
          }
        }
      }
    }
  }
  if (foundPriceData) {
    logger.info(
      `Found ${foundPriceData[Object.keys(foundPriceData)[0]]} ${
        price.weightUnit
      } for ${weight} ${weightUnit}`
    );
  } else {
    logger.warn(`No price data found for ${weight} ${weightUnit}`);
  }

  return foundPriceData;
};

export const generateThirdpartyRates = async (
  thirdpartyIds: string[],
  shipmentData: IShipping,
  orderRegion: string | undefined,
  isTest: boolean,
  clientCarrier: IAccount | undefined
): Promise<{ rates: Rate[]; errors: string[] } | string> => {
  logger.info('Start generating rates from thirdparty price tables');
  if (thirdpartyIds.length === 0) return { rates: [], errors: [] };
  if (!clientCarrier) return { rates: [], errors: [] };
  const rates: Rate[] = [];
  const targetZone = `${shipmentData.sender.country}_${shipmentData.toAddress.country}`;
  const packageWeight = computeTotalShipmentWeight(shipmentData);
  const weight = packageWeight.value;
  const weightUnit = packageWeight.unitOfMeasure;
  const accounts = await ThirdPartySchema.find({
    _id: { $in: thirdpartyIds },
    region: orderRegion
  });
  for (let i = 0; i < accounts.length; i += 1) {
    const account = accounts[i];
    if (account.zoneMap && account.price) {
      // Find price object
      const priceData = findThirdpartyPriceByWeight(
        weight,
        weightUnit,
        account.price
      );
      // Find zone for the weight
      const zoneMap = account.zoneMap.find((ele) =>
        ele.maps.split(',').includes(targetZone)
      );
      // Gnerate Rate
      if (priceData && zoneMap) {
        let ratePrice = parseFloat(priceData[zoneMap.zone]);
        // Apply fees of the thirdparty price first
        let fee = computeFee(
          shipmentData,
          ratePrice,
          account.price.currency,
          account.rates
        );
        let thirdpartyRate = ratePrice + fee;
        if (
          priceData[Object.keys(priceData)[0]].includes('-') ||
          priceData[Object.keys(priceData)[0]].includes('>')
        ) {
          // compute rate with weight;
          const rateWeight = Math.ceil(
            convertlib(weight)
              .from(weightUnit)
              .to(account.price.weightUnit as WeightUnit)
          );
          ratePrice = roundToTwoDecimal(rateWeight * ratePrice);
          fee = computeFee(
            shipmentData,
            ratePrice,
            account.price.currency,
            account.rates
          );
          thirdpartyRate = ratePrice + fee;
        }
        // Apply account level fees and create Rate object
        const rateData: Rate = {
          carrier: account.carrier,
          serviceId: account.service.id || account.service.key,
          service: account.service.name,
          account: account.accountNum,
          rate: thirdpartyRate,
          currency: Currency.USD,
          isTest,
          thirdparty: true,
          thirdpartyAcctId: account._id,
          clientCarrierId: clientCarrier.id.toString()
        };
        rates.push(rateData);
      }
    }
  }
  return { rates, errors: [] };
};
