import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import {
  DPDCancelResponse,
  DPDCredentials,
  DPDLabelResponse,
  DPDOrderRequestBody,
  DPDOrderResponse
} from '../../../types/carriers/dpd';
import { IAccount } from '../../../types/user.types';
import { CARRIERS, DPD_HOSTS } from '../../constants';
import { logger } from '../../logger';
import CarrierSchema from '../../../models/carrier.model';
import axios from 'axios';
import { IShipping } from '../../../types/record.types';
import ThirdpartyPriceSchema from '../../../models/thirdparty.model';
import {
  computeThirdpartyRate,
  validateThirdpartyPrice
} from '../thirdparty.helpers';
import { buildDpdOrderRequestBody, callDPDOrderEndpoint } from './dpd.label';
import { ApiFinalResult } from '../../../types/carriers/api';
import util from 'util';

class DpdAPI implements ICarrierAPI {
  private isTest: boolean;
  private clientCarrier: IAccount; // Replace with actual type
  private carrierRef: string;
  private credentials: DPDCredentials = {
    username: '',
    password: ''
  }; // Replace with actual type
  private token = '';
  private apiUrl = '';

  constructor(isTest: boolean, clientCarrier: IAccount) {
    // Replace 'any' with actual type
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    this.apiUrl = isTest
      ? process.env.DPD_TEST || DPD_HOSTS.DPD_TEST
      : process.env.DPD_PROD || DPD_HOSTS.DPD_PROD;
  }

  public init = async (): Promise<void> => {
    const carrierData = await CarrierSchema.findOne({ _id: this.carrierRef });
    if (carrierData) {
      if (this.isTest) {
        this.credentials.password = carrierData.testClientSecret || '';
        this.credentials.username = carrierData.testClientId || '';
      } else {
        this.credentials.password = carrierData.clientSecret;
        this.credentials.username = carrierData.clientId;
      }
      // auth to get token
      await this.auth();
    } else {
      logger.error(
        `Carrier ${CARRIERS.DPD} not found for id ${this.carrierRef}`
      );
      throw new Error(`API not supported`);
    }
  };

  public auth = async (): Promise<void> => {
    logger.info('Authenticating to DPD API');
    const path = '/api/account/Authenticate';
    const authRequest = {
      UsernameOrEmailAddress: this.credentials.username,
      Password: this.credentials.password
    };
    const response = await axios.post(`${this.apiUrl}${path}`, authRequest);
    if (response.data.success) {
      this.token = response.data.result; // Assuming the token is in the 'result' field
      logger.info(
        `DPD API authentication successful for carrier ${this.carrierRef}`
      );
    } else {
      logger.error(
        `DPD API authentication failed: ${response.data.error.message}`
      );
      throw new Error(`Authentication failed: ${response.data.error.message}`);
    }
  };

  public products = async (
    shipmentData: IShipping,
    isInternational: boolean
  ): Promise<{ rates: Rate[]; errors: string[] } | string> => {
    logger.info('Fetching rates from thirdparty price tables');
    // Calculate Rui Yun rates with thirdparty price tables\
    try {
      // Find the price table for the given channel
      const priceTableList = await ThirdpartyPriceSchema.find({
        'service.id': shipmentData.service!.id!
      });
      if (!priceTableList || priceTableList.length === 0) {
        return '渠道异常';
      }
      // console.log(priceTableList);
      // Validate shipment with price table conditions
      const priceTable = validateThirdpartyPrice(priceTableList, shipmentData);
      if (!priceTable) {
        return '货物重量超出渠道范围';
      }
      logger.info(
        `Using price table ${priceTable.name}, ${priceTable.service.key}-${priceTable.service.id}-${priceTable.service.name}`
      );
      // Calculate rates based on price table
      const result = computeThirdpartyRate(
        priceTable,
        shipmentData,
        this.isTest,
        this.clientCarrier
      );
      return result;
    } catch (error) {
      logger.error(error);
      return (error as Error).message;
    }
  };

  public label = async (
    shipmentData: IShipping,
    rate: Rate
  ): Promise<ApiFinalResult> => {
    logger.info('Generating label for DPD shipment');
    // 1. Send order request to DPD API
    const orderPath = '/api/services/app/hawb/apiCreateHawb';
    const orderRequestBody: DPDOrderRequestBody = buildDpdOrderRequestBody(
      shipmentData,
      rate,
      this.isTest
    );
    const response = await callDPDOrderEndpoint(
      `${this.apiUrl}${orderPath}`,
      orderRequestBody,
      this.token
    );

    if (!response.result.result) {
      logger.error('Hawb number not found in response');
      logger.error(`Error message: ${response.result.resultMsg}`);
      throw new Error(`Error message: ${response.result.resultMsg}`);
    } else {
      const hawNumber = response.result.hawbNumber;
      const childHawbNumber = response.result.childHawbNumber;
      let trackingNums = [hawNumber];
      if (!childHawbNumber) {
        trackingNums = [hawNumber, ...childHawbNumber.split(',')];
      }
      // 2. Retrieve label URL from response
      const labelUrl = '/api/services/app/hawb/GetHawbLables';
      const labelReqBody = [hawNumber];
      try {
        const labelResponse = await axios.post(
          `${this.apiUrl}${labelUrl}`,
          labelReqBody,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.token}`
            }
          }
        );

        const labelData: DPDLabelResponse = labelResponse.data;
        const labelResult = labelData.result[0];
        if (labelResult.result) {
          const labelUrl = labelResult.labelUrl!;
          logger.info('Label generated successfully');
          const apiResult: ApiFinalResult = {
            invoiceUrl: '',
            forms: [],
            labelUrlList: [{ labelUrl: labelUrl, type: 'PDF' }],
            labels: trackingNums.map((tracking) => {
              return {
                createdOn: new Date(),
                tracking: tracking,
                carrier: '-',
                service: '-',
                data: '-',
                type: '-',
                format: '-',
                encodeType: '-',
                isTest: this.isTest
              };
            }),
            shippingRate: [],
            rOrderId: shipmentData.orderId,
            trackingNum: hawNumber,
            turnChanddelId: rate.carrier,
            turnServiceType: rate.service
          };
          return apiResult;
        } else {
          logger.error(`Label generation failed: ${labelResult.resultMsg}`);
          throw new Error(`Label generation failed: ${labelResult.resultMsg}`);
        }
      } catch (error) {
        logger.error(`Error generating label: ${error}`);
        throw new Error(`Label generation failed: ${error}`);
      }
    }
  };

  public cancelLabel = async (trackingNumber: string): Promise<void> => {
    logger.info(`Cancelling label for tracking number ${trackingNumber}`);
    const path = '/api/services/app/hawb/ApiCancelHawb';
    const hawdNumbers = trackingNumber.split(',');
    try {
      const response = await axios.post(`${this.apiUrl}${path}`, hawdNumbers, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        }
      });
      const data = response.data as DPDCancelResponse;
      logger.info('DPD Cancel Label API Response:');
      logger.info(util.inspect(data, false, null, true));
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };
}

export default DpdAPI;
