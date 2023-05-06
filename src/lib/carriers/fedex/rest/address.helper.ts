import { toUpper } from 'lodash';
import { FedexAddressValidationRequest } from '../../../../types/carriers/fedex.rest';
import { IAddress } from '../../../../types/shipping.types';
import FedexAuthHelper from './auth.helper';
import axios from 'axios';
import { getFedexHost } from '../../../constants';
import { logger } from '../../../logger';

//const ACCOUNT_NUMBER_TEST = '740561073';
const addressValidationUrl = '/address/v1/addresses/resolve';
const API_KEY_TEST = 'l798d34f0bb3b04fcd9668568fdb306490';
const SECRET_KEY_TEST = 'f991c6816c7a452bb38bba678d1cf288';
const API_KEY_PROD = 'l7ff41a4f16d674b5ebf09e9a1f6dddd8a';
const SECRET_KEY_PROD = 'l7ff41a4f16d674b5ebf09e9a1f6dddd8a';

//const URL_PRODUCTION = 'https://apis.fedex.com/address/v1/addresses/resolve';

export const addressValidation = async (
  address: IAddress,
  isTest: boolean
): Promise<boolean> => {
  // Get auth token
  const apiKey = isTest ? API_KEY_TEST : API_KEY_PROD;
  const apiSecret = isTest ? SECRET_KEY_TEST : SECRET_KEY_PROD;
  const apiUrl = getFedexHost(isTest);
  const token = await FedexAuthHelper.getToken(
    apiUrl,
    apiKey,
    apiSecret,
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
    address.isResidential = resolbedAddress.classification === 'RESIDENTIAL';
    return true;
  } catch (error) {
    console.log(error.response.data);
    logger.error(JSON.stringify(error.response.data));
    return false;
  }
};
