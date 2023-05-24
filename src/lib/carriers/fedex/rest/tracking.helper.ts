import {
  FedexRestRecipient,
  FedexScanEvent,
  FedexTrackingLatestStatusDetail,
  FedexTrackingRequest,
  FedexTrackingResponse
} from '../../../../types/carriers/fedex.rest';
import { CARRIERS, getFedexHost } from '../../../constants';
import FedexAuthHelper from './auth.helper';
import { logger } from '../../../logger';
import axios from 'axios';
import util from 'util';
import {
  IScanEvent,
  ITrackingStatus,
  TrackingResponse
} from '../../../../types/carriers/carrier';
import { IAddress } from '../../../../types/shipping.types';

const trackingUrl = '/track/v1/trackingnumbers';
const API_KEY_TEST = 'l798d34f0bb3b04fcd9668568fdb306490';
const SECRET_KEY_TEST = 'f991c6816c7a452bb38bba678d1cf288';
const API_KEY_PROD = 'l7ff41a4f16d674b5ebf09e9a1f6dddd8a';
const SECRET_KEY_PROD = 'l7ff41a4f16d674b5ebf09e9a1f6dddd8a';

export const getFedExTrackingInfo = async (
  trackingNumber: string,
  isTest: boolean
): Promise<any> => {
  // Get auth token
  const apiKey = isTest ? API_KEY_TEST : API_KEY_PROD;
  const apiSecret = isTest ? SECRET_KEY_TEST : SECRET_KEY_PROD;
  const apiUrl = getFedexHost(isTest);
  const token = await FedexAuthHelper.getToken(
    apiUrl,
    apiKey,
    apiSecret,
    isTest
  );
  // Build request body
  const body: FedexTrackingRequest = {
    includeDetailedScans: true,
    trackingInfo: [
      {
        trackingNumberInfo: {
          trackingNumber: trackingNumber
        }
      }
    ]
  };
  logger.info('Fedex Tracking Request');
  logger.info(util.inspect(body, true, null));
  // Send request
  const baseUrl = getFedexHost(isTest);
  const url = `${baseUrl}${trackingUrl}`;
  try {
    const res = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token?.access_token}`
      }
    });
    logger.info('Fedex Tracking Response');
    logger.info(util.inspect(res.data, true, null));
    return convertToTrackingResponse(res.data);
  } catch (error) {
    console.log(error);
    console.log(error.response.data);
    logger.error(JSON.stringify(error.response.data));
    return false;
  }
};

const convertToTrackingResponse = (data: FedexTrackingResponse) => {
  const fedexCompleteTrackingResult = data.output.completeTrackResults[0];
  const fedexTrackingResult = fedexCompleteTrackingResult.trackResults[0];

  const result: TrackingResponse = {
    carrier: CARRIERS.FEDEX,
    trackingNumber: fedexCompleteTrackingResult.trackingNumber,
    shipper: fedexAddressToIAddress(fedexTrackingResult.shipperInformation),
    recipient: fedexAddressToIAddress(fedexTrackingResult.recipientInformation),
    lastestStatus: fedexStatusToITrackingStatus(
      fedexTrackingResult.latestStatusDetail
    ),
    scanEvents: buildScanEvents(fedexTrackingResult.scanEvents)
  };
  return result;
};

const fedexAddressToIAddress = (receipient: FedexRestRecipient): IAddress => {
  const address = receipient.address;
  return {
    street1: '',
    street2: '',
    city: address.city ? address.city : '',
    state: address.stateOrProvinceCode,
    zip: address.postalCode ? address.postalCode : '',
    country: address.countryCode
  };
};

const fedexStatusToITrackingStatus = (
  latestStatus: FedexTrackingLatestStatusDetail
): ITrackingStatus => {
  return {
    status: latestStatus.statusByLocation,
    description: latestStatus.description,
    location: {
      street1: '',
      street2: '',
      city: latestStatus.scanLocation.city,
      state: '',
      zip: '',
      country: latestStatus.scanLocation.countryCode
    },
    delayDetail: latestStatus.delayDetail.status
      ? latestStatus.delayDetail.status
      : ''
  };
};

const buildScanEvents = (scanEvents: FedexScanEvent[]): IScanEvent[] => {
  const events: IScanEvent[] = [];
  scanEvents.forEach((event) => {
    events.push({
      date: event.date,
      event: event.eventDescription,
      scanLocation: {
        street1: event.scanLocation.streetLines[0],
        street2: event.scanLocation.streetLines[1] || '',
        city: event.scanLocation.city || '',
        state: event.scanLocation.stateOrProvinceCode || '',
        zip: event.scanLocation.postalCode || '',
        country: event.scanLocation.countryCode
      },
      locationType: event.locationType,
      delayDetail: event.delayDetail?.type || ''
    });
  });
  return events;
};
