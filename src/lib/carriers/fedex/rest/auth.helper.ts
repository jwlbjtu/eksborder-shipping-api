import { FedexAuthToken } from '../../../../types/carriers/fedex.rest';
import axios from 'axios';
import { logger } from '../../../logger';
import qs from 'qs';

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
    apiUrl: string,
    apiKey: string,
    apiSecret: string,
    isTest: boolean
  ): Promise<FedexAuthToken | undefined> => {
    const isBusy = isTest
      ? FedexAuthHelper.isGettingTestToken
      : FedexAuthHelper.isGettingToken;
    if (isBusy) {
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
      return FedexAuthHelper.getToken(apiUrl, apiKey, apiSecret, isTest);
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

    const url = `${apiUrl}${FedexAuthHelper.authUrl}`;

    const data = {
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret
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
      logger.error(error.response.data.errors[0].message);
      FedexAuthHelper.isGettingToken = false;
      return;
    }
  };
}

export default FedexAuthHelper;
