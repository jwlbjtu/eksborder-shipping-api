import { toUpper } from 'lodash';
import { FedexAddressValidationRequest } from '../../../../types/carriers/fedex.rest';
import { IAddress } from '../../../../types/shipping.types';
import FedexAuthHelper from './auth.helper';
import axios from 'axios';
import { getFedexHost } from '../../../constants';
import { logger } from '../../../logger';

const addressValidationUrl = '/address/v1/addresses/resolve';

export const addressValidation = async (
  address: IAddress,
  isTest: boolean
): Promise<boolean> => {
  // Get auth token
  const apiKey = isTest
    ? process.env.FEDEX_API_KEY_TEST
    : process.env.FEDEX_API_KEY_PROD;
  const apiSecret = isTest
    ? process.env.FEDEX_SECRET_KEY_TEST
    : process.env.FEDEX_SECRET_KEY_PROD;
  const apiUrl = getFedexHost(isTest);
  const token = await FedexAuthHelper.getToken(
    apiUrl,
    apiKey!,
    apiSecret!,
    isTest
  );
  // Build request body
  const body: FedexAddressValidationRequest = {
    validateAddressControlParameters: {
      includeResolutionTokens: true
    },
    addressesToValidate: [
      {
        address: {
          streetLines: address.street2
            ? [address.street1, address.street2]
            : [address.street1],
          city: toUpper(address.city),
          stateOrProvinceCode: toUpper(address.state),
          postalCode: address.zip,
          countryCode: address.country
        }
      }
    ]
  };
  logger.info('Fedex Address Validation Request');
  logger.info(body);
  // Send request
  const baseUrl = getFedexHost(isTest);
  const url = `${baseUrl}${addressValidationUrl}`;
  try {
    const res = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token?.access_token}`
      }
    });
    const resolbedAddress = res.data.output.resolvedAddresses[0];
    address.isResidential = resolbedAddress.classification != 'BUSINESS';
    return true;
  } catch (error) {
    console.log(error.response.data);
    logger.error(JSON.stringify(error.response.data));
    return false;
  }
};
