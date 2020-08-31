import ICarrierAPI from "../ICarrierAPI.interface";
import AxiosapiLib from "../../axiosapi.lib";
import qs from "qs";
import Shipping, {IShipping} from "../../../models/shipping.model";
import {IAccount} from "../../../models/account.model";
import LRes from "../../lresponse.lib";
import Manifest, {IManifest} from "../../../models/manifest.model";


// let cf = new CarrierFactory('dhl');
// // @ts-ignore
// let cf_a = await cf.auth();
class DhlApi implements ICarrierAPI {
    private _props: object = {};
    private _credential: object | any = {
        client_id: '',
        client_secret: ''
    };
    private api_url: string = '';
    private accesstoken: string = '';

    /**
     * @param props
     */
    constructor(props?: object) {
        if (typeof props !== 'undefined' && typeof props == 'object') {
            this._props = props;
            // @ts-ignore
            this.api_url = this._props.account.carrierRef.api_url;
            // @ts-ignore
            this._credential.client_id = this._props.account.carrierRef.clientId;
            // @ts-ignore
            this._credential.client_secret = this._props.account.carrierRef.clientSecret;
        }
    }

    /**
     * auth user
     */
    private auth: any = async () => {
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
                // await this.saveLog('products', reformatBody, response);
                return response;
            })
            .catch(async (err: Error) => {
                console.log(err);
                // await this.saveLog('products', reformatBody, err, true);
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
                await this.saveLog('getLabel', {url: _url}, err, true);
                return err;
            });

    };

    public manifest: any = async (data: object = {}) => {
        const reformatBody: object = data;

        // @ts-ignore
        reformatBody.pickup = this._props.account.pickupRef.pickupAccount;

        if(!data.hasOwnProperty('manifests')) {
            // @ts-ignore
            reformatBody.manifests = [];
        }

        const headers = await this.getHeaders(false);

        return await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/manifest', reformatBody, headers)
            .then(async (response: Response | any) => {
                await this.saveLog('manifest', reformatBody, response, false, true);
                if (response.hasOwnProperty('requestId')) {
                    // @ts-ignore
                    response.carrier = this._props.account.carrierRef.accountName;

                    delete response.link;
                }
                if (response.hasOwnProperty('title') || response.hasOwnProperty('status') ) {
                    let r_split = response.type.split('.');
                    let r_code = r_split[r_split.length -2];
                    let err = {
                        status: r_code,
                        messages: response.data.title
                    };
                    return err;
                }
                return response;
            })
            .catch(async (err: Error) => {
                console.log(err);
                await this.saveLog('manifest', reformatBody, err, true, true);
                return err;
            });
    };

    public getManifest: any = async (requestId: string) => {
        const headers = await this.getHeaders(false);

        const _url :string = this.api_url + '/shipping/v4/manifest/'+requestId;

        return await AxiosapiLib.doCall('get', _url, null, headers)
            .then(async (response: Response | any) => {
                await this.saveLog('getManifest', {url: _url}, response, false, true);
                if (response.hasOwnProperty('manifests')) {
                    // @ts-ignore
                    response.carrier = this._props.account.carrierRef.accountName;

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
                await this.saveLog('getManifest', {url: _url}, err, true, true);
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

    private saveLog: any = async (call: string, req: object, res: object,isErr: boolean = false, isManifest: boolean = false) => {
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

        let logData: IShipping | IManifest;
        if (isManifest == false) {
            logData = new Shipping(shippingData);
        } else {
            logData = new Manifest(shippingData);
        }
        return await logData.save()
            .then((result) => {
                return result;
            }).catch((err: Error) => {
                return err;
            });
    }
}

export default DhlApi;
