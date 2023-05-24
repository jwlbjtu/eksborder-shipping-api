import { ICarrierAPI, Rate } from '../../../../types/carriers/carrier';
import {
  FormData,
  ICarrier,
  IShipping,
  LabelData,
  ShippingRate
} from '../../../../types/record.types';
import { IAccount } from '../../../../types/user.types';
import { CARRIERS, FEDEX_HOSTS } from '../../../constants';
import CarrierSchema from '../../../../models/carrier.model';
import { logger } from '../../../logger';
import {
  buildFedexRestRateRequest,
  fedexRestRateService
} from './product.helper';
import { FedexRestLabelRequest } from '../../../../types/carriers/fedex.rest';
import {
  buildFedexRestLabelRequest,
  fedexRestLabelService
} from './label.helper';
import util from 'util';
import { addressValidation } from './address.helper';
import { IAddress } from '../../../../types/shipping.types';

class FedexRestAPI implements ICarrierAPI {
  private isTest: boolean;
  private clientCarrier: IAccount;
  private carrierRef: string;
  private carrier: ICarrier | undefined;
  private accountNumber = '';
  private apiKey = '';
  private apiSecret = '';
  private hubId = '';
  private apiUrl = '';

  constructor(isTest: boolean, clientCarrier: IAccount) {
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    if (isTest) {
      this.apiUrl = process.env.FEDEX_REST_TEST || FEDEX_HOSTS.FEDEX_REST_TEST;
    } else {
      this.apiUrl = process.env.FEDEX_REST_PROD || FEDEX_HOSTS.FEDEX_REST_PROD;
    }
  }

  public init = async (): Promise<void> => {
    const carrierData = await CarrierSchema.findOne({
      _id: this.carrierRef
    });
    if (carrierData) {
      this.carrier = carrierData as ICarrier;
      if (this.isTest) {
        this.apiKey = carrierData.testAccessKey!;
        this.apiSecret = carrierData.testClientSecret!;
        this.accountNumber = carrierData.testAccountNum!;
        this.hubId = carrierData.testHubId!;
      } else {
        this.apiKey = carrierData.accessKey!;
        this.apiSecret = carrierData.clientSecret!;
        this.accountNumber = carrierData.accountNum!;
        this.hubId = carrierData.hubId!;
      }
    } else {
      logger.error(
        `Carrier ${CARRIERS.FEDEX} not found for id ${this.carrierRef}`
      );
      throw new Error(`${CARRIERS.FEDEX} not supported`);
    }
  };

  public auth = async (): Promise<void> => {
    // Intended to leave blank
  };

  public products = async (
    shipmentData: IShipping,
    isInternational: boolean
  ): Promise<{ rates: Rate[]; errors: string[] } | string> => {
    try {
      // Create request body
      const fedexRateRequestBody = buildFedexRestRateRequest(
        this.accountNumber,
        shipmentData,
        this.hubId,
        this.isTest
      );
      // Send request
      logger.info('Calling FEDEX [Product Finder] endpoint');
      logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
      // Parse response
      const response = await fedexRestRateService(
        this.apiUrl,
        this.apiKey,
        this.apiSecret,
        fedexRateRequestBody,
        shipmentData,
        this.isTest,
        this.clientCarrier
      );
      return response;
    } catch (error) {
      if (error.response) {
        logger.error(util.inspect(error.response.data, true, null));
        return `${CARRIERS.FEDEX} ERROR: ${error.response.data.errors[0].message}`;
      } else {
        console.log(error);
        logger.error(util.inspect(error.message, true, null));
        return `${CARRIERS.FEDEX} ERROR: ${error.message}`;
      }
    }
  };

  public label = async (
    shipment: IShipping,
    rate: Rate
  ): Promise<{
    labels: LabelData[];
    forms: FormData[] | undefined;
    shippingRate: ShippingRate[];
  }> => {
    // Create request body
    const labelReqBody: FedexRestLabelRequest = buildFedexRestLabelRequest(
      this.accountNumber,
      this.hubId,
      shipment,
      rate
    );
    logger.info(util.inspect(labelReqBody, true, null));
    logger.info('Calling FEDEX [Label] endpoint -- Master');
    logger.info(`User: ${shipment.userRef}, Order: ${shipment.id}`);
    // Send request
    try {
      const response = await fedexRestLabelService(
        this.apiUrl,
        this.apiKey,
        this.apiSecret,
        labelReqBody,
        this.isTest
      );
      return response;
    } catch (error) {
      if (error.response) {
        logger.error(util.inspect(error.response.data, true, null));
        throw new Error(error.response.data.errors[0].message);
      } else {
        console.log(error);
        logger.error(util.inspect(error.message, true, null));
        throw new Error(error.message);
      }
    }
  };

  public validateAddress = async (
    address: IAddress,
    isTest: boolean
  ): Promise<boolean> => {
    return await addressValidation(address, isTest);
  };
}

export default FedexRestAPI;
