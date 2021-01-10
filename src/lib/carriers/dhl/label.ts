import {
  IDHLeCommerceLabel,
  IDHLeCommerceLabelRequest,
  IDHLeCommerceLabelResponse,
  IDHLeCommercePackageDetail
} from '../../../types/carriers/dhl.ecommerce';
import { IFacility } from '../../../types/record.types';
import {
  ILabel,
  ILabelRequest,
  ILabelResponse
} from '../../../types/shipping.types';
import { IAccount, IUser } from '../../../types/user.types';
import convertToDHLAddress from './common';
import uniqid from 'uniqid';
import AxiosapiLib from '../../axiosapi.lib';
import { saveLog } from '../../../lib/log.handler';
import { IDHLeCommerceError, IError } from '../../../types/error.types';

export const buildDHLLabelReqBody = (
  data: ILabelRequest,
  facilityObj: IFacility | undefined,
  account: IAccount
): IDHLeCommerceLabelRequest => {
  const dhlPackageDetail: IDHLeCommercePackageDetail = {
    packageId: data.packageDetail.packageId || uniqid('EK'),
    packageDescription: data.packageDetail.packageDescription,
    weight: data.packageDetail.weight,
    dimension: data.packageDetail.dimension,
    billingReference1: data.packageDetail.billingReference1,
    billingReference2: data.packageDetail.billingReference2
  };

  const labelReqBody: IDHLeCommerceLabelRequest = {
    // @ts-expect-error: ignore
    pickup: facilityObj?.pickup,
    // @ts-expect-error: ignore
    distributionCenter: facilityObj?.facility,
    orderedProductId: data.service,
    consigneeAddress: convertToDHLAddress(data.toAddress),
    returnAddress: convertToDHLAddress(account.carrierRef.returnAddress),
    packageDetail: dhlPackageDetail
  };
  return labelReqBody;
};

export const callDHLeComLabelAPI = async (
  api_url: string,
  paramsStr: string,
  labelReqBody: IDHLeCommerceLabelRequest,
  headers: any,
  props: { account: IAccount; user: IUser },
  data: ILabelRequest
): Promise<any> => {
  try {
    const response = await AxiosapiLib.doCall(
      'post',
      api_url + '/shipping/v4/label?' + paramsStr,
      labelReqBody,
      headers
    );
    await saveLog(
      'label',
      labelReqBody,
      response,
      props.account.id,
      props.account.userRef.id
    );

    if (response.hasOwnProperty('status') && response.status > 203) {
      console.log('Failed to call DHL eCommerce [Label] endpoint');
      const dhlError: IDHLeCommerceError = response.data;
      const labelError: IError = {
        status: response.status,
        title: dhlError.title,
        carrier: data.carrier,
        error: dhlError.invalidParams
      };
      return labelError;
    }

    const dhlLabelResponse: IDHLeCommerceLabelResponse = response;
    const labelResponse: ILabelResponse = {
      timestamp: dhlLabelResponse.timestamp,
      carrier: data.carrier,
      service: dhlLabelResponse.orderedProductId,
      facility: data.facility,
      carrierAccount: data.carrierAccount,
      labels: dhlLabelResponse.labels.map((item: IDHLeCommerceLabel) => {
        const result: ILabel = {
          createdOn: item.createdOn,
          trackingId: item.dhlPackageId,
          labelData: item.labelData,
          encodeType: item.encodeType,
          format: item.format
        };
        return result;
      }),
      shippingId: dhlLabelResponse.labels[0].dhlPackageId
    };
    console.log('Return data from DHL eCommerce [Label] endpoint');
    return labelResponse;
  } catch (error) {
    await saveLog(
      'label',
      labelReqBody,
      error,
      props.account.id,
      props.account.userRef.id,
      true
    );
    return error;
  }
};

export const callDHLeComGetLabelAPI = async (
  _url: string,
  headers: any,
  account: IAccount,
  shippingId: string
): Promise<any> => {
  try {
    console.log('Call DHL eCommerce [GetLabel] endpoint');
    const response = await AxiosapiLib.doCall('get', _url, null, headers);
    await saveLog(
      'get label',
      { url: _url },
      response,
      account.id,
      account.userRef.id
    );

    if (response.hasOwnProperty('status') && response.status > 203) {
      console.log('Failed to call DHL eCommerce [GetLabel] endpoint');
      const dhlError: IDHLeCommerceError = response.data;
      const labelError: IError = {
        status: response.status,
        title: dhlError.title,
        carrier: account.carrierRef.carrierName,
        error: dhlError.invalidParams
      };
      return labelError;
    }

    const dhlLabelResponse: IDHLeCommerceLabelResponse = response;
    const labelResponse: ILabelResponse = {
      timestamp: dhlLabelResponse.timestamp,
      carrier: account.carrierRef.carrierName,
      service: dhlLabelResponse.orderedProductId,
      facility: 'this should be the facility string',
      carrierAccount: 'this should be the carrierAccount passed in',
      labels: dhlLabelResponse.labels.map((item: IDHLeCommerceLabel) => {
        const result: ILabel = {
          createdOn: item.createdOn,
          trackingId: item.dhlPackageId,
          labelData: item.labelData,
          encodeType: item.encodeType,
          format: item.format
        };
        return result;
      }),
      shippingId: shippingId
    };
    console.log('Return data from DHL eCommerce [GetLabel] endpoint');
    return labelResponse;
  } catch (error) {
    console.log(error);
    await saveLog(
      'get label',
      { url: _url },
      error,
      account.id,
      account.userRef.id,
      true
    );
    return error;
  }
};
