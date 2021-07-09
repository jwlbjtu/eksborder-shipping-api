import { CARRIERS, USPS_HOSTS } from '../../constants';

import util from 'util';
import {
  buildUspsProductReqBody,
  callUspsProductsEndpoint
} from './products.helpers';
import { buildUspsLabelReqBody, callUspsLabelEndpoint } from './label.helpers';
import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import { IAccount } from '../../../types/user.types';
import {
  FormData,
  ICarrier,
  IShipping,
  LabelData
} from '../../../types/record.types';
import CarrierSchema from '../../../models/carrier.model';
import { logger } from '../../logger';
import { isShipmentInternational } from '../carrier.helper';

class UspsAPI implements ICarrierAPI {
  private isTest: boolean;
  private clientCarrier: IAccount;
  private carrierRef: string;
  private carrier: ICarrier | undefined;
  private credential: {
    userId: string;
  } = { userId: '' };
  private apiUrl = '';

  constructor(isTest: boolean, clientCarrier: IAccount) {
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    if (isTest) {
      this.apiUrl = process.env.USPS_TEST || USPS_HOSTS.USPS_TEST;
    } else {
      this.apiUrl = process.env.USPS_PROD || USPS_HOSTS.USPS_PROD;
    }
  }

  public init = async (): Promise<void> => {
    const carrierData = await CarrierSchema.findOne({
      _id: this.carrierRef
    });
    if (carrierData) {
      this.carrier = carrierData as ICarrier;
      this.credential.userId = carrierData.clientId;
    } else {
      logger.error(
        `Carrier ${CARRIERS.USPS} not found for id ${this.carrierRef}`
      );
      throw new Error(`${CARRIERS.USPS} not supported`);
    }
  };

  public auth = async (): Promise<void> => {
    // Intended to leave blank
  };

  public products = async (
    shipmentData: IShipping,
    isInternational: boolean
  ): Promise<{ rates: Rate[]; errors: string[] } | string> => {
    // Do not support multiple package in an order
    if (shipmentData.morePackages && shipmentData.morePackages.length > 0) {
      return { rates: [], errors: [] };
    }
    const prodReqBody = buildUspsProductReqBody(
      shipmentData,
      this.credential.userId,
      isInternational
    );
    logger.info('Calling USPS [Product Finder] endpoint');
    logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
    try {
      const response = await callUspsProductsEndpoint(
        this.apiUrl,
        isInternational,
        prodReqBody,
        shipmentData,
        this.isTest,
        this.clientCarrier
      );
      return response;
    } catch (error) {
      if (error.response) {
        console.log(error.response.data);
        logger.error(util.inspect(error.response.data, true));
        return `${CARRIERS.USPS} ERROR: ${error.response.data.title}`;
      } else {
        console.log(error.message);
        logger.error(error.message);
        return `${CARRIERS.USPS} ERROR: ${error.message}`;
      }
    }
  };

  public label = async (
    shipmentData: IShipping,
    rate: Rate
  ): Promise<{ labels: LabelData[]; forms: FormData[] | undefined }> => {
    const isInternational = isShipmentInternational(shipmentData);
    const labelReqBody = buildUspsLabelReqBody(
      shipmentData,
      this.credential.userId,
      rate,
      isInternational
    );
    if (labelReqBody) {
      logger.info('Calling USPS [Label] endpoint');
      logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
      try {
        const response = await callUspsLabelEndpoint(
          this.apiUrl,
          rate.serviceId,
          isInternational,
          labelReqBody,
          this.isTest
        );
        return response;
      } catch (error) {
        if (error.response) {
          console.log(error.response.data);
          logger.error(util.inspect(error.response.data, true, null));
          throw new Error(error.response.data.title);
        } else {
          console.log(error);
          logger.error(error.message);
          throw new Error(error.message);
        }
      }
    } else {
      logger.error(`Label Request Body is empty for ${CARRIERS.USPS}`);
      throw new Error(`${CARRIERS.USPS} ERROR: Label Request Body is empty`);
    }
  };
}

export default UspsAPI;
