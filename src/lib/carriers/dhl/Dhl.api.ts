import ICarrierAPI from '../ICarrierAPI.interface';
import AxiosapiLib from '../../axiosapi.lib';
import qs from 'qs';
import {
  IManifestRequest,
  IProductRequest,
  ILabelRequest
} from '../../../types/shipping.types';
import {
  IDHLeCommerceProductRequest,
  IDHLeCommerceLabelRequest,
  IDHLeCommerceManifestRequest
} from '../../../types/carriers/dhl.ecommerce';
import { IAccount, IUser } from '../../../types/user.types';
import { IFacility } from '../../../types/record.types';
import { callDHLeComProductsAPI, buildDHLProductReqBody } from './products';
import {
  buildDHLLabelReqBody,
  callDHLeComGetLabelAPI,
  callDHLeComLabelAPI
} from './label';
import {
  callDHLeComDownloadManifestAPI,
  callDHLeComManifestAPI
} from './manifest';

class DhlApi implements ICarrierAPI {
  private _props: { account: IAccount; user: IUser };
  private _credential: {
    client_id: string;
    client_secret: string;
  };
  private _facilities: IFacility[];
  private api_url = '';
  private accesstoken = '';

  // Initialize all props
  constructor(props: { account: IAccount; user: IUser }) {
    this._props = props;

    if (process.env.NODE_ENV === 'production') {
      // @ts-expect-error: ignore
      this.api_url = process.env.DHL_ECOMMERCE_PROD;
    } else {
      // @ts-expect-error: ignore
      this.api_url = process.env.DHL_ECOMMERCE_TEST;
    }

    this._credential = {
      client_id: this._props.account.carrierRef.clientId,
      client_secret: this._props.account.carrierRef.clientSecret
    };

    this._facilities = this._props.account.carrierRef.facilities;
  }

  private findFacility = (name: string | undefined) => {
    const facility = this._facilities.find(
      (value: IFacility) => value.facility === name
    );
    return facility;
  };

  /**
   * auth user
   */
  public auth = async () => {
    const data = qs.stringify({
      grant_type: 'client_credentials'
    });
    const headers = await this.getHeaders(true);

    try {
      const response = await await AxiosapiLib.doCall(
        'post',
        this.api_url + '/auth/v4/accesstoken',
        data,
        headers
      );
      this.accesstoken = response.access_token;
      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  /**
   * Find product rate of DHL eCommerce
   * @param data
   */
  public products: any = async (data: IProductRequest) => {
    const facilityObj = this.findFacility(data.facility);
    const prodReqBody: IDHLeCommerceProductRequest = buildDHLProductReqBody(
      data,
      facilityObj,
      this._props.account
    );
    const headers = await this.getHeaders(false);

    console.log('Calling DHL eCommerce [Product Finder] endpoint');
    const response = await callDHLeComProductsAPI(
      this.api_url,
      prodReqBody,
      headers,
      this._props,
      data
    );
    return response;
  };

  /**
   * Create DHL eCommerce Shipping Label
   * @param data
   * @param format
   */
  public label: any = async (
    data: ILabelRequest,
    format: 'ZPL' | 'PNG' = 'PNG'
  ) => {
    const facilityObj = this.findFacility(data.facility);
    const labelReqBody: IDHLeCommerceLabelRequest = buildDHLLabelReqBody(
      data,
      facilityObj,
      this._props.account
    );
    const headers = await this.getHeaders(false);
    const paramsStr: string = qs.stringify({
      format: format
    });

    console.log('Calling DHL eCommerce [Label] endpoint');
    const response = await callDHLeComLabelAPI(
      this.api_url,
      paramsStr,
      labelReqBody,
      headers,
      this._props,
      data
    );
    return response;
  };

  /**
   * Get Label Data from DHL eCOmmerce
   * @param packageId
   * @param dhlPackageId
   */
  public getLabel: any = async (shippingId: string, carrier: string) => {
    // @ts-expect-error: ignore
    const pickup = this._props.account.pickupRef.pickupAccount;
    const paramsStr: string = qs.stringify({
      dhlPackageId: shippingId
    });
    const _url: string =
      this.api_url + '/shipping/v4/label/' + pickup + '?' + paramsStr;
    const headers = await this.getHeaders(false);

    const response = await callDHLeComGetLabelAPI(
      _url,
      headers,
      this._props.account,
      shippingId
    );
    return response;
  };

  /**
   * Create DHL eCommerce Manifest
   * @param data
   */
  public manifest: any = async (data: IManifestRequest) => {
    const facilityObj = this.findFacility(data.facility);
    const manifestBody: IDHLeCommerceManifestRequest = {
      pickup: facilityObj?.pickup || '',
      manifests: [
        {
          dhlPackageIds: data.manifests[0].trackingIds
        }
      ]
    };
    const headers = await this.getHeaders(false);

    const response = await callDHLeComManifestAPI(
      this.api_url,
      manifestBody,
      headers,
      this._props.account,
      data
    );
    return response;
  };

  /**
   * Get Manifest from DHl
   * @param requestId
   */
  public getManifest: any = async (requestId: string) => {
    const pickup = this._props.account.carrierRef.facilities[0].pickup;
    const _url: string =
      this.api_url + '/shipping/v4/manifest/' + `${pickup}/${requestId}`;
    const headers = await this.getHeaders(false);

    const response = await callDHLeComDownloadManifestAPI(
      _url,
      headers,
      this._props.account
    );
    return response;
  };

  private getHeaders: any = async (isAuth = false) => {
    let headers = {};

    if (isAuth) {
      const token = Buffer.from(
        this._credential.client_id + ':' + this._credential.client_secret,
        'utf8'
      ).toString('base64');
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + token
      };
    } else {
      headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.accesstoken
      };
    }

    return headers;
  };
}

export default DhlApi;
