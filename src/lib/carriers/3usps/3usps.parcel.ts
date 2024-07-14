import {
  USPS3_SHIPPING_REQUEST,
  USPS3_SHIPPING_RESPONSE
} from '../../../types/carriers/usps3';
import { logger } from '../../logger';
import axios from 'axios';

export const usps3ParcelHandler = async (
  data: USPS3_SHIPPING_REQUEST,
  baseUrl: string,
  token: string
): Promise<USPS3_SHIPPING_RESPONSE> => {
  try {
    logger.info('Sending USPS3 parcels request to API');
    const response = await axios.post(`${baseUrl}/Shipments`, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      }
    });
    logger.info(`USPS3 parcels request isSuccess=${response.data.isSuccess}`);
    return response.data as USPS3_SHIPPING_RESPONSE;
  } catch (error) {
    logger.error((error as any).response.data);
    return (error as any).response.data as USPS3_SHIPPING_RESPONSE;
  }
};
