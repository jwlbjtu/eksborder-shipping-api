import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import { RuiYunCredentials } from '../../../types/carriers/rui_yun';
import { IAccount } from '../../../types/user.types';
import { CARRIERS, RUIYUN_HOSTS } from '../../constants';
import CarrierSchema from '../../../models/carrier.model';
import ThirdpartyPriceSchema from '../../../models/thirdparty.model';
import { ICarrier, IShipping } from '../../../types/record.types';
import { logger } from '../../logger';
import {
  computeThirdpartyRate,
  computeThirdpartyRateWithWeight,
  validateThirdpartyPrice,
  validateThirdpartyPriceWithWeight
} from '../thirdparty.helpers';
import { buildRuiYunLabelReqBody } from './rui_yun.label';
import { callRuiYunLabelEndpoint } from '../../utils/api.utils';
import { ApiFinalResult } from '../../../types/carriers/api';
import { getWeightUnit } from '../../utils/helpers';

class RuiYunAPI implements ICarrierAPI {
  private isTest: boolean;
  private clientCarrier: IAccount;
  private carrierRef: string;
  private carrier: ICarrier | undefined;
  private credentials: RuiYunCredentials = {
    bankerId: '',
    userId: '',
    plantId: '',
    plantKey: ''
  };
  private apiUrl = '';

  constructor(isTest: boolean, clientCarrier: IAccount) {
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    if (isTest) {
      this.apiUrl = process.env.RUI_YUN_TEST || RUIYUN_HOSTS.RUIYUN_TEST;
    } else {
      this.apiUrl = process.env.RUI_YUN_PROD || RUIYUN_HOSTS.RUIYUN_PROD;
    }
  }

  public init = async (): Promise<void> => {
    const carrierData = await CarrierSchema.findOne({ _id: this.carrierRef });
    if (carrierData) {
      this.carrier = carrierData as ICarrier;
      this.credentials.bankerId = carrierData.clientSecret;
      this.credentials.userId = carrierData.clientId;
      this.credentials.plantId = carrierData.accountNum!;
      this.credentials.plantKey = carrierData.accessKey!;
    } else {
      logger.error(
        `Carrier ${CARRIERS.RUI_YUN} not found for id ${this.carrierRef}`
      );
      throw new Error(`API not supported`);
    }
  };

  public auth = async (): Promise<void> => {
    // Intended to leave blank
  };

  public verifyPrice = async (
    shipmentData: IShipping,
    weight: number,
    weightType: string,
    zone: string
  ): Promise<{ rates: Rate[]; errors: string[] } | string> => {
    logger.info('Start to verify price Rui Yun');
    logger.info('Fetching rates from thirdparty Rui Yun price tables');
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
      const priceTable = validateThirdpartyPriceWithWeight(
        priceTableList,
        weight,
        weightType
      );
      if (!priceTable) {
        return '货物重量超出渠道范围';
      }
      logger.info(
        `Using price table ${priceTable.name}, ${priceTable.service.key}-${priceTable.service.id}-${priceTable.service.name}`
      );
      // Calculate rates based on price table
      const result = computeThirdpartyRateWithWeight(
        shipmentData,
        priceTable,
        weight,
        getWeightUnit(weightType),
        zone
      );
      return result;
    } catch (error) {
      logger.error(error);
      return (error as Error).message;
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
    // Return test response
    if (this.isTest) {
      return {
        turnChanddelId: 'ups',
        turnServiceType: 'M4',
        labels: [],
        labelUrlList: [
          {
            labelUrl:
              'https://ruiy-public.oss-cn-hangzhou.aliyuncs.com/ruiy-public/202407/public/clabel/L2/AA06/92612903029788543475702827.pdf',
            type: 'pdf'
          }
        ],
        trackingNum: '92612903029788543475702810',
        invoiceUrl: undefined,
        forms: undefined,
        shippingRate: [],
        rOrderId: shipmentData.orderId
      };
    }

    const labelReqBody = buildRuiYunLabelReqBody(
      shipmentData,
      this.credentials,
      rate
    );
    try {
      logger.info('Calling Rui Yun [Label] endpoint');
      logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
      const response = await callRuiYunLabelEndpoint(this.apiUrl, labelReqBody);
      return response;
    } catch (error) {
      logger.error(error);
      throw new Error(error as string);
    }
  };
}

export default RuiYunAPI;
