import axios from 'axios';
import {
  IDHLeCommerceTrackingResponse,
  TrackingInfo
} from '../../../types/carriers/dhl_ecommerce';

export const callDHLeCommerceTrackingEndpoint = async (
  tracking: string,
  apiUrl: string,
  headers: Record<string, string>
): Promise<TrackingInfo[]> => {
  const response = await axios.get(
    `${apiUrl}/tracking/v4/package?dhlPackageId=${tracking}`,
    { headers: headers }
  );

  const dhlTrackings: IDHLeCommerceTrackingResponse = response.data;

  let result: TrackingInfo[] = [];
  if (dhlTrackings.packages.length > 0) {
    result = dhlTrackings.packages[0].events.map((ele) => {
      const item: TrackingInfo = {
        timestamp: `${ele.date} ${ele.time} ${ele.timeZone}`,
        location: ele.location ? `${ele.location} ${ele.postalCode}` : '',
        event: ele.primaryEventDescription
      };
      return item;
    });
  }

  return result;
};
