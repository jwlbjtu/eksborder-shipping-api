import axios from 'axios';
import util from 'util';
import qs from 'qs';
import { Types } from 'mongoose';
import {
  CARRIERS,
  Currency,
  DHL_ECOMMERCE_HOSTS,
  WeightUnit
} from '../../constants';
import {
  buildDhlEcommerceProductReqBody,
  callDhlEcommerceProductsEndpoint
} from './products.helpers';
import {
  buildDhlEcommerceLabelReqBody,
  callDhlEcommerceLabelEndpoint
} from './label.helpers';
import {
  buildDhlEcommerceManifestReqBody,
  callDhlEcommerceCreateManifestEndpoint,
  callDHLeCommerceGetManifestEndpoint
} from './manifest.helpers';
import { callDHLeCommerceTrackingEndpoint } from './tracking.helpers';
import { ICarrierAPI } from '../../../types/carriers/carrier';
import {
  FormData,
  ICarrier,
  IFacility,
  IShipping,
  LabelData,
  ShippingRate
} from '../../../types/record.types';
import { IAccount, IUser } from '../../../types/user.types';
import CarrierSchema from '../../../models/carrier.model';
import { logger } from '../../logger';
import { Rate } from '../../../types/carriers/carrier';
import {
  createBarcode,
  generateLabel,
  isShipmentInternational,
  shippingInfoFromBody,
  trackingNumberGenerator
} from '../carrier.helper';
import {
  ManifestData,
  IManifest,
  TrackingInfo
} from '../../../types/carriers/dhl_ecommerce';
import convertlib from 'convert-units';
import PriceTableSchema from '../../../models/priceTabel.model';

class DhlEcommerceAPI implements ICarrierAPI {
  public isTest: boolean;
  public clientCarrier: IAccount;
  public carrierRef: string;
  public carrier: ICarrier | undefined;
  public accessToken = '';
  public credential: {
    clientId: string;
    clientSecret: string;
  } = { clientId: '', clientSecret: '' };
  public apiUrl = '';
  public facilityName: string;
  public facility: IFacility = {
    facility: '',
    pickup: ''
  };
  public DHL_ECOM_ROUTES = {
    AUTH: '/auth/v4/accesstoken'
  };

  constructor(isTest: boolean, clientCarrier: IAccount, facilityName: string) {
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    this.facilityName = facilityName;
    if (isTest) {
      this.apiUrl =
        process.env.DHL_ECOMMERCE_TEST ||
        DHL_ECOMMERCE_HOSTS.DHL_ECOMMERCE_TEST;
    } else {
      this.apiUrl =
        process.env.DHL_ECOMMERCE_PROD ||
        DHL_ECOMMERCE_HOSTS.DHL_ECOMMERCE_PROD;
    }
  }

  public init = async (): Promise<void> => {
    console.log(this.carrierRef);
    const carrierData = await CarrierSchema.findOne({
      _id: Types.ObjectId(this.carrierRef)
    });
    if (carrierData) {
      this.carrier = carrierData as ICarrier;
      if (this.isTest) {
        this.credential.clientId = carrierData.testClientId!;
        this.credential.clientSecret = carrierData.testClientSecret!;
        this.facilityName = carrierData.testFacilities![0].facility;
        this.facility = carrierData.testFacilities![0];
      } else {
        this.credential.clientId = carrierData.clientId;
        this.credential.clientSecret = carrierData.clientSecret;
        const orderFacility = carrierData.facilities!.find(
          (ele) => ele.facility === this.facilityName
        );
        if (orderFacility) {
          this.facility = orderFacility;
        } else {
          throw new Error(`无效分拣中心${this.facilityName}`);
        }
      }

      try {
        await this.auth();
      } catch (error) {
        logger.error(util.inspect(error.response.data));
        logger.error(
          `Failed to authenticate to ${this.carrier.carrierName} ${
            this.isTest ? 'test' : ''
          }`
        );
        throw new Error(
          `${this.carrier.carrierName} ERROR: ${error.response.data.title}`
        );
      }
    } else {
      logger.error(
        `Carrier ${CARRIERS.DHL_ECOMMERCE} not found for id ${this.carrierRef}`
      );
      throw new Error(`${CARRIERS.DHL_ECOMMERCE} not supported`);
    }
  };

  public auth = async (): Promise<void> => {
    const data = qs.stringify({
      grant_type: 'client_credentials'
    });
    const headers = this.generateHeader(true);
    const response = await axios.post(
      this.apiUrl + this.DHL_ECOM_ROUTES.AUTH,
      data,
      { headers: headers }
    );
    this.accessToken = response.data.access_token;
    logger.info(
      `Authenticate to ${this.carrier?.carrierName} ${
        this.isTest ? 'test' : ''
      } successfully.`
    );
  };

  public products = async (
    shipmentData: IShipping,
    isInternational: boolean
  ): Promise<{ rates: Rate[]; errors: string[] } | string> => {
    // Do not support multiple packages in an order
    if (shipmentData.morePackages && shipmentData.morePackages.length > 0) {
      return { rates: [], errors: [] };
    }

    if (shipmentData.service?.key === 'FLAT') {
      const packageInfo = shipmentData.packageInfo!;
      const weightOz = convertlib(packageInfo.weight.value)
        .from(packageInfo.weight.unitOfMeasure)
        .to(WeightUnit.OZ);
      if (weightOz > 16) {
        logger.error('Shipment weight exceeds 16 oz for DHL eCommerce FLAT');
        return 'Shipment weight exceeds 16 oz for DHL eCommerce FLAT';
      }
      // Get FLAT Price Table
      const flatProceTable = await PriceTableSchema.findOne({
        'service.key': 'FLAT',
        carrierRef: this.carrier!._id
      });
      if (!flatProceTable || !flatProceTable.price) {
        logger.error('Flat price table not found');
        return 'Flat price table not found';
      }
      const priceData = flatProceTable.price.data.find(
        (data) => data.weight === Math.ceil(weightOz).toString()
      );

      if (!priceData || !flatProceTable.zones) {
        logger.error('Flat price data not found');
        return 'Flat price data not found';
      }
      const flatPrice = priceData[flatProceTable.zones![0]];
      // Compute FLAT Rate
      const rate: Rate = {
        carrier: CARRIERS.DHL_ECOMMERCE,
        serviceId: shipmentData.service.key,
        service: shipmentData.service.name,
        rate: parseFloat(flatPrice),
        currency: Currency.USD,
        isTest: this.isTest,
        clientCarrierId: this.clientCarrier.id.toString()
      };
      return { rates: [rate], errors: [] };
    } else {
      const prodReqBody = buildDhlEcommerceProductReqBody(
        shipmentData,
        this.facility,
        isInternational
      );
      const headers = this.generateHeader(false);
      logger.info('Calling DHL eCommerce [Product Finder] endpoint');
      logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
      try {
        const response = await callDhlEcommerceProductsEndpoint(
          this.apiUrl,
          prodReqBody,
          headers,
          shipmentData,
          this.isTest,
          this.clientCarrier
        );
        return response;
      } catch (error) {
        console.log(error.response.data);
        logger.error(util.inspect(error.response.data, true));
        return `${CARRIERS.DHL_ECOMMERCE} ERROR: ${error.response.data.title}`;
      }
    }
  };

  public label = async (
    shipmentData: IShipping,
    rate: Rate
  ): Promise<{
    labels: LabelData[];
    forms: FormData[] | undefined;
    shippingRate: ShippingRate[];
  }> => {
    if (shipmentData.service?.key === 'FLAT') {
      // Generate tracking number
      const trackingNumber = trackingNumberGenerator();
      // Generate bardcode based on tracking number
      const barcode = await createBarcode(trackingNumber);
      // Create shipping info from shipment
      const shippingInfo = shippingInfoFromBody(shipmentData);
      // Generate label buffer
      const labelBuffer = await generateLabel(shippingInfo, barcode);
      // Encode to base64
      const labelData = labelBuffer.toString('base64');
      // Generate Flat response
      const result: LabelData = {
        carrier: CARRIERS.DHL_ECOMMERCE,
        createdOn: new Date(),
        data: labelData,
        encodeType: 'BASE64',
        format: 'PNG',
        isTest: rate.isTest,
        service: rate.service,
        tracking: trackingNumber
      };
      return {
        labels: [result],
        forms: undefined,
        shippingRate: [{ rate: 0, currency: 'USD' }]
      };
    } else {
      const isInternational = isShipmentInternational(shipmentData);
      const labelReqBody = buildDhlEcommerceLabelReqBody(
        shipmentData,
        this.facility,
        rate,
        isInternational
      );
      const headers = this.generateHeader(false);
      const paramStr = qs.stringify({ format: 'PNG' });
      logger.info('Calling DHL eCommerce [Label] endpoint');
      logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData.id}`);
      try {
        const response = await callDhlEcommerceLabelEndpoint(
          this.apiUrl,
          paramStr,
          labelReqBody,
          headers,
          shipmentData,
          this.isTest
        );
        return {
          labels: response,
          forms: undefined,
          shippingRate: [{ rate: 0, currency: 'USD' }]
        };
      } catch (error) {
        logger.error(util.inspect(error.response.data, true, null));
        throw new Error(error.response.data.title);
      }
    }
  };

  public createManifest = async (
    shipments: IShipping[],
    user: IUser
  ): Promise<ManifestData[]> => {
    // Get all facilities
    let facilities = this.carrier?.facilities;
    if (this.isTest) facilities = this.carrier?.testFacilities;
    if (facilities) {
      const data: Record<string, IShipping[]> = {};
      if (this.isTest) {
        data[facilities[0].pickup] = shipments;
      } else {
        for (let i = 0; i < facilities.length; i += 1) {
          const f = facilities[i];
          const pickup = f.pickup;
          const list: IShipping[] = [];
          for (let j = 0; j < shipments.length; j += 1) {
            const s = shipments[j];
            if (s.facility === f.facility) {
              list.push(s);
            }
          }
          if (list && list.length > 0) data[pickup] = list;
        }
      }

      const manifestRefBodys = Object.keys(data).map((key) =>
        buildDhlEcommerceManifestReqBody(key, data[key])
      );

      const manifestCalls = [];
      const headers = this.generateHeader(false);
      for (let i = 0; i < manifestRefBodys.length; i += 1) {
        const mBody = manifestRefBodys[i];
        logger.info('Calling DHL eCommerce [Create Manifest] endpoint');
        logger.info(`Pickup: ${mBody.pickup}`);
        logger.info(mBody.manifests[0].dhlPackageIds);
        manifestCalls.push(
          callDhlEcommerceCreateManifestEndpoint(
            this.clientCarrier._id,
            this.apiUrl,
            mBody,
            headers,
            user,
            facilities.find((ele) => ele.pickup === mBody.pickup)
          )
        );
      }
      try {
        const response = await Promise.all(manifestCalls);
        return response;
      } catch (error) {
        if (error.response) {
          logger.error(util.inspect(error.response.data, true, null));
          throw new Error(error.response.data.title);
        } else {
          logger.error(util.inspect(error, true, null));
          throw new Error(error.message);
        }
      }
    } else {
      logger.error('No facilities found');
      throw new Error('No facilities found');
    }
  };

  public getManifest = async (manifest: IManifest): Promise<IManifest> => {
    const headers = this.generateHeader(false);
    logger.info('Calling DHL eCommerce [Download Manifest] endpoint');
    logger.info(`Manifest request id : ${manifest.requestId}`);
    try {
      const response = await callDHLeCommerceGetManifestEndpoint(
        this.apiUrl,
        manifest,
        headers,
        this.isTest ? this.facility.pickup : manifest.pickup
      );
      return response;
    } catch (error) {
      if (error.response) {
        logger.error(util.inspect(error.response.data, true, null));
        throw new Error(error.response.data.title);
      } else {
        logger.error(util.inspect(error, true, null));
        throw new Error(error.message);
      }
    }
  };

  public getTrackingInfo = async (
    tracking: string
  ): Promise<TrackingInfo[]> => {
    const headers = this.generateHeader(false);
    logger.info('Calling DHL eCommerce [Track Single Package] endpoint');
    logger.info(`Tracking package: ${tracking}`);
    try {
      const response = await callDHLeCommerceTrackingEndpoint(
        tracking,
        this.apiUrl,
        headers
      );
      return response;
    } catch (error) {
      if (error.response) {
        logger.error(util.inspect(error.response.data, true, null));
        throw new Error(error.response.data.title);
      } else {
        logger.error(util.inspect(error, true, null));
        throw new Error(error.message);
      }
    }
  };

  public generateHeader = (isAuth = false): Record<string, string> => {
    let headers = {};

    if (isAuth) {
      const token = Buffer.from(
        `${this.credential.clientId}:${this.credential.clientSecret}`,
        'utf8'
      ).toString('base64');
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + token
      };
    } else {
      headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.accessToken
      };
    }
    return headers;
  };
}

export default DhlEcommerceAPI;
