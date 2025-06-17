import {
  USPS3_LABEL_RESPONSE,
  USPS3_LINE_INFO,
  USPS3_PARCEL,
  USPS3_SHIPPING_REQUEST
} from '../../../types/carriers/usps3';
import { IShipping } from '../../../types/record.types';
import { logger } from '../../logger';
import axios from 'axios';
import util from 'util';

export const retrieveUsps3Lable = async (
  url: string,
  token: string
): Promise<USPS3_LABEL_RESPONSE> => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: token
      }
    });
    return response.data as USPS3_LABEL_RESPONSE;
  } catch (error) {
    logger.error(error);
    return error as USPS3_LABEL_RESPONSE;
  }
};

export const buildUsps3ParcelRequest = (
  shipment: IShipping
): USPS3_SHIPPING_REQUEST => {
  logger.info('Building USPS 3 Label Request');
  const sender = shipment.sender!;
  const recipient = shipment.toAddress;

  const parcelsList: USPS3_PARCEL[] = [];
  for (let i = 0; i < shipment.packageList.length; i++) {
    const pkg = shipment.packageList[i];
    const lineItemList: USPS3_LINE_INFO[] = [];
    for (let j = 0; j < shipment.items!.length; j++) {
      const item = shipment.items![j];
      if (item.index == i) {
        const lineItem: USPS3_LINE_INFO = {
          goodsInfo: {
            name: item.itemTitle,
            sku: item.sku,
            hsCode: item.hsTariffNumber
          },
          lineTotal: {
            value: item.totalValue,
            unit: item.itemValueCurrency.toUpperCase()
          },
          quantity: item.quantity
        };
        lineItemList.push(lineItem);
      }
    }
    const parcel: USPS3_PARCEL = {
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
      lineInfos: lineItemList
    };
    parcelsList.push(parcel);
  }

  const data: USPS3_SHIPPING_REQUEST = {
    orderNbr: shipment.orderId,
    serviceCode: shipment.service!.id!,
    shipper: {
      name: sender.name!,
      phone: sender.phone,
      email: sender.email,
      company: sender.company,
      street1: sender.street1,
      street2: sender.street2,
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
      street1: recipient.street1,
      street2: recipient.street2,
      city: recipient.city,
      province: recipient.state!,
      postalCode: recipient.zip,
      countryCode: recipient.country
    },
    parcels: parcelsList
  };
  //   console.log(util.inspect(data, false, null, true));
  logger.info('USPS 3 Label Request Built');
  return data;
};
