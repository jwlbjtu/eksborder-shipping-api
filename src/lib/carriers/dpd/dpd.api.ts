import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import { DPDCredentials } from '../../../types/carriers/dpd';
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

  private auth = async (): Promise<void> => {
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
  ): Promise<string> => {
    logger.info('Generating label for DPD shipment');
    // Implement label generation logic here
    // This is a placeholder implementation
    return `Label generated for shipment ${shipmentData.id} with rate ${rate.rate}`;
  };
}
