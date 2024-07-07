import { FedexAuthToken } from '../../../../types/carriers/fedex.rest';
import axios from 'axios';
import { getFedexHost } from '../../../constants';
import { logger } from '../../../logger';
import qs from 'qs';

const API_KEY_TEST = 'l798d34f0bb3b04fcd9668568fdb306490';
const SECRET_KEY_TEST = 'f991c6816c7a452bb38bba678d1cf288';
const API_KEY_PROD = 'l7ff41a4f16d674b5ebf09e9a1f6dddd8a';
const SECRET_KEY_PROD = 'l7ff41a4f16d674b5ebf09e9a1f6dddd8a';

class FedexAuthHelper {
  static authUrl = '/oauth/token';
  static testAuthToken: FedexAuthToken | undefined;
  static isGettingTestToken = false;
  static authToken: FedexAuthToken | undefined;
  static isGettingToken = false;

  static isTokenExpired = (token: FedexAuthToken | undefined): boolean => {
    if (token) {
      const now = Date.now();
      return now >= token.tokenExpirationTime;
    }
    return true;
  };

  static getToken = async (
    isTest: boolean
  ): Promise<FedexAuthToken | undefined> => {
    const isBusiness = isTest
      ? FedexAuthHelper.isGettingTestToken
      : FedexAuthHelper.isGettingToken;
    if (isBusiness) {
      // Wait for token to be retrieved before trying again
      await new Promise<void>((resolve) => {
        const intervaId = setInterval(async () => {
          const business = isTest
            ? FedexAuthHelper.isGettingTestToken
            : FedexAuthHelper.isGettingToken;
          if (!business) {
            clearInterval(intervaId);
            resolve();
          }
        }, 100);
      });
      return FedexAuthHelper.getToken(isTest);
    }

    if (isTest) {
      if (
        FedexAuthHelper.testAuthToken &&
        !FedexAuthHelper.isTokenExpired(FedexAuthHelper.testAuthToken)
      ) {
        return FedexAuthHelper.testAuthToken;
      }
    } else {
      if (
        FedexAuthHelper.authToken &&
        !FedexAuthHelper.isTokenExpired(FedexAuthHelper.authToken)
      ) {
        return FedexAuthHelper.authToken;
      }
    }

    // Get token from Fedex
    if (isTest) {
      FedexAuthHelper.isGettingTestToken = true;
    } else {
      FedexAuthHelper.isGettingToken = true;
    }

    const fedexUrl = getFedexHost(isTest);
    const url = `${fedexUrl}${FedexAuthHelper.authUrl}`;

    const data = {
      grant_type: 'client_credentials',
      client_id: isTest ? API_KEY_TEST : API_KEY_PROD,
      client_secret: isTest ? SECRET_KEY_TEST : SECRET_KEY_PROD
    };

    try {
      const res = await axios.post(url, qs.stringify(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const { access_token, expires_in } = res.data;
      const tokenExpirationTime = Date.now() + (expires_in - 60) * 1000;
      const token: FedexAuthToken = {
        access_token,
        tokenExpirationTime
      };
      if (isTest) {
        FedexAuthHelper.testAuthToken = token;
        FedexAuthHelper.isGettingTestToken = false;
      } else {
        FedexAuthHelper.authToken = token;
        FedexAuthHelper.isGettingToken = false;
      }

      return token;
    } catch (error) {
      logger.error('Failed to authenticate with Fedex');
      logger.error((error as any).response.data.errors[0].message);
      FedexAuthHelper.isGettingToken = false;
      return;
    }
  };
}

export default FedexAuthHelper;
