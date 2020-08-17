import ICarrierAPI from "../ICarrierAPI.interface";
import AxiosapiLib from "../../axiosapi.lib";
import qs from "qs";
import conf from "./config";
import Shipping, {IShipping} from "../../../models/shipping.model";
import {IAccount} from "../../../models/account.model";
import LRes from "../../lresponse.lib";


// let cf = new CarrierFactory('dhl');
// // @ts-ignore
// let cf_a = await cf.auth();
class DhlApi implements ICarrierAPI {
    private _props: object = {};
    private _credential: object | any = {
        client_id: conf.client_id,
        client_secret: conf.client_secret
    };
    private api_url: string = 'https://api-sandbox.dhlecs.com';
    private accesstoken: string = '';

    /**
     * @param props
     */
    constructor(props?: object) {
        if (typeof props !== 'undefined' && typeof props == 'object') {
            this._props = props;
        }
    }

    /**
     * auth user
     */
    public auth: any = async () => {
        const data = qs.stringify({
            'grant_type': 'client_credentials'
        });
        const headers = await this.getHeaders(true);

        return await AxiosapiLib.doCall('post', this.api_url + '/auth/v4/accesstoken', data, headers)
            .then((response: Response | any) => {
                this.accesstoken = response.access_token;
                return response;
            })
            .catch((err: Error) => {
                console.log(err);
                return err;
            });
    };

    /**
     * products product
     * @param data
     */
    public products: any = async (data: object = {}) => {
        // "returnAddress": {
        //         "name": "Dave Bloggs",
        //         "companyName": "Joe Inc.",
        //         "address1": "4552 OLD DIXIE HWY",
        //         "address2": "Near Pixar road",
        //         "city": "Norcross",
        //         "state": "GA",
        //         "country": "US",
        //         "postalCode": "30092",
        //         "email": "2@y.com",
        //         "phone": "44423440348"
        //     },
        //"rate": {
        //         "calculate": true,
        //         "currency": "USD",
        //         "rateDate": "{{dateStamp}}",
        //     },
        //     "estimatedDeliveryDate": {
        //         "calculate": true,
        //         "expectedShipDate": "{{dateStamp}}",
        //     }

        const reformatBody: object = data;

        // @ts-ignore
        reformatBody.pickup = this._props.account.pickupRef.pickupAccount;
        // @ts-ignore
        reformatBody.distributionCenter = this._props.account.facilityRef.facilityNumber;
        // @ts-ignore
        reformatBody.returnAddress = this._props.account.carrierRef.returnAddress;

        const headers = await this.getHeaders(false);

        return await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/products', reformatBody, headers)
            .then(async (response: Response | any) => {
                await this.saveLog('products', reformatBody, response);
                return response;
            })
            .catch(async (err: Error) => {
                console.log(err);
                await this.saveLog('products', reformatBody, err, true);
                return err;
            });
    };

    public label: any = async (data: object = {}, format: 'ZPL' | 'PNG' = 'PNG') => {
        // "returnAddress": {
        //         "name": "Dave Bloggs",
        //         "companyName": "Joe Inc.",
        //         "address1": "4552 OLD DIXIE HWY",
        //         "address2": "Near Pixar road",
        //         "city": "Baltimore",
        //         "state": "MD",
        //         "country": "US",
        //         "postalCode": "30024",
        //         "email": "2@y.com",
        //         "phone": "44423440348"
        //     },

        // "billingReference1": "test bill ref 1",  - comp name - from used data
        // "packageId": "{{packageId}}", - auto gen uniq

        const reformatBody: object = data;

        // @ts-ignore
        reformatBody.pickup = this._props.account.pickupRef.pickupAccount;
        // @ts-ignore
        reformatBody.distributionCenter = this._props.account.facilityRef.facilityNumber;
        // @ts-ignore
        reformatBody.returnAddress = this._props.account.carrierRef.returnAddress;
        // @ts-ignore
        reformatBody.packageDetail.billingReference1 = this._props.account.userRef.companyName;
        // @ts-ignore
        reformatBody.packageDetail.packageId = "EK-"+Date.now();

        const headers = await this.getHeaders(false);

        const paramsStr: string = qs.stringify({
            'format': format
        });

        return await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/label?'+paramsStr, reformatBody, headers)
            .then(async (response: Response | any) => {
                await this.saveLog('label', reformatBody, response);
                if (response.hasOwnProperty('labels')) {
                    // @ts-ignore
                    response.carrier = this._props.account.carrierRef.accountName;

                    delete response.labels[0].packageId;
                    delete response.labels[0].dhlPackageId;
                    delete response.labels[0].link;
                    delete response.labels[0].labelDetail;
                }
                if (response.hasOwnProperty('status')) {
                    let err = {
                        status: response.status,
                        messages: response.data.title
                    };
                    return err;
                }
                return response;
            })
            .catch(async (err: Error) => {
                console.log(err);
                await this.saveLog('label', reformatBody, err, true);
                return err;
            });
    };

    public getLabel: any = async (packageId: string, dhlPackageId: string) => {
        const headers = await this.getHeaders(false);

        const paramsStr: string = qs.stringify({
            'dhlPackageId': dhlPackageId
        });
        const _url :string = this.api_url + '/shipping/v4/label/'+packageId+'?'+paramsStr;

        return await AxiosapiLib.doCall('get', _url, null, headers)
            .then(async (response: Response | any) => {
                await this.saveLog('getLabel', {url: _url}, response);
                if (response.hasOwnProperty('labels')) {
                    // @ts-ignore
                    response.carrier = this._props.account.carrierRef.accountName;

                    delete response.labels[0].packageId;
                    delete response.labels[0].dhlPackageId;
                    delete response.labels[0].link;
                    delete response.labels[0].labelDetail;
                }
                if (response.hasOwnProperty('status')) {
                    let err = {
                        status: response.status,
                        messages: response.data.title
                    };
                    return err;
                }
                return response;
            })
            .catch(async (err: Error) => {
                console.log(err);
                await this.saveLog('label', {url: _url}, err, true);
                return err;
            });

    };

    private getHeaders: any = async (isAuth: boolean = false) => {
        let headers = {};

        if (isAuth) {
            const token = Buffer.from(this._credential.client_id + ':' + this._credential.client_secret, 'utf8').toString('base64');
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + token
            };
        } else {
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.accesstoken
            }
        }

        return headers;
    };

    private saveLog: any = async (call: string, req: object, res: object,isErr: boolean = false,) => {
        const shippingData: object = {
            request: req,
            response: res,
            callType: call,
            isError: isErr,
            // @ts-ignore
            accountRef: this._props.account.id,
            // @ts-ignore
            userRef: this._props.account.userRef.id
        };

        if (isErr == true || res.hasOwnProperty('status')) {
            // @ts-ignore
            shippingData.response = {
                // @ts-ignore
                status: res.status,
                // @ts-ignore
                statusText: res.statusText,
                // @ts-ignore
                data: res.data,
                // @ts-ignore
                messages: res.data.title
            };
            // @ts-ignore
            shippingData.isError = true;
        }

        const shipping: IShipping = new Shipping(shippingData);
        return await shipping.save()
            .then((result) => {
               return result;
            }).catch((err: Error) => {
                return err;
            });
        return true;
    }
}

export default DhlApi;
