import {
  IDHLeCommerceManifest,
  IDHLeCommerceManifestRequest,
  IDHLeCommerceManifestResponse,
  IDHLeCommerceManifestSummaryError
} from '../../../types/carriers/dhl.ecommerce';
import AxiosapiLib from '../../axiosapi.lib';
import { saveLog } from '../../../lib/log.handler';
import { IAccount } from '../../../types/user.types';
import { IDHLeCommerceError, IError } from '../../../types/error.types';
import {
  IManifest,
  IManifestRequest,
  IManifestSummary,
  IManifestSummaryError
} from '../../../types/shipping.types';

export const callDHLeComManifestAPI = async (
  api_url: string,
  manifestBody: IDHLeCommerceManifestRequest,
  headers: any,
  account: IAccount,
  data: IManifestRequest
): Promise<any> => {
  try {
    console.log('Call DHL eCommerce [RequestManifest] endpoint');
    const response = await AxiosapiLib.doCall(
      'post',
      api_url + '/shipping/v4/manifest',
      manifestBody,
      headers
    );
    await saveLog(
      'request manifest',
      manifestBody,
      response,
      account.id,
      account.userRef.id,
      false
    );

    if (
      response.hasOwnProperty('status') &&
      typeof response.status !== 'string' &&
      response.status > 203
    ) {
      console.log('Failed to call DHL eCommerce [RequestManifest] endpoint');
      const dhlError: IDHLeCommerceError = response.data;
      const labelError: IError = {
        status: response.status,
        title: dhlError.title,
        carrier: data.carrier,
        error: dhlError.invalidParams
      };
      return labelError;
    }

    const dhlManifestResponse: IDHLeCommerceManifestResponse = response;
    // @ts-expect-error: ignore
    const manifestResponse: IManifestResponse = {
      timestamp: dhlManifestResponse.timestamp,
      carrier: data.carrier,
      carrierAccount: data.carrierAccount,
      facility: data.facility,
      requestId: dhlManifestResponse.requestId
    };

    console.log('Return data from DHL eCommerce [RequestManifest] endpoint');
    return manifestResponse;
  } catch (error) {
    console.log(error);
    await saveLog(
      'request manifest',
      manifestBody,
      error,
      account.id,
      account.userRef.id,
      true
    );
    return error;
  }
};

export const callDHLeComDownloadManifestAPI = async (
  _url: string,
  headers: any,
  account: IAccount
): Promise<any> => {
  try {
    console.log('Call DHL eCommerce [DownloadManifest] endpoint');
    const response = await AxiosapiLib.doCall('get', _url, null, headers);
    await saveLog(
      'download manifest',
      { url: _url },
      response,
      account.id,
      account.userRef.id,
      false
    );

    if (
      response.hasOwnProperty('status') &&
      typeof response.status != 'string' &&
      response.status > 203
    ) {
      console.log('Failed to call DHL eCommerce [DownloadManifest] endpoint');
      const dhlError: IDHLeCommerceError = response.data;
      const manifestError: IError = {
        status: response.status,
        title: dhlError.title,
        carrier: account.carrierRef.carrierName,
        error: dhlError.invalidParams
      };
      return manifestError;
    }

    const dhlManifestResponse: IDHLeCommerceManifestResponse = response;

    let summary: IManifestSummary | undefined = undefined;
    if (dhlManifestResponse.manifestSummary) {
      summary = {
        total: dhlManifestResponse.manifestSummary.total,
        invalid: {
          total: dhlManifestResponse.manifestSummary.invalid.total,
          trackingIds: dhlManifestResponse.manifestSummary.invalid.dhlPackageIds?.map(
            (item: IDHLeCommerceManifestSummaryError) => {
              const result: IManifestSummaryError = {
                trackingId: item.dhlPackageId,
                errorCode: item.errorCode,
                errorDescription: item.errorDescription
              };
              return result;
            }
          )
        }
      };
    }
    // @ts-expect-error: ignore
    const manifestResponse: IManifestResponse = {
      timestamp: dhlManifestResponse.timestamp,
      carrier: account.carrierRef.carrierName,
      requestId: dhlManifestResponse.requestId,
      status: dhlManifestResponse.status,
      manifests: dhlManifestResponse.manifests?.map(
        (item: IDHLeCommerceManifest) => {
          const resutl: IManifest = {
            createdOn: item.createdOn,
            manifestId: item.manifestId,
            total: item.total,
            manifestData: item.manifestData,
            encodeType: item.encodeType,
            format: item.format
          };
          return resutl;
        }
      ),
      manifestSummary: summary
    };

    console.log('Return data from DHL eCommerce [DownloadManifest] endpoint');
    return manifestResponse;
  } catch (error) {
    console.log(error);
    await saveLog(
      'download manifest',
      { url: _url },
      error,
      account.id,
      account.userRef.id,
      true
    );
    return error;
  }
};
