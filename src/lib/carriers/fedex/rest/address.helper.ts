import { toUpper } from 'lodash';
import { FedexAddressValidationRequest } from '../../../../types/carriers/fedex.rest';
import { IAddress } from '../../../../types/shipping.types';
import FedexAuthHelper from './auth.helper';
import axios from 'axios';
import { getFedexHost } from '../../../constants';
import { logger } from '../../../logger';

//const ACCOUNT_NUMBER_TEST = '740561073';
const addressValidationUrl = '/address/v1/addresses/resolve';

//const URL_PRODUCTION = 'https://apis.fedex.com/address/v1/addresses/resolve';

export const addressValidation = async (
  address: IAddress,
  isTest: boolean
): Promise<boolean> => {
  // Get auth token
  const token = await FedexAuthHelper.getToken(isTest);
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
    console.log((error as any).response.data);
    logger.error(JSON.stringify((error as any).response.data));
    return false;
  }
};
