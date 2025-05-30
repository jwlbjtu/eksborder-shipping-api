import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import { ICarrier, IShipping } from '../../../types/record.types';
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
import { addressValidation } from './rest/address.helper';
import { IAddress } from '../../../types/shipping.types';
import { ApiFinalResult } from '../../../types/carriers/api';

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
      if ((error as any).response) {
        console.log((error as any).response.data.response);
        logger.error(
          util.inspect((error as any).response.data.response, true, null)
        );
        return `${CARRIERS.FEDEX} ERROR: ${
          (error as any).response.data.response.errors[0].message
        }`;
      } else {
        console.log(error);
        logger.error(util.inspect((error as any).message, true, null));
        return `${CARRIERS.FEDEX} ERROR: ${(error as any).message}`;
      }
    }
  };

  public label = async (
    shipmentData: IShipping,
    rate: Rate
  ): Promise<ApiFinalResult> => {
    const packageCount = shipmentData.packageList.length;
    const masterLabelReqBody = buildFedexLabelReqBody(
      this.credential,
      shipmentData,
      rate,
      false,
      '',
      packageCount,
      shipmentData.packageList[0],
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
      if (shipmentData.packageList.length > 1) {
        let labels = response.labels;
        let forms = response.forms;
        let shippingCharges = response.shippingRate;
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
          shippingCharges = shippingCharges.concat(ele.shippingRate);
        });
        return {
          labels,
          forms,
          shippingRate: shippingCharges,
          labelUrlList: [],
          invoiceUrl: '',
          trackingNum: labels[0].tracking,
          rOrderId: shipmentData.orderId,
          turnChanddelId: CARRIERS.FEDEX,
          turnServiceType: shipmentData.service!.key
        };
      }

      return {
        labels: response.labels,
        forms: response.forms,
        shippingRate: response.shippingRate,
        labelUrlList: [],
        invoiceUrl: '',
        trackingNum: response.labels[0].tracking,
        rOrderId: shipmentData.orderId,
        turnChanddelId: CARRIERS.FEDEX,
        turnServiceType: shipmentData.service!.key
      };
    } catch (error) {
      if ((error as any).response) {
        console.log(error);
        logger.error(
          util.inspect((error as any).response.data.response, true, null)
        );
        throw new Error(
          (error as any).response.data.response.errors[0].message
        );
      } else {
        console.log(error);
        logger.error(util.inspect((error as any).message, true, null));
        throw new Error((error as any).message);
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

export default FedexAPI;
