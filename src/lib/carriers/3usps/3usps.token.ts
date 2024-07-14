import axios from 'axios';
import {
  USPS3_TOKEN_REQUEST,
  USPS3_TOKEN_RESPONSE
} from '../../../types/carriers/usps3';
import { logger } from '../../logger';
import { Cache } from '../../cache';
import AsyncLock from 'async-lock';
import querystring from 'querystring';
import util from 'util';

const lock = new AsyncLock();

export const usps3TokenHandler = async (
  username: string,
  password: string,
  baseUrl: string
): Promise<USPS3_TOKEN_RESPONSE> => {
  try {
    logger.info(`Getting USPS3 token from ${baseUrl}`);
    const response = await axios.postForm(`${baseUrl}/Tokens`, {
      username,
      password
    });
    // console.error(response);
    logger.info(`USPS3 token response is good`);
    return response.data as USPS3_TOKEN_RESPONSE;
  } catch (error) {
    logger.error(util.inspect((error as any).response.data.errors));
    return (error as any).response.data.errors;
  }
};

export const getUsps3Toekn = async (
  tokenRequest: USPS3_TOKEN_REQUEST,
  baseUrl: string
) => {
  const key = 'usps3-token';
  const result = await new Promise<any>((resolve, reject) => {
    lock.acquire(
      key,
      async (done) => {
        try {
          const exist = Cache.has(key);
          if (exist) {
            logger.info(`Getting USPS3 token from cache`);
            const token = Cache.get(key);
            done(null, token);
          } else {
            logger.info(`Getting USPS3 token from API`);
            const response = await usps3TokenHandler(
              tokenRequest.username,
              tokenRequest.password,
              `${baseUrl}`
            );
            if (response.access_token) {
              logger.info(`Caching USPS3 token`);
              Cache.set(
                key,
                `${response.token_type} ${response.access_token}`,
                response.expires_in - 3600
              );
              done(null, `${response.token_type} ${response.access_token}`);
            } else {
              logger.error(response);
              done(new Error(response.message), null);
            }
          }
        } catch (error) {
          logger.error(error);
          done(error as Error, null);
        }
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result);
      }
    );
  });
  return result;
};
