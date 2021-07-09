import axios from 'axios';
import { Types } from 'mongoose';
import {
  IDHLeCommerceManifestRequest,
  IDHLeCommerceManifestResponse,
  IManifest,
  ManifestData,
  ManifestObj
} from '../../../types/carriers/dhl_ecommerce';
import { IFacility, IShipping } from '../../../types/record.types';
import { IUser } from '../../../types/user.types';
import { CARRIERS } from '../../constants';

export const buildDhlEcommerceManifestReqBody = (
  pickup: string,
  shipments: IShipping[]
): IDHLeCommerceManifestRequest => {
  const trackings = shipments.map((ele) => ele.trackingId!);
  const result: IDHLeCommerceManifestRequest = {
    pickup,
    manifests: [{ dhlPackageIds: trackings }]
  };
  return result;
};

export const callDhlEcommerceCreateManifestEndpoint = async (
  clientCarrierRef: string,
  apiUrl: string,
  body: IDHLeCommerceManifestRequest,
  headers: Record<string, string>,
  user: IUser,
  facility: IFacility | undefined
): Promise<ManifestData> => {
  const response = await axios.post(apiUrl + '/shipping/v4/manifest', body, {
    headers: headers
  });

  const dhlManifestResponse: IDHLeCommerceManifestResponse = response.data;
  const manifestData: ManifestData = {
    carrier: CARRIERS.DHL_ECOMMERCE,
    timestamp: dhlManifestResponse.timestamp,
    facility: facility?.facility,
    pickup: facility?.pickup,
    requestId: dhlManifestResponse.requestId,
    link: dhlManifestResponse.link,
    manifests: [],
    manifestErrors: [],
    userRef: user._id,
    carrierRef: Types.ObjectId(clientCarrierRef)
  };
  return manifestData;
};

export const callDHLeCommerceGetManifestEndpoint = async (
  apiUrl: string,
  manifest: IManifest,
  headers: Record<string, string>
): Promise<IManifest> => {
  const response = await axios.get(
    `${apiUrl}/shipping/v4/manifest/${manifest.pickup}/${manifest.requestId!}`,
    { headers: headers }
  );

  const dhlManifestResponse: IDHLeCommerceManifestResponse = response.data;

  let errors: string[] = [];
  if (
    dhlManifestResponse.manifestSummary &&
    dhlManifestResponse.manifestSummary.invalid.dhlPackageIds
  ) {
    errors = dhlManifestResponse.manifestSummary.invalid.dhlPackageIds.map(
      (ele) => `${ele.errorDescription} [${ele.dhlPackageId}]`
    );
  }

  let manifestList: ManifestObj[] = [];
  if (dhlManifestResponse.manifests) {
    manifestList = dhlManifestResponse.manifests.map((ele) => {
      const obj: ManifestObj = {
        manifestId: ele.manifestId,
        manifestData: ele.manifestData,
        encodeType: ele.encodeType,
        format: ele.format
      };
      return obj;
    });
  }

  // @ts-expect-error: ignore
  const manifestData: IManifest = {
    carrier: manifest.carrier,
    carrierRef: manifest.carrierRef,
    timestamp: dhlManifestResponse.timestamp,
    requestId: manifest.requestId,
    link: manifest.link,
    status: dhlManifestResponse.status,
    userRef: manifest.userRef,
    manifests: manifestList,
    manifestErrors: errors
  };

  return manifestData;
};
