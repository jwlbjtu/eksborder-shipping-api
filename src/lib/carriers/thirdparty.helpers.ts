import convertlib from 'convert-units';
import { Rate } from '../../types/carriers/carrier';
import {
  IShipping,
  IThirdPartyAccount,
  ThirdPartyPrice,
  ThirdPartySummary,
  ThirdPartyZoneMap
} from '../../types/record.types';
import { Currency, WeightUnit } from '../constants';
import { logger } from '../logger';
import {
  computeFee,
  computeFeeWithAmount,
  computeTotalShipmentWeight,
  getWeightUnit,
  roundToTwoDecimal
} from '../utils/helpers';
import ThirdPartySchema from '../../models/thirdparty.model';
import { IAccount } from '../../types/user.types';
import { get } from 'lodash';

export const validateThirdpartyPriceWithWeight = (
  priceList: IThirdPartyAccount[],
  weight: number,
  weightType: string
): IThirdPartyAccount | undefined => {
  logger.info(
    `Validating Thirdparty Price Tables with weight: ${weight}, weightType: ${weightType} ...`
  );
  for (let i = 0; i < priceList.length; i += 1) {
    const price = priceList[i];
    const condition = price.condition;
    if (condition && condition.weightUnit) {
      console.log(condition.weightUnit);
      // Check Weight Unit
      if (weight <= 16 && getWeightUnit(weightType) === WeightUnit.OZ) {
        // Only consider weight in oz
        if (condition.weightUnit !== WeightUnit.OZ) {
          continue;
        }
      }
      if (weight >= 1 && getWeightUnit(weightType) === WeightUnit.LB) {
        // Only consider weight in lb
        if (condition.weightUnit !== WeightUnit.LB) {
          continue;
        }
      }
      const minWeight = condition.minWeight;
      const maxWeight = condition.maxWeight;
      const orderWeight = convertlib(weight)
        .from(getWeightUnit(weightType))
        .to(condition.weightUnit as WeightUnit);
      logger.info(`Order weight: ${orderWeight} ${condition.weightUnit}`);
      console.log(minWeight, maxWeight, orderWeight);
      if (
        minWeight !== undefined &&
        maxWeight !== undefined &&
        orderWeight >= minWeight &&
        orderWeight <= maxWeight
      ) {
        return price;
      } else if (
        minWeight === undefined &&
        maxWeight !== undefined &&
        orderWeight <= maxWeight
      ) {
        return price;
      } else if (
        minWeight !== undefined &&
        maxWeight === undefined &&
        orderWeight >= minWeight
      ) {
        return price;
      }
    } else {
      return price;
    }
  }
  return undefined;
};

export const validateThirdpartyPrice = (
  priceList: IThirdPartyAccount[],
  shipping: IShipping
): IThirdPartyAccount | undefined => {
  logger.info('Validating Thirdparty Price Tables...');
  for (let i = 0; i < priceList.length; i += 1) {
    const price = priceList[i];
    const condition = price.condition;
    if (condition && condition.weightUnit) {
      const minWeight = condition.minWeight;
      const maxWeight = condition.maxWeight;
      const totalWeight = computeTotalShipmentWeight(shipping);
      const orderWeight = convertlib(totalWeight.value)
        .from(totalWeight.unitOfMeasure)
        .to(condition.weightUnit as WeightUnit);
      logger.info(`Order weight: ${orderWeight} ${condition.weightUnit}`);
      if (
        minWeight !== undefined &&
        maxWeight !== undefined &&
        orderWeight >= minWeight &&
        orderWeight <= maxWeight
      ) {
        return price;
      } else if (
        minWeight === undefined &&
        maxWeight !== undefined &&
        orderWeight <= maxWeight
      ) {
        return price;
      } else if (
        minWeight !== undefined &&
        maxWeight === undefined &&
        orderWeight >= minWeight
      ) {
        return price;
      }
    } else {
      return price;
    }
  }
  return undefined;
};

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
  logger.info(
    `Searching for thirdparty price data for ${targetWeight} ${price.weightUnit}`
  );
  for (let i = 0; i < price.data.length; i += 1) {
    const priceObj = price.data[i];
    const priceWeightString = priceObj.weight;
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
      `Found ${foundPriceData.weight} ${price.weightUnit} for ${weight} ${weightUnit}`
    );
  } else {
    logger.warn(`No price data found for ${weight} ${weightUnit}`);
  }

  return foundPriceData;
};

export const computeThirdpartyRateWithWeight = (
  shipmentData: IShipping,
  priceTable: IThirdPartyAccount,
  weight: number,
  weightType: string,
  zone: string
): { rates: Rate[]; errors: string[] } => {
  const rates: Rate[] = [];
  if (priceTable.zoneMap && priceTable.price) {
    const priceData = findThirdpartyPriceByWeight(
      weight,
      getWeightUnit(weightType),
      priceTable.price
    );
    // Gnerate Rate
    if (priceData) {
      logger.info(
        `Found ${priceData[zone]} for ${priceData.weight}${priceTable.price.weightUnit} and zone ${zone}`
      );
      let ratePrice = parseFloat(priceData[zone]);
      // Apply fees of the thirdparty price first
      let fee = computeFeeWithAmount(
        shipmentData,
        ratePrice,
        priceTable.price.currency,
        weight,
        getWeightUnit(weightType),
        priceTable.rates
      );
      let thirdpartyRate = ratePrice + fee;
      if (
        priceData[Object.keys(priceData)[0]].includes('-') ||
        priceData[Object.keys(priceData)[0]].includes('>')
      ) {
        // compute rate with weight;
        const rateWeight = Math.ceil(
          convertlib(weight)
            .from(getWeightUnit(weightType))
            .to(priceTable.price.weightUnit as WeightUnit)
        );
        ratePrice = roundToTwoDecimal(rateWeight * ratePrice);
        fee = computeFee(
          shipmentData,
          ratePrice,
          priceTable.price.currency,
          priceTable.rates
        );
        thirdpartyRate = ratePrice + fee;
      }
      // Apply account level fees and create Rate object
      const rateData: Rate = {
        carrier: priceTable.carrier,
        serviceId: priceTable.service.id || priceTable.service.key,
        service: priceTable.service.name,
        account: priceTable.accountNum,
        rate: thirdpartyRate,
        currency: Currency.USD,
        isTest: false,
        thirdparty: true,
        thirdpartyAcctId: priceTable._id,
        clientCarrierId: ''
      };
      rates.push(rateData);
    }
  }
  return { rates, errors: [] };
};

export const computeThirdpartyRate = (
  priceTable: IThirdPartyAccount,
  shipmentData: IShipping,
  isTest: boolean,
  clientCarrier: IAccount
): { rates: Rate[]; errors: string[] } | string => {
  const packageWeight = computeTotalShipmentWeight(shipmentData);
  const weight = packageWeight.value;
  const weightUnit = packageWeight.unitOfMeasure;
  const rates: Rate[] = [];
  if (priceTable.zoneMap && priceTable.price) {
    const priceData = findThirdpartyPriceByWeight(
      weight,
      weightUnit,
      priceTable.price
    );
    // Find zone for the weight
    const zoneMode = priceTable.zoneMode;
    const originZip = priceTable.zipCode;
    const originCountry = priceTable.countryCode;
    const originState = undefined;
    let zoneMap: ThirdPartyZoneMap | undefined;
    logger.info('Validate Rui Yun thirdaparty sender');
    if (zoneMode === 'zip') {
      logger.info('Validate Rui Yun thirdaparty sender by ZIP mode');
      const fromZip = shipmentData.sender?.zip;
      const toZip = shipmentData.toAddress.zip;
      logger.info(`fromZip=${fromZip}, toZip=${toZip}, origin=${originZip}`);
      if (fromZip && originZip) {
        let fromZip3 = fromZip;
        if (priceTable.service.key !== 'AU Express') {
          fromZip3 = fromZip3.substring(0, 3);
        }
        if (fromZip3 !== originZip) {
          throw new Error('渠道不支持寄出地址');
        }
      }
      let toZip3 = toZip;
      if (priceTable.service.key !== 'AU Express') {
        toZip3 = toZip3.substring(0, 3);
      }
      logger.info(`Search zone map for ${toZip3}`);
      zoneMap = priceTable.zoneMap.find((ele) =>
        ele.maps.split(',').includes(toZip3)
      );
      logger.info(`Found zone map ${zoneMap?.zone}, ${zoneMap?.maps}`);
    } else if (zoneMode === 'state') {
      logger.info('Validate Rui Yun thirdaparty sender by STATE mode');
      const fromState = shipmentData.sender?.state;
      const toState = shipmentData.toAddress.state!;
      if (fromState && originState) {
        if (fromState !== originState) {
          throw new Error('渠道不支持寄出地址');
        }
      }
      zoneMap = priceTable.zoneMap.find((ele) =>
        ele.maps.split(',').includes(toState)
      );
    } else if (zoneMode === 'country') {
      logger.info('Validate Rui Yun thirdaparty sender by COUNTRY mode');
      const fromCountry = shipmentData.sender?.country;
      const toCountry = shipmentData.toAddress.toCountry;
      if (fromCountry && originCountry) {
        if (fromCountry !== originCountry) {
          throw new Error('渠道不支持寄出地址');
        }
      }
      zoneMap = priceTable.zoneMap.find((ele) =>
        ele.maps.split(',').includes(toCountry)
      );
    }
    if (!zoneMap) {
      throw new Error('渠道不支持寄出地址');
    }
    // Gnerate Rate
    if (priceData && zoneMap) {
      logger.info(
        `Found ${priceData[zoneMap.zone]} for ${priceData.weight}${
          priceTable.price.weightUnit
        } and zone ${zoneMap.zone}`
      );
      let ratePrice = parseFloat(priceData[zoneMap.zone]);
      // Apply fees of the thirdparty price first
      let fee = computeFee(
        shipmentData,
        ratePrice,
        priceTable.price.currency,
        priceTable.rates
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
            .to(priceTable.price.weightUnit as WeightUnit)
        );
        ratePrice = roundToTwoDecimal(rateWeight * ratePrice);
        fee = computeFee(
          shipmentData,
          ratePrice,
          priceTable.price.currency,
          priceTable.rates
        );
        thirdpartyRate = ratePrice + fee;
      }
      // Apply account level fees and create Rate object
      const rateData: Rate = {
        carrier: priceTable.carrier,
        serviceId: priceTable.service.id || priceTable.service.key,
        service: priceTable.service.name,
        account: priceTable.accountNum,
        rate: thirdpartyRate,
        currency: Currency.USD,
        isTest,
        thirdparty: true,
        thirdpartyAcctId: priceTable._id,
        clientCarrierId: clientCarrier.id.toString()
      };
      rates.push(rateData);
    }
  }
  return { rates, errors: [] };
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
  // const targetZone = `${shipmentData.sender.country}_${shipmentData.toAddress.country}`;
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
      const zoneMode = account.zoneMode;
      const origin = account.origin;
      let zoneMap: ThirdPartyZoneMap | undefined;
      if (zoneMode === 'zip') {
        const fromZip = shipmentData.sender?.zip;
        const toZip = shipmentData.toAddress.zip;
        if (fromZip && origin) {
          const fromZip3 = fromZip.substring(0, 3);
          if (fromZip3 !== origin) {
            logger.error('渠道不支持寄出地址');
            continue;
          }
        }
        const toZip3 = toZip.substring(0, 3);
        zoneMap = account.zoneMap.find((ele) =>
          ele.maps.split(',').includes(toZip3)
        );
      } else if (zoneMode === 'state') {
        const fromState = shipmentData.sender?.state;
        const toState = shipmentData.toAddress.state!;
        if (fromState && origin) {
          if (fromState !== origin) {
            logger.error('渠道不支持寄出地址');
            continue;
          }
        }
        zoneMap = account.zoneMap.find((ele) =>
          ele.maps.split(',').includes(toState)
        );
      } else if (zoneMode === 'country') {
        const fromCountry = shipmentData.sender?.country;
        const toCountry = shipmentData.toAddress.toCountry;
        if (fromCountry && origin) {
          if (fromCountry !== origin) {
            logger.error('渠道不支持寄出地址');
            continue;
          }
        }
        zoneMap = account.zoneMap.find((ele) =>
          ele.maps.split(',').includes(toCountry)
        );
      }
      if (!zoneMap) {
        logger.error('渠道不支持寄出地址');
        continue;
      }
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
