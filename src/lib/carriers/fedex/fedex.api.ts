import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import {
  FormData,
  ICarrier,
  IShipping,
  LabelData
} from '../../../types/record.types';
import { IAccount } from '../../../types/user.types';
import { CARRIERS, FEDEX_HOSTS } from '../../constants';
import CarrierSchema from '../../../models/carrier.model';
import { logger } from '../../logger';
import util from 'util';
import {
  buildFedexProductReqBody,
  callFedexProductsEndpoint
} from './products.helper';
import { buildFedexLabelReqBody, callFedExLanelEndpoint } from './label.helper';
import { FedexCredential } from '../../../types/carriers/fedex';

class FedexAPI implements ICarrierAPI {
  private isTest: boolean;
  private clientCarrier: IAccount;
  private carrierRef: string;
  private carrier: ICarrier | undefined;
  private credential: FedexCredential = {
    key: '',
    password: '',
    accountNumber: '',
    meterNumber: '',
    hubId: ''
  };
  private apiUrl = '';

  constructor(isTest: boolean, clientCarrier: IAccount) {
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    if (isTest) {
      this.apiUrl = process.env.FEDEX_TEST || FEDEX_HOSTS.FEDEX_TEST;
    } else {
      this.apiUrl = process.env.FEDEX_PROD || FEDEX_HOSTS.FEDEX_PROD;
    }
  }

  public init = async (): Promise<void> => {
    const carrierData = await CarrierSchema.findOne({
      _id: this.carrierRef
    });
    if (carrierData) {
      this.carrier = carrierData as ICarrier;
      if (this.isTest) {
        this.credential.key = carrierData.testAccessKey!;
        this.credential.password = carrierData.testClientSecret!;
        this.credential.accountNumber = carrierData.testAccountNum!;
        this.credential.meterNumber = carrierData.testClientId!;
        this.credential.hubId = carrierData.testHubId!;
      } else {
        this.credential.key = carrierData.accessKey!;
        this.credential.password = carrierData.clientSecret!;
        this.credential.accountNumber = carrierData.accountNum!;
        this.credential.meterNumber = carrierData.clientId!;
        this.credential.hubId = carrierData.hubId!;
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
      const fedexRateReqBody = buildFedexProductReqBody(
        this.credential,
        shipmentData
      );
      logger.info('Calling FEDEX [Product Finder] endpoint');
      logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
      const response = await callFedexProductsEndpoint(
        this.apiUrl,
        fedexRateReqBody,
        shipmentData,
        this.isTest,
        this.clientCarrier
      );
      return response;
    } catch (error) {
      console.log(error);
      if (error.response) {
        console.log(error.response.data.response);
        logger.error(util.inspect(error.response.data.response, true, null));
        return `${CARRIERS.FEDEX} ERROR: ${error.response.data.response.errors[0].message}`;
      } else {
        console.log(error);
        logger.error(util.inspect(error.message, true, null));
        return `${CARRIERS.FEDEX} ERROR: ${error.message}`;
      }
    }
  };

  public label = async (
    shipmentData: IShipping,
    rate: Rate
  ): Promise<{ labels: LabelData[]; forms: FormData[] | undefined }> => {
    const packageCount = shipmentData.morePackages
      ? shipmentData.morePackages.length + 1
      : 1;
    const masterLabelReqBody = buildFedexLabelReqBody(
      this.credential,
      shipmentData,
      rate,
      false,
      '',
      packageCount,
      shipmentData.packageInfo!,
      1
    );
    logger.info(util.inspect(masterLabelReqBody, true, null));
    logger.info('Calling FEDEX [Label] endpoint -- Master');
    logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
    try {
      const response = await callFedExLanelEndpoint(
        this.apiUrl,
        masterLabelReqBody,
        this.isTest
      );

      if (shipmentData.morePackages && shipmentData.morePackages.length > 0) {
        let labels = response.labels;
        let forms = response.forms;
        const tmpList = [];
        for (let i = 0; i < shipmentData.morePackages.length; i += 1) {
          const pack = shipmentData.morePackages[i];
          const body = buildFedexLabelReqBody(
            this.credential,
            shipmentData,
            rate,
            true,
            response.labels[0].tracking,
            packageCount,
            pack,
            i + 2
          );
          logger.info(util.inspect(body, true, null));
          tmpList.push(callFedExLanelEndpoint(this.apiUrl, body, this.isTest));
        }

        const results = await Promise.all(tmpList);
        results.forEach((ele) => {
          labels = labels.concat(ele.labels);
          if (ele.forms) {
            if (!forms) forms = [];
            forms = forms.concat(ele.forms);
          }
        });

        return { labels, forms };
      }

      return response;
    } catch (error) {
      if (error.response) {
        console.log(error);
        logger.error(util.inspect(error.response.data.response, true, null));
        throw new Error(error.response.data.response.errors[0].message);
      } else {
        console.log(error);
        logger.error(util.inspect(error.message, true, null));
        throw new Error(error.message);
      }
    }
  };
}

export default FedexAPI;
