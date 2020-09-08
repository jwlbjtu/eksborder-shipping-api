import ICarrierAPI from "../ICarrierAPI.interface";
import AxiosapiLib from "../../axiosapi.lib";
import qs from "qs";
import Shipping, {IShipping} from "../../../models/shipping.model";
import LRes from "../../lresponse.lib";
import Manifest, {IManifest} from "../../../models/manifest.model";
import { IManifestRequest } from "../../../types/shipping.types";


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
            
            if(process.env.NODE_ENV === "production") {
                // @ts-ignore
                this.api_url = process.env.DHL_ECOMMERCE_PROD;
            } else {
                // @ts-ignore
                this.api_url = process.env.DHL_ECOMMERCE_TEST;
            }
            
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

    /**
     * Create DHL eCommerce Shipping Label
     * @param data 
     * @param format 
     */
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

        const labelReqBody: object = {};

        // @ts-ignore
        labelReqBody.pickup = this._props.account.pickupRef.pickupAccount;
        // @ts-ignore
        labelReqBody.distributionCenter = this._props.account.facilityRef.facilityNumber;
        // @ts-ignore
        labelReqBody.orderedProductId = data.service;
        // @ts-ignore
        labelReqBody.consigneeAddress = this.convertToDHLAddress(data.toAddress);
        // @ts-ignore
        labelReqBody.returnAddress = this.convertToDHLAddress(this._props.account.carrierRef.returnAddress);
        // @ts-ignore
        labelReqBody.packageDetail = data.packageDetail;
        // @ts-ignore
        labelReqBody.packageDetail.billingReference1 = this._props.account.userRef.companyName;
        // @ts-ignore
        labelReqBody.packageDetail.packageId = "EK-"+Date.now();

        const headers = await this.getHeaders(false);

        const paramsStr: string = qs.stringify({
            'format': format
        });

        return await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/label?'+paramsStr, labelReqBody, headers)
            .then(async (response: Response | any) => {
                await this.saveLog('label', labelReqBody, response); // TODO: change to log schema
                if (response.hasOwnProperty('status') && response.status > 203) {
                    return LRes.invalidParamsErr(
                        response.status, 
                        response.data.title, 
                        // @ts-ignore
                        this._props.account.carrierRef.accountCode,
                        response.data.invalidParams
                    );
                }

                // @ts-ignore
                response.carrier = this._props.account.carrierRef.accountCode;
                response.service = response.orderedProductId;
                response.labels[0].trackingId = response.labels[0].dhlPackageId;
                // @ts-ignore
                response.pickup = this._props.account.pickupRef.description;
                // @ts-ignore
                response.distributionCenter = this._props.account.facilityRef.description;

                delete response.orderedProductId;
                delete response.labels[0].packageId;
                delete response.labels[0].dhlPackageId;
                delete response.labels[0].link;
                delete response.labels[0].labelDetail;
                
                return response;
            })
            .catch(async (err: Error) => {
                console.log(err);
                await this.saveLog('label', labelReqBody, err, true);
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
                    response.carrier = this._props.account.carrierRef.accountCode;

                    delete response.labels[0].packageId;
                    delete response.labels[0].dhlPackageId;
                    delete response.labels[0].link;
                    delete response.labels[0].labelDetail;
                }
                if (response.hasOwnProperty('status') && response.status > 203) {
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

    /**
     * Create DHL eCommerce Manifest
     * @param data 
     */
    public manifest: any = async (data: IManifestRequest) => {
        const manifestBody: object = {};

        // @ts-ignore
        manifestBody.pickup = this._props.account.pickupRef.pickupAccount;
        // @ts-ignore
        manifestBody.manifests = [
            {
                dhlPackageIds: data.manifests[0].trackingIds
            }
        ];

        const headers = await this.getHeaders(false);

        return await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/manifest', manifestBody, headers)
            .then(async (response: Response | any) => {
                await this.saveLog('manifest', manifestBody, response, false, true);
                if (response.hasOwnProperty('title') || response.hasOwnProperty('status') ) {
                    return LRes.invalidParamsErr(
                        response.status, 
                        response.data.title, 
                        // @ts-ignore
                        this._props.account.carrierRef.accountCode,
                        response.data.invalidParams
                    );
                }

                // @ts-ignore
                response.carrier = this._props.account.carrierRef.accountCode;

                delete response.link;
                
                return response;
            })
            .catch(async (err: Error) => {
                console.log(err);
                await this.saveLog('manifest', manifestBody, err, true, true);
                return err;
            });
    };

    /**
     * Get Manifest from DHl
     * @param requestId 
     */
    public getManifest: any = async (requestId: string) => {
        // @ts-ignore
        const pickup = this._props.account.pickupRef.pickupAccount;        

        const _url :string = this.api_url + '/shipping/v4/manifest/' + `${pickup}/${requestId}`;

        const headers = await this.getHeaders(false);

        return await AxiosapiLib.doCall('get', _url, null, headers)
            .then(async (response: Response | any) => {
                await this.saveLog('getManifest', {url: _url}, response, false, true);
                if (response.hasOwnProperty('status') && typeof response.status != "string") {
                    return LRes.invalidParamsErr(
                        response.status, 
                        response.data.title, 
                        // @ts-ignore
                        this._props.account.carrierRef.accountCode,
                        response.data.invalidParams
                    );
                }

                // @ts-ignore
                response.carrier = this._props.account.carrierRef.accountCode;
                
                delete response.link;
                delete response.pickup;

                if (response.manifests) {
                    response.manifests.forEach((item: any) => {
                        delete item.distributionCenter;
                        delete item.isInternational;
                    })
                }

                return response;
            })
            .catch(async (err: Error) => {
                console.log("GEt ing get manifest err handler ");
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

    private saveLog: any = async (call: string, req: object, res: object, isErr: boolean = false, isManifest: boolean = false) => {
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

        // @ts-ignore
        if (isErr == true || (res.hasOwnProperty('status') && typeof res.status != "string")) {
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

    private convertToDHLAddress(address: any) {
        return {
            name: address.name,
            companyName: address.companyName,
            address1: address.street1,
            address2: address.street2,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
            email: address.email,
            phone: address.phone
        }
    }
}

export default DhlApi;
