import ICarrierAPI from "../ICarrierAPI.interface";
import AxiosapiLib from "../../axiosapi.lib";
import qs from "qs";
import { saveLog } from "../../../lib/log.handler";
import { 
    IManifestRequest, 
    IProductRequest, 
    IAddress, 
    IProductResponse, 
    IProduct, 
    ILabelRequest, 
    ILabelResponse, 
    ILabel, 
    IManifestResponse,
    IManifest,
    IManifestSummary,
    IManifestSummaryError} from "../../../types/shipping.types";
import { 
    IDHLeCommerceProductRequest, 
    IDHLeCommercePackageDetail, 
    IDHLeCommerceProductResponse, 
    IDHLeCommerceAddress, 
    IDHLeCommerceProduct, 
    IDHLeCommerceLabelRequest, 
    IDHLeCommerceLabelResponse, 
    IDHLeCommerceLabel, 
    IDHLeCommerceManifestRequest,
    IDHLeCommerceManifestResponse,
    IDHLeCommerceManifest,
    IDHLeCommerceManifestSummaryError} from "../../../types/carriers/dhl.ecommerce";
import { IDHLeCommerceError, IError } from "../../../types/error.types";
import { IAccount, IUser } from "../../../types/user.types";

class DhlApi implements ICarrierAPI {
    private _props: {account: IAccount, user: IUser};
    private _credential: {
        client_id: string,
        client_secret: string
    };
    private api_url: string = '';
    private accesstoken: string = '';

    /**
     * @param props
     */
    constructor(props: {account: IAccount, user: IUser}) {
        this._props = props;
        
        if(process.env.NODE_ENV === "production") {
            // @ts-ignore
            this.api_url = process.env.DHL_ECOMMERCE_PROD;
        } else {
            // @ts-ignore
            this.api_url = process.env.DHL_ECOMMERCE_TEST;
        }

        this._credential = {
            // @ts-ignore
            client_id: this._props.account.carrierRef.clientId,
            // @ts-ignore
            client_secret: this._props.account.carrierRef.clientSecret
        };
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
     * Find product rate of DHL eCommerce
     * @param data
     */
    public products: any = async (data: IProductRequest) => {

        const dhlPackageDetail: IDHLeCommercePackageDetail = {
            packageId: data.packageDetail.packageId ||  "EK-" + Date.now(),
            packageDescription: data.packageDetail.packageDescription,
            weight: data.packageDetail.weight,
            dimension: data.packageDetail.dimension,
            billingReference1: data.packageDetail.billingReference1,
            billingReference2: data.packageDetail.billingReference2
        }

        const prodReqBody: IDHLeCommerceProductRequest = {
            // @ts-ignore
            pickup: this._props.account.pickupRef.pickupAccount,
            // @ts-ignore
            distributionCenter: this._props.account.facilityRef.facilityNumber,
            orderedProductId: data.service,
            consigneeAddress: this.convertToDHLAddress(data.toAddress),
            // @ts-ignore
            returnAddress: this.convertToDHLAddress(this._props.account.carrierRef.returnAddress),
            packageDetail: dhlPackageDetail,
            rate: data.rate,
            estimatedDeliveryDate: data.estimatedDeliveryDate
        }

        const headers = await this.getHeaders(false);

        console.log("Calling DHL eCommerce [Product Finder] endpoint");
        try {
            const response = await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/products', prodReqBody, headers);
            //@ts-ignore
            await saveLog('product', prodReqBody, response, this._props.account.id, this._props.account.userRef.id);

            if(response.hasOwnProperty("status") && response.status > 203) {
                console.log("Failed to call DHL eCommerce [Product Finder] endpoint");
                const dhlError: IDHLeCommerceError = response.data;
                const prodError: IError = {
                    status: response.status,
                    title: dhlError.title,
                    carrier: data.carrier,
                    error: dhlError.invalidParams
                }
                return prodError;
            }

            const dhlProdResponse: IDHLeCommerceProductResponse = response;
            const prodResponse: IProductResponse = {
                ...data,
                products: dhlProdResponse.products ? 
                            dhlProdResponse.products.map((item: IDHLeCommerceProduct) : IProduct => {
                                return this.convertIDHLeCommerceProductToIProduct(item);
                            }) : undefined
            };
            console.log("Return data from DHL eCommerce [Product Finder] endpoint");
            return prodResponse;
        } catch (error) {
            console.log(error);
            //@ts-ignore
            await saveLog('product', prodReqBody, error, this._props.account.id, this._props.account.userRef.id, true);
            return error;
        }
    };

    /**
     * Create DHL eCommerce Shipping Label
     * @param data 
     * @param format 
     */
    public label: any = async (data: ILabelRequest, format: 'ZPL' | 'PNG' = 'PNG') => {

        const dhlPackageDetail: IDHLeCommercePackageDetail = {
            packageId: data.packageDetail.packageId ||  "EK-" + Date.now() + Math.round(Math.random() * 1000000).toString(),
            packageDescription: data.packageDetail.packageDescription,
            weight: data.packageDetail.weight,
            dimension: data.packageDetail.dimension,
            billingReference1: data.packageDetail.billingReference1,
            billingReference2: data.packageDetail.billingReference2
        }

        const labelReqBody: IDHLeCommerceLabelRequest = {
            // @ts-ignore
            pickup: this._props.account.pickupRef.pickupAccount,
            // @ts-ignore
            distributionCenter: this._props.account.facilityRef.facilityNumber,
            orderedProductId: data.service,
            consigneeAddress: this.convertToDHLAddress(data.toAddress),
            // @ts-ignore
            returnAddress: this.convertToDHLAddress(this._props.account.carrierRef.returnAddress),
            packageDetail: dhlPackageDetail
        };

        const headers = await this.getHeaders(false);

        const paramsStr: string = qs.stringify({
            'format': format
        });

        console.log("Calling DHL eCommerce [Label] endpoint");
        try {
            const response = await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/label?' + paramsStr, labelReqBody, headers);
            // @ts-ignore
            await saveLog('label', labelReqBody, response, this._props.account.id, this._props.account.userRef.id);

            if (response.hasOwnProperty('status') && response.status > 203) {
                console.log("Failed to call DHL eCommerce [Label] endpoint");
                const dhlError: IDHLeCommerceError = response.data;
                const labelError: IError = {
                    status: response.status,
                    title: dhlError.title,
                    carrier: data.carrier,
                    error: dhlError.invalidParams
                }
                return labelError;
            }

            const dhlLabelResponse: IDHLeCommerceLabelResponse = response;
            const labelResponse: ILabelResponse = {
                timestamp: dhlLabelResponse.timestamp,
                carrier: data.carrier,
                service: dhlLabelResponse.orderedProductId,
                labels: dhlLabelResponse.labels.map((item: IDHLeCommerceLabel) => {
                    const result: ILabel = {
                        createdOn: item.createdOn,
                        trackingId: item.dhlPackageId,
                        labelData: item.labelData,
                        encodeType: item.encodeType,
                        format: item.format
                    }
                    return result;
                }),
                shippingId: dhlLabelResponse.labels[0].dhlPackageId
            }

            console.log("Return data from DHL eCommerce [Label] endpoint");
            return labelResponse;
        } catch (error) {
            // @ts-ignore
            await saveLog('label', labelReqBody, err, this._props.account.id, this._props.account.userRef.id, true);
            return error;
        }
    };

    /**
     * Get Label Data from DHL eCOmmerce
     * @param packageId 
     * @param dhlPackageId 
     */
    public getLabel: any = async (shippingId: string, carrier: string) => {
        // @ts-ignore
        const pickup = this._props.account.pickupRef.pickupAccount;    
        const paramsStr: string = qs.stringify({
            'dhlPackageId': shippingId
        });
        const _url :string = this.api_url + '/shipping/v4/label/' + pickup + '?' + paramsStr;

        try {
            const headers = await this.getHeaders(false);
            console.log("Call DHL eCommerce [GetLabel] endpoint");
            const response = await AxiosapiLib.doCall('get', _url, null, headers);
            // @ts-ignore
            await saveLog('get label', {url: _url}, response, this._props.account.id, this._props.account.userRef.id);
        
            if (response.hasOwnProperty("status") && response.status > 203) {
                console.log("Failed to call DHL eCommerce [GetLabel] endpoint");
                const dhlError: IDHLeCommerceError = response.data;
                const labelError: IError = {
                    status: response.status,
                    title: dhlError.title,
                    //@ts-ignore
                    carrier: this._props.account.carrierRef.carrierName,
                    error: dhlError.invalidParams
                }
                return labelError;
            }

            const dhlLabelResponse: IDHLeCommerceLabelResponse = response;
            const labelResponse: ILabelResponse = {
                timestamp: dhlLabelResponse.timestamp,
                //@ts-ignore
                carrier: this._props.account.carrierRef.carrierName,
                service: dhlLabelResponse.orderedProductId,
                labels: dhlLabelResponse.labels.map((item: IDHLeCommerceLabel) => {
                    const result: ILabel = {
                        createdOn: item.createdOn,
                        trackingId: item.dhlPackageId,
                        labelData: item.labelData,
                        encodeType: item.encodeType,
                        format: item.format
                    }
                    return result;
                })
            }

            console.log("Return data from DHL eCommerce [GetLabel] endpoint");
            return labelResponse;
        } catch (error) {
            console.log(error);
            // @ts-ignore
            await saveLog('get label', {url: _url}, error, this._props.account.id, this._props.account.userRef.id, true);
            return error;
        }
    };

    /**
     * Create DHL eCommerce Manifest
     * @param data 
     */
    public manifest: any = async (data: IManifestRequest) => {
        const manifestBody: IDHLeCommerceManifestRequest = {
            // @ts-ignore
            pickup: this._props.account.pickupRef.pickupAccount,
            manifests: [
                {
                    dhlPackageIds: data.manifests[0].trackingIds
                }
            ]
        };

        try {
            const headers = await this.getHeaders(false);

            console.log("Call DHL eCommerce [RequestManifest] endpoint");
            const response = await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/manifest', manifestBody, headers);
            // @ts-ignore
            await saveLog('request manifest', manifestBody, response, this._props.account.id, this._props.account.userRef.id, false);

            if (response.hasOwnProperty('status') && typeof response.status !== "string" && response.status > 203) {
                console.log("Failed to call DHL eCommerce [RequestManifest] endpoint");
                const dhlError: IDHLeCommerceError = response.data;
                const labelError: IError = {
                    status: response.status,
                    title: dhlError.title,
                    carrier: data.carrier,
                    error: dhlError.invalidParams
                }
                return labelError;
            }

            const dhlManifestResponse: IDHLeCommerceManifestResponse = response;
            //@ts-ignore
            const manifestResponse: IManifestResponse = {
                timestamp: dhlManifestResponse.timestamp,
                carrier: data.carrier,
                requestId: dhlManifestResponse.requestId
            }
           
            console.log("Return data from DHL eCommerce [RequestManifest] endpoint");
            return manifestResponse;
        } catch (error) {
            console.log(error);
            // @ts-ignore
            await saveLog('request manifest', manifestBody, err, this._props.account.id, this._props.account.userRef.id, true);
            return error;
        }
    };

    /**
     * Get Manifest from DHl
     * @param requestId 
     */
    public getManifest: any = async (requestId: string) => {
        // @ts-ignore
        const pickup = this._props.account.pickupRef.pickupAccount;        

        const _url :string = this.api_url + '/shipping/v4/manifest/' + `${pickup}/${requestId}`;

        try {
            const headers = await this.getHeaders(false);
            console.log("Call DHL eCommerce [DownloadManifest] endpoint");
            const response = await AxiosapiLib.doCall('get', _url, null, headers);
            // @ts-ignore
            await saveLog('download manifest', {url: _url}, response, this._props.account.id, this._props.account.userRef.id, false);
            
            if (response.hasOwnProperty('status') && typeof response.status != "string" && response.status > 203) {
                console.log("Failed to call DHL eCommerce [DownloadManifest] endpoint");
                const dhlError: IDHLeCommerceError = response.data;
                const manifestError: IError = {
                    status: response.status,
                    title: dhlError.title,
                    //@ts-ignore
                    carrier: this._props.account.carrierRef.carrierName,
                    error: dhlError.invalidParams
                }
                return manifestError;
            }

            const dhlManifestResponse: IDHLeCommerceManifestResponse = response;

            let summary: IManifestSummary | undefined = undefined;
            if(dhlManifestResponse.manifestSummary) {
                summary = {
                    total: dhlManifestResponse.manifestSummary.total,
                    invalid: {
                        total: dhlManifestResponse.manifestSummary.invalid.total,
                        trackingIds: dhlManifestResponse.manifestSummary.invalid.dhlPackageIds?.map((item: IDHLeCommerceManifestSummaryError) => {
                                            const result: IManifestSummaryError = {
                                                trackingId: item.dhlPackageId,
                                                errorCode: item.errorCode,
                                                errorDescription: item.errorDescription
                                            }
                                            return result;
                                        })
                    }
                }
            }
            // @ts-ignore
            const manifestResponse: IManifestResponse = {
                timestamp: dhlManifestResponse.timestamp,
                //@ts-ignore
                carrier: this._props.account.carrierRef.carrierName,
                requestId: dhlManifestResponse.requestId,
                status: dhlManifestResponse.status,
                manifests:dhlManifestResponse.manifests?.map((item: IDHLeCommerceManifest) => {
                    const resutl: IManifest = {
                        createdOn: item.createdOn,
                        manifestId: item.manifestId,
                        total: item.total,
                        manifestData: item.manifestData,
                        encodeType: item.encodeType,
                        format: item.format
                    }
                    return resutl;
                }),
                manifestSummary: summary
            }

            console.log("Return data from DHL eCommerce [DownloadManifest] endpoint");
            return manifestResponse;
        } catch (error) {
            console.log(error);
            // @ts-ignore
            await saveLog('download manifest', {url: _url}, err, this._props.account.id, this._props.account.userRef.id, true);
            return error;
        }     
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

    private convertToDHLAddress(address: IAddress): IDHLeCommerceAddress {
        return {
            name: address.name,
            companyName: address.company,
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

    private convertIDHLeCommerceProductToIProduct(dhlProduct: IDHLeCommerceProduct): IProduct {

        let newRate = undefined;
        if(dhlProduct.rate) {
            newRate = {
                amount: dhlProduct.rate.amount,
                currency: dhlProduct.rate.currency,
                rateComponents: dhlProduct.rate.rateComponents.map(component => {
                    return {
                        description: component.description,
                        amount: component.amount
                    };
                })
            };
        }

        let newMessages = undefined;
        if(dhlProduct.messages) {
            newMessages = dhlProduct.messages.map(message => {
                return { messageText: message.messageText };
            });
        }

        return {
            service: dhlProduct.orderedProductId,
            productName: dhlProduct.productName,
            description: dhlProduct.description,
            trackingAvailable: dhlProduct.trackingAvailable,
            rate: newRate,
            estimatedDeliveryDate: dhlProduct.estimatedDeliveryDate,
            messages: newMessages
        }
    }
}

export default DhlApi;
