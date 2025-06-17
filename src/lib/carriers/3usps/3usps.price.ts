import {
  USPS3_RATE_REQUEST,
  USPS3_RATE_RESPONSE
} from '../../../types/carriers/usps3';
import { IShipping } from '../../../types/record.types';
import { logger } from '../../logger';
import axios from 'axios';
import { getWeightUnit } from '../../utils/helpers';

export const usps3PriceHandler = async (
  reqBody: USPS3_RATE_REQUEST,
  token: string,
  baseUrl: string
): Promise<USPS3_RATE_RESPONSE> => {
  try {
    logger.info('Sending USPS 3 price request');
    const response = await axios.post(`${baseUrl}/Rates`, reqBody, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token
      }
    });
    const data = response.data as USPS3_RATE_RESPONSE;
    logger.info(
      `USPS 3 price request completed with isSuccess=${data.isSuccess}`
    );
    return data;
  } catch (error) {
    logger.error((error as any).response.data);
    return (error as any).response.data as USPS3_RATE_RESPONSE;
  }
};
export const buildUsps3PriceRequestWithWeight = (
  shipment: IShipping,
  weight: number,
  weightType: string
): USPS3_RATE_REQUEST => {
  logger.info('Building USPS 3 price request');
  const sender = shipment.sender!;
  const recipient = shipment.toAddress;

  const packageList = [
    {
      weight: {
        value: weight,
        unit: getWeightUnit(weightType).toUpperCase()
      },
      dimensions: undefined,
      count: 1
    }
  ];

  const data: USPS3_RATE_REQUEST = {
    serviceCode: shipment.service!.id!,
    shipper: {
      name: sender.name!,
      phone: sender.phone,
      email: sender.email,
      company: sender.company,
      street1: sender.address1,
      street2: sender.address2,
      city: sender.city,
      province: sender.state!,
      postalCode: sender.zip,
      countryCode: sender.country
    },
    consignee: {
      name: recipient.name!,
      phone: recipient.phone,
      email: recipient.email,
      company: recipient.company,
      street1: recipient.address1,
      street2: recipient.address2,
      city: recipient.city,
      province: recipient.state!,
      postalCode: recipient.zip,
      countryCode: recipient.country
    },
    packages: packageList
  };
  logger.info('Return USPS 3 price request object for weight');
  return data;
};

export const buildUsps3PriceRequest = (
  shipment: IShipping
): USPS3_RATE_REQUEST => {
  logger.info('Building USPS 3 price request');
  const sender = shipment.sender!;
  const recipient = shipment.toAddress;

  const packageList = shipment.packageList.map((pkg) => {
    return {
      weight: {
        value: pkg.weight.value,
        unit: pkg.weight.unitOfMeasure.toUpperCase()
      },
      dimensions: pkg.dimensions
        ? {
            length: pkg.dimensions.length!,
            width: pkg.dimensions.width!,
            height: pkg.dimensions.height!,
            unit: pkg.dimensions.unitOfMeasure.toUpperCase()
          }
        : undefined,
      count: pkg.count || 1
    };
  });

  const data: USPS3_RATE_REQUEST = {
    serviceCode: shipment.service!.id!,
    shipper: {
      name: sender.name!,
      phone: sender.phone,
      email: sender.email,
      company: sender.company,
      street1: sender.address1,
      street2: sender.address2,
      city: sender.city,
      province: sender.state!,
      postalCode: sender.zip,
      countryCode: sender.country
    },
    consignee: {
      name: recipient.name!,
      phone: recipient.phone,
      email: recipient.email,
      company: recipient.company,
      street1: recipient.address1,
      street2: recipient.address2,
      city: recipient.city,
      province: recipient.state!,
      postalCode: recipient.zip,
      countryCode: recipient.country
    },
    packages: packageList
  };
  logger.info('Return USPS 3 price request object');
  return data;
};
