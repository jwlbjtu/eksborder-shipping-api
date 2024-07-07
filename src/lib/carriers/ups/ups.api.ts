import { UPS_HOSTS, CARRIERS } from '../../constants';
import util from 'util';
import uniqid from 'uniqid';
import { callUpsProductsEndpoint } from './products.helpers';
import { buildUpsLabelReqBody, callUpsLabelEndpoint } from './label.helpers';
import {
  findSuitableTirdpartyAccounts,
  generateThirdpartyRates
} from '../thirdparty.helpers';
import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import { UPSShipper } from '../../../types/carriers/ups';
import {
  FormData,
  ICarrier,
  IShipping,
  LabelData,
  ShippingRate,
  ThirdPartySummary
} from '../../../types/record.types';
import { IAccount } from '../../../types/user.types';
import CarrierSchema from '../../../models/carrier.model';
import { logger } from '../../logger';
import { checkShipmentRegion } from '../../utils/helpers';
import { ApiFinalResult } from '../../../types/carriers/api';

class UpsAPI implements ICarrierAPI {
  private isTest: boolean;
  private clientCarrier: IAccount;
  private carrierRef: string;
  private carrier: ICarrier | undefined;
  private thirdpartyPrice = false;
  private thirdpartyList: ThirdPartySummary[] | undefined;
  private credential: {
    username: string;
    password: string;
    accessKey: string;
    accountNum: string;
    shipperInfo: UPSShipper | undefined;
  } = {
    username: '',
    password: '',
    accessKey: '',
    accountNum: '',
    shipperInfo: undefined
  };
  private apiUrl = '';

  constructor(isTest: boolean, clientCarrier: IAccount) {
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    if (isTest) {
      this.apiUrl = process.env.UPS_TEST || UPS_HOSTS.UPS_TEST;
    } else {
      this.apiUrl = process.env.UPS_PROD || UPS_HOSTS.UPS_PROD;
    }
  }

  public init = async (): Promise<void> => {
    const carrierData = await CarrierSchema.findOne({
      _id: this.carrierRef
    });
    if (carrierData) {
      this.carrier = carrierData as ICarrier;
      this.thirdpartyPrice = this.clientCarrier.thirdpartyPrice;
      this.credential.username = carrierData.clientId;
      this.credential.password = carrierData.clientSecret;
      this.credential.accessKey = carrierData.accessKey!;
      this.credential.accountNum = carrierData.accountNum!;
      const shipper = carrierData.returnAddress!;
      this.credential.shipperInfo = {
        Name: shipper.name,
        AttentionName: shipper.name,
        ShipperNumber: this.credential.accountNum,
        EMailAddress: shipper.email,
        Phone: { Number: shipper.phone! },
        Address: {
          AddressLine: shipper.street1,
          City: shipper.city,
          StateProvinceCode: shipper.state,
          CountryCode: shipper.country,
          PostalCode: shipper.postalCode
        }
      };
      if (this.thirdpartyPrice) this.thirdpartyList = carrierData.thirdparties;
    } else {
      logger.error(
        `Platform Carrier ${CARRIERS.UPS} not found for id ${this.carrierRef}`
      );
      throw new Error(`Platform Carrier ${CARRIERS.UPS} not supported`);
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
      if (this.thirdpartyPrice) {
        logger.info('Fetching rates from thirdparty price tables');
        const errors = [];
        // Calculate UPS Rate from Thirdparty Price Table
        if (this.thirdpartyList) {
          // Find price tables that fits
          const thirdpartyIds = findSuitableTirdpartyAccounts(
            this.thirdpartyList,
            shipmentData
          );
          const result = await generateThirdpartyRates(
            thirdpartyIds,
            shipmentData,
            checkShipmentRegion(shipmentData),
            this.isTest,
            this.clientCarrier
          );
          return result;
        } else {
          errors.push(`${CARRIERS.UPS} Error: No Price Table Available!`);
          logger.warn('No thirdparty price found! Return empty rate.');
        }
        return { rates: [], errors: [] };
      } else {
        // Call UPS API for Rates
        const headers = this.generateHeader();
        logger.info('Calling UPS [Product Finder] endpoint');
        logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
        const response = await callUpsProductsEndpoint(
          this.apiUrl,
          this.credential.shipperInfo!,
          headers,
          shipmentData,
          this.isTest,
          this.clientCarrier
        );
        return response;
      }
    } catch (error) {
      if ((error as any).response) {
        console.log((error as any).response.data.response);
        logger.error(
          util.inspect((error as any).response.data.response, true, null)
        );
        return `${CARRIERS.UPS} ERROR: ${
          (error as any).response.data.response.errors[0].message
        }`;
      } else {
        console.log(error);
        logger.error(util.inspect((error as any).message, true, null));
        return `${CARRIERS.UPS} ERROR: ${(error as any).message}`;
      }
    }
  };

  public label = async (
    shipmentData: IShipping,
    rate: Rate
  ): Promise<ApiFinalResult> => {
    const labelReqBody = await buildUpsLabelReqBody(
      shipmentData,
      this.credential.accountNum,
      this.credential.shipperInfo!,
      rate
    );
    const headers = this.generateHeader();
    logger.info('Calling UPS [Label] endpoint');
    logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
    try {
      const response = await callUpsLabelEndpoint(
        this.apiUrl,
        labelReqBody,
        headers,
        rate.serviceId,
        this.isTest
      );
      return { ...response, rOrderId: shipmentData.orderId };
    } catch (error) {
      if ((error as any).response) {
        console.log((error as any).response.data.response);
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

  private generateHeader = (): Record<string, string> => {
    return {
      Username: this.credential.username,
      Password: this.credential.password,
      AccessLicenseNumber: this.credential.accessKey,
      'Content-Type': 'application/json',
      transId: uniqid('PE-'),
      transactionSrc: 'ParcelsElite'
    };
  };
}

export default UpsAPI;
