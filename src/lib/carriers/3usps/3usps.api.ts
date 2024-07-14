import { ICarrierAPI, Rate } from '../../../types/carriers/carrier';
import { USPS3_TOKEN_REQUEST } from '../../../types/carriers/usps3';
import { ICarrier, IShipping } from '../../../types/record.types';
import { IAccount } from '../../../types/user.types';
import { CARRIERS, Currency, USPS3_HOSTS } from '../../constants';
import { logger } from '../../logger';
import CarrierSchema from '../../../models/carrier.model';
import { buildUsps3PriceRequest, usps3PriceHandler } from './3usps.price';
import { getUsps3Toekn } from './3usps.token';
import { ApiFinalResult } from '../../../types/carriers/api';
import { usps3ParcelHandler } from './3usps.parcel';
import { buildUsps3ParcelRequest, retrieveUsps3Lable } from './3usps.label';

class USPS3API implements ICarrierAPI {
  private isTest: boolean;
  private clientCarrier: IAccount;
  private carrierRef: string;
  private carrier: ICarrier | undefined;
  private credentials: USPS3_TOKEN_REQUEST = {
    username: '',
    password: ''
  };
  private apiUrl = '';

  constructor(isTest: boolean, clientCarrier: IAccount) {
    this.isTest = isTest;
    this.clientCarrier = clientCarrier;
    this.carrierRef = clientCarrier.carrierRef;
    this.apiUrl = process.env.USPS3_PROD || USPS3_HOSTS.USPS3_PROD;
  }

  public init = async (): Promise<void> => {
    const carrierData = await CarrierSchema.findOne({ _id: this.carrierRef });
    if (carrierData) {
      this.carrier = carrierData as ICarrier;
      this.credentials.username = carrierData.clientId;
      this.credentials.password = carrierData.clientSecret;
    } else {
      logger.error(
        `Carrier with ref ${CARRIERS.USPS3} not found ifor id ${this.carrierRef}`
      );
      throw new Error('API not supported');
    }
  };

  public auth = async (): Promise<void> => {
    // Intended to leave blank
  };

  public products = async (
    shipmentData: IShipping,
    isInternational: boolean
  ): Promise<{ rates: Rate[]; errors: string[] } | string> => {
    logger.info('Getting USPS3 rates');
    try {
      const token = await getUsps3Toekn(this.credentials, this.apiUrl);
      const reqBody = buildUsps3PriceRequest(shipmentData);
      const response = await usps3PriceHandler(reqBody, token, this.apiUrl);
      if (response.isSuccess) {
        logger.info('Creating rate from USPS3 pricv');
        const result = response.result;
        const rate: Rate = {
          carrier: shipmentData.carrier!,
          serviceId: shipmentData.service!.id!,
          service: shipmentData.service!.name,
          account: shipmentData.carrierAccount,
          rate: parseFloat(result.totalAmt.split(' ')[0]),
          currency: Currency.USD,
          isTest: this.isTest,
          clientCarrierId: this.clientCarrier._id.toString()
        };
        logger.info('Return rate');
        return { rates: [rate], errors: [] };
      } else {
        return response.message;
      }
    } catch (error) {
      logger.error(error);
      return (error as Error).message;
    }
  };

  public label = async (
    shipment: IShipping,
    rate: Rate
  ): Promise<ApiFinalResult> => {
    // Return test response
    if (this.isTest) {
      return {
        turnChanddelId: 'USPS',
        turnServiceType: 'GA',
        labels: [],
        labelUrlList: [
          {
            labelUrl:
              'https://label.apparcel.com/Parcels/15220887/Labels/92001903435370192945881966.233c?token=YXBwSWQ9bGFiZWwtMDAxJm5vbmNlPXVpZDoyMDg2NDt0ZW5hbnQ6MjA4NjQJLQkyMDg2MwktCTIwODYyCS0JRWtzYm9yZGVyIGluYwleCTEwMSZ0aW1lU3RhbXA9MTcyMDg2NzcwMg.SGJjOTlTYUVNOXhYMWtUUEEvN0JuMjd3eGFNR0llb09WOFNCd0dFL0h1VT0',
            type: 'URL'
          }
        ],
        trackingNum: '92001903435370192945881966',
        invoiceUrl: undefined,
        forms: undefined,
        shippingRate: [],
        rOrderId: shipment.orderId
      };
    }

    try {
      logger.info('Getting USPS3 label');
      const token = await getUsps3Toekn(this.credentials, this.apiUrl);
      const reqBody = buildUsps3ParcelRequest(shipment);
      const response = await usps3ParcelHandler(reqBody, this.apiUrl, token);
      if (response.isSuccess) {
        const result = response.result;
        const labelUrl = result.labels;
        const labelData = await retrieveUsps3Lable(labelUrl, token);
        if (labelData.isSuccess) {
          const labelList = labelData.result;
          const resBody: ApiFinalResult = {
            labelUrlList: labelList.map((label) => {
              return { labelUrl: label.labelUrl, type: 'URL' };
            }),
            labels: [],
            rOrderId: shipment.orderId,
            trackingNum: labelList[0].trackingNbr,
            turnChanddelId: shipment.service!.key,
            turnServiceType: shipment.service!.name,
            shippingRate: [],
            invoiceUrl: undefined,
            forms: undefined
          };
          return resBody;
        } else {
          throw new Error(labelData.message);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      logger.error(error);
      throw new Error((error as Error).message);
    }
  };
}

export default USPS3API;
