import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import {
  MaoYuanAuthRequest,
  MaoYuanAuthResponse,
  MaoYuanCredentials,
  MaoYuanLabelUrlRep,
  MaoYuanRateResponse
} from '../../../types/carriers/mao_yuan';
import axios from 'axios';
import util from 'util';
import { IShipping } from '../../../types/record.types';
import { IAccount } from '../../../types/user.types';
import { CARRIERS, MAOYUAN_HOSTS } from '../../constants';
import { logger } from '../../logger';
import CarrierSchema from '../../../models/carrier.model';
import { ApiFinalResult } from '../../../types/carriers/api';
import {
  buildMaoYuanLabelReqBody,
  callMaoYuanLabelEndpoint
} from './mao_yuan.label';
import {
  buildMaoYuanProductsReqBody,
  buildMaoYuanProductsReqBodyWithWeight
} from './mao_yuan.rate';

class MaoYuanAPI implements ICarrierAPI {
  private isTest: boolean;
  private clientCarrier: IAccount;
  private carrierRef: string;
  private credentials: MaoYuanCredentials = {
    account: '',
    password: '',
    secretKey: ''
  };
  private token = '';
  private apiUrl = '';

  constructor(isTest: boolean, clientCarrier: IAccount) {
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    if (isTest) {
      this.apiUrl = process.env.MAO_YUAN_TEST || MAOYUAN_HOSTS.MAOYUAN_TEST;
    } else {
      this.apiUrl = process.env.MAO_YUAN_PROD || MAOYUAN_HOSTS.MAOYUAN_PROD;
    }
  }

  public init = async (): Promise<void> => {
    const carrierData = await CarrierSchema.findOne({ _id: this.carrierRef });
    if (carrierData) {
      this.credentials.password = carrierData.clientSecret;
      this.credentials.account = carrierData.clientId;
      this.credentials.secretKey = carrierData.accessKey!;
      // auth to get token
      await this.auth();
    } else {
      logger.error(
        `Carrier ${CARRIERS.MAO_YUAN} not found for id ${this.carrierRef}`
      );
      throw new Error(`API not supported`);
    }
  };

  public auth = async (): Promise<void> => {
    logger.info('Authenticating to MaoYuan');
    const path = '/api/token/getAccessToken';
    const authRequest: MaoYuanAuthRequest = {
      account: this.credentials.account,
      password: this.credentials.password,
      secretKey: this.credentials.secretKey
    };
    // Send request to MaoYuan Auth API
    const response = await axios.post(`${this.apiUrl}${path}`, authRequest);
    const result = response.data as MaoYuanAuthResponse;
    if (result.code === 0) {
      logger.error(util.inspect(result, false, null, true));
      throw new Error(result.msg);
    }
    this.token = result.data.token;
  };

  public products = async (
    shipmentData: IShipping
  ): Promise<{ rates: Rate[]; errors: string[] } | string> => {
    logger.info("Fetching rates from MaoYuan's rate API");
    const path = '/api/shipper/getRatesQuotes';
    const maoyuanRateReq = buildMaoYuanProductsReqBody(shipmentData);
    logger.info('maoyuanRateReq');
    logger.info(util.inspect(maoyuanRateReq, false, null, true));
    try {
      const response = await axios.post(
        `${this.apiUrl}${path}`,
        maoyuanRateReq,
        {
          headers: {
            'Content-Type': 'application/json',
            token: this.token
          }
        }
      );
      const data = response.data as MaoYuanRateResponse;
      if (data.code !== 1) {
        logger.error(util.inspect(data, false, null, true));
        throw new Error(data.msg);
      }
      const rateData = data.data;
      const rateObj: Rate = {
        carrier: shipmentData.service!.key,
        serviceId: shipmentData.service!.id!,
        service: shipmentData.service!.name,
        account: shipmentData.carrierAccount,
        rate: rateData.actualAmount,
        currency: rateData.currency,
        thirdparty: false,
        thirdpartyAcctId: '',
        clientCarrierId: this.clientCarrier.id.toString(),
        isTest: false
      };
      return { rates: [rateObj], errors: [] };
    } catch (error) {
      logger.error(error);
      throw new Error(error as string);
    }
  };

  public label = async (
    shipmentData: IShipping,
    rate: Rate
  ): Promise<ApiFinalResult> => {
    // Return test response
    if (this.isTest) {
      return {
        turnChanddelId: 'ups',
        turnServiceType: 'M4',
        labels: [],
        labelUrlList: [
          {
            labelUrl:
              'ttps://maoyuan.zhiyunexp.com/trackingNumber/1ZKE10660304534660/1ZKE10660304534660.GIF',
            type: 'gif'
          }
        ],
        trackingNum: '1ZKE10660304534660',
        invoiceUrl: undefined,
        forms: undefined,
        shippingRate: [],
        rOrderId: shipmentData.orderId
      };
    }

    const labelReqBody = buildMaoYuanLabelReqBody(shipmentData, rate);
    logger.info('Mao Yuan Label Request Body');
    logger.info(util.inspect(labelReqBody, false, null, true));
    try {
      logger.info('Calling Mao Yuan [Label] endpoint');
      logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
      const path = '/api/shipper/create';
      const response = await callMaoYuanLabelEndpoint(
        this.apiUrl,
        labelReqBody,
        this.token,
        path,
        shipmentData.service!
      );
      const labelUrl = await this.getUrlPdf(response.trackingNum);
      response.labelUrlList.push({
        labelUrl,
        type: 'pdf'
      });
      return response;
    } catch (error) {
      logger.error(error);
      throw new Error(error as string);
    }
  };

  private getUrlPdf = async (trackingNumber: string): Promise<string> => {
    logger.info(
      `Getting label url from MaoYuan for tracking number ${trackingNumber}`
    );
    const path = `/api/shipper/getUrlPdf`;
    const response = await axios.post(
      `${this.apiUrl}${path}`,
      {
        trackingNumber
      },
      {
        headers: {
          'Content-Type': 'application/json',
          token: this.token
        }
      }
    );
    const data = response.data as MaoYuanLabelUrlRep;
    if (data.code !== 1) {
      throw new Error(data.msg);
    } else {
      return data.data.urlPdf;
    }
  };

  public cancelLabel = async (trackingNumber: string): Promise<void> => {
    logger.info(`Cancelling label for tracking number ${trackingNumber}`);
    const path = '/api/shipper/cancel';
    try {
      const response = await axios.post(
        `${this.apiUrl}${path}`,
        {
          trackingNumber
        },
        {
          headers: {
            'Content-Type': 'application/json',
            token: this.token
          }
        }
      );
      const data = response.data as MaoYuanLabelUrlRep;
      if (data.code !== 1) {
        throw new Error(data.msg);
      }
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  public verifyPrice = async (
    shipmentData: IShipping,
    weight: number,
    weightType: string,
    zone: string
  ): Promise<{ rates: Rate[]; errors: string[] } | string> => {
    logger.info('Start to verify price Mao Yuan');
    const path = '/api/shipper/getRatesQuotes';
    const maoyuanRateReq = buildMaoYuanProductsReqBodyWithWeight(
      shipmentData,
      weight,
      weightType
    );
    try {
      const response = await axios.post(
        `${this.apiUrl}${path}`,
        maoyuanRateReq,
        {
          headers: {
            'Content-Type': 'application/json',
            token: this.token
          }
        }
      );
      const data = response.data as MaoYuanRateResponse;
      if (data.code !== 1) {
        throw new Error(data.msg);
      }
      const rateData = data.data;
      const rateObj: Rate = {
        carrier: shipmentData.service!.key,
        serviceId: shipmentData.service!.id!,
        service: shipmentData.service!.name,
        account: shipmentData.carrierAccount,
        rate: rateData.actualAmount,
        currency: rateData.currency,
        thirdparty: false,
        thirdpartyAcctId: '',
        clientCarrierId: this.clientCarrier.id.toString(),
        isTest: false
      };
      return { rates: [rateObj], errors: [] };
    } catch (error) {
      logger.error(error);
      throw new Error(error as string);
    }
  };
}

export default MaoYuanAPI;
