import ICarrierAPI from "../ICarrierAPI.interface";
import AxiosapiLib from "../../axiosapi.lib";
import qs from "qs";
import convert from "convert-units";
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
    IPackageDetail} from "../../../types/shipping.types";
import { IError, IPBError, IParamInfo } from "../../../types/error.types";
import { IUser, IAccount } from "../../../types/user.types";
import { 
    IPBRatesRequest, 
    IPBAddress, 
    IPBParcel, 
    IPBRate, 
    IPBRatesResponse, 
    IPBShppingRequest,
    IPBShppingResponse,
    IPBDocument,
    IPBManifestRequest,
    IPBManifestResponse} from "../../../types/carriers/pb";

class PbApi implements ICarrierAPI {
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
            this.api_url = process.env.PB_PROD;
        } else {
            // @ts-ignore
            this.api_url = process.env.PB_TEST;
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
    public auth: any = async () => {
        const data = qs.stringify({
            'grant_type': 'client_credentials'
        });
        const headers = await this.getHeaders(true);
        return await AxiosapiLib.doCall('post', this.api_url + '/oauth/token', data, headers)
            .then((response: Response | any) => {
                this.accesstoken = response.access_token;
                console.log("Authenticate to Pitney Bowes succefylly.");
                return response;
            })
            .catch((err: Error) => {
                console.log("Failed to Authenticate to Pitney Bowes");
                console.log(err);
                return err;
            });
    };

    /**
     * Find product rate of DHL eCommerce
     * @param data
     */
    public products: any = async (data: IProductRequest) => {
        const prodReqBody: IPBRatesRequest = {
            //@ts-ignore
            fromAddress: this.convertToPBAddress(this._props.account.carrierRef.returnAddress),
            toAddress: this.convertToPBAddress(data.toAddress),
            parcel: this.buildPBParcel(data.packageDetail),
            rates: this.buildPBRates(data),
            shipmentOptions: [{
                name: "SHIPPER_ID",
                // @ts-ignore
                value: this._props.account.carrierRef.shipperId
            }]
        };

        const headers = await this.getHeaders(false);

        const paramsStr: string = qs.stringify({
            'includeDeliveryCommitment': true
        });

        console.log("Calling Pitney Bowes [Rates] endpoint");
        try {
            const response = await AxiosapiLib.doCall('post', this.api_url + '/shippingservices/v1/rates?' + paramsStr, prodReqBody, headers);
            //@ts-ignore
            await saveLog('product', prodReqBody, response, this._props.account.id, this._props.account.userRef.id);
            if(response.hasOwnProperty("status") && response.status > 203) {
                console.log("Failed to call Pitney Bowes [Rates] endpoint");
                const pbErrors: IPBError[] = response.data.errors;
                const prodError: IError = {
                    status: response.status,
                    title: pbErrors[0].errorDescription,
                    carrier: data.carrier,
                    error: pbErrors[0].parameters?.map((item: string) => {
                        const invalidParam: IParamInfo = {
                            name: item
                        };
                        return invalidParam;
                    })
                }
                return prodError;
            }

            const pbProdResponse: IPBRatesResponse = response;
            const prodResponse: IProductResponse = {
                ...data,
                products: this.convertToProducts(pbProdResponse, data.rate.currency)
            };
            console.log("Return data from Pitney Bowes [Rates] endpoint");
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
    public label: any = async (data: ILabelRequest) => {
        const rates = this.buildPBRates(data);

        const labelReqBody: IPBShppingRequest = {
            // @ts-ignore
            fromAddress: this.convertToPBAddress(this._props.account.carrierRef.returnAddress),
            toAddress: this.convertToPBAddress(data.toAddress),
            parcel: this.buildPBParcel(data.packageDetail),
            rates: rates,
            documents: [
                {
                    type: "SHIPPING_LABEL",
                    contentType: "BASE64",
                    size: "DOC_4X6",
                    fileFormat: "PNG",
                    printDialogOption: "NO_PRINT_DIALOG"
                }
            ],
            shipmentOptions:[
                {
                    name: "SHIPPER_ID",
                    // @ts-ignore
                    value: this._props.account.carrierRef.shipperId
                },
                {
                    name: "HIDE_TOTAL_CARRIER_CHARGE",
                    value: true
                }
            ]
        }

        if(rates[0].serviceId === "FCM" && rates[0].parcelType === "FLAT") {
            labelReqBody.documents[0].size = "DOC_6X4";
        } else {
            labelReqBody.shipmentOptions.push({
                name: "ADD_TO_MANIFEST",
                value: "true"
            });
        }

        const headers = await this.getHeaders(false);
        headers["X-PB-TransactionId"] = data.packageDetail.packageId || 
                                        "EK-" + Date.now() + Math.round(Math.random() * 1000000).toString();

        console.log("Calling PB [Shipping] endpoint");
        try {
            const response = await AxiosapiLib.doCall('post', this.api_url + '/shippingservices/v1/shipments', labelReqBody, headers);
            // @ts-ignore
            await saveLog('label', labelReqBody, response, this._props.account.id, this._props.account.userRef.id);
            if (response.hasOwnProperty('status') && response.status > 203) {
                console.log("Failed to call PB [Shipping] endpoint");
                const pbErrors: IPBError[] = response.data.errors;
                const labelError: IError = {
                    status: response.status,
                    title: pbErrors[0].errorDescription,
                    carrier: data.carrier,
                    error: pbErrors[0].parameters?.map((item: string) => {
                        const invalidParam: IParamInfo = {
                            name: item
                        };
                        return invalidParam;
                    })
                }
                return labelError;
            }

            const pbLabelResponse: IPBShppingResponse = response;
            const labelResponse: ILabelResponse = {
                timestamp: new Date(),
                carrier: data.carrier,
                provider: data.provider,
                service: data.service,
                labels: pbLabelResponse.documents.map((item: IPBDocument) => {
                    const result: ILabel = {
                        createdOn: new Date(),
                        trackingId: pbLabelResponse.parcelTrackingNumber,
                        labelData: item.pages![0].contents,
                        encodeType: item.contentType,
                        parcelType: pbLabelResponse.rates[0].parcelType,
                        format: item.fileFormat
                    }
                    return result;
                }),
                shippingId: pbLabelResponse.shipmentId
            }

            console.log("Return data from PB [Shipping] endpoint");
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
  
        const paramsStr: string = qs.stringify({
            'carrier': carrier
        });
        const _url :string = this.api_url + '/shippingservices/v1/shipments/' + shippingId + '?' + paramsStr;

        try {
            const headers = await this.getHeaders(false);
            console.log("Call DHL eCommerce [GetLabel] endpoint");
            const response = await AxiosapiLib.doCall('get', _url, null, headers);
            // @ts-ignore
            await saveLog('get label', {url: _url}, response, this._props.account.id, this._props.account.userRef.id);
        
            if (response.hasOwnProperty("status") && response.status > 203) {
                console.log("Failed to call DHL eCommerce [GetLabel] endpoint");
                const pbErrors: IPBError[] = response.data.errors;
                const labelError: IError = {
                    status: response.status,
                    title: pbErrors[0].errorDescription,
                    // @ts-ignore
                    carrier: this._props.account.carrierRef.carrierName,
                    error: pbErrors[0].parameters?.map((item: string) => {
                        const invalidParam: IParamInfo = {
                            name: item
                        };
                        return invalidParam;
                    })
                }
                return labelError;
            }

            const pbLabelResponse: IPBShppingResponse = response;
            const rate = pbLabelResponse.rates[0];
            const labelResponse: ILabelResponse = {
                timestamp: new Date(),
                // @ts-ignore
                carrier: this._props.account.carrierRef.carrierName,
                service: rate.carrier.toUpperCase() + "_" + rate.serviceId,
                labels: pbLabelResponse.documents.map((item: IPBDocument) => {
                    const result: ILabel = {
                        createdOn: new Date(),
                        trackingId: pbLabelResponse.parcelTrackingNumber,
                        labelData: item.pages![0].contents,
                        encodeType: item.contentType,
                        parcelType: pbLabelResponse.rates[0].parcelType,
                        format: item.fileFormat
                    }
                    return result;
                }),
                shippingId: pbLabelResponse.shipmentId
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
     * Create PB | USPS Manifest
     * @param data 
     */
    public manifest: any = async (data: IManifestRequest) => {
        const manifestBody: IPBManifestRequest = {
            carrier: data.provider!,
            submissionDate: this.buildSubmitDate(),
            // @ts-ignore
            fromAddress: this.convertToPBAddress(this._props.account.carrierRef.returnAddress),
            parcelTrackingNumbers: data.manifests[0].trackingIds,
            parameters: [{
                name: "SHIPPER_ID",
                // @ts-ignore
                value: this._props.account.carrierRef.shipperId
            }]
        };

        try {
            const headers = await this.getHeaders(false);
            headers["X-PB-TransactionId"] = "EK-" + Date.now() + Math.round(Math.random() * 1000000).toString();

            console.log("Call PB [RequestManifest] endpoint");
            const response = await AxiosapiLib.doCall('post', this.api_url + '/shippingservices/v1/manifests', manifestBody, headers);
            // @ts-ignore
            await saveLog('request manifest', manifestBody, response, this._props.account.id, this._props.account.userRef.id, false);

            if (response.hasOwnProperty('status') && typeof response.status !== "string" && response.status > 203) {
                console.log("Failed to call DHL eCommerce [RequestManifest] endpoint");
                const pbErrors: IPBError[] = response.data.errors;
                const manifestError: IError = {
                    status: response.status,
                    title: pbErrors[0].errorDescription,
                    carrier: data.carrier,
                    error: pbErrors[0].parameters?.map((item: string) => {
                        const invalidParam: IParamInfo = {
                            name: item
                        };
                        return invalidParam;
                    })
                }
                return manifestError;
            }

            const pbManifestResponse: IPBManifestResponse = response;
            //@ts-ignore
            const manifestResponse: IManifestResponse = {
                timestamp: new Date(),
                carrier: data.carrier,
                provider: data.provider,
                requestId: pbManifestResponse.manifestTrackingNumber,
                manifests: [{
                    createdOn: new Date(),
                    manifestId: pbManifestResponse.manifestId,
                    manifestData: pbManifestResponse.documents![0].contents!,
                    encodeType: pbManifestResponse.documents![0].contentType,
                    format: "PDF",
                    total: pbManifestResponse.parcelTrackingNumbers.length
                }]
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
     * Get Manifest from PB
     * @param requestId 
     */
    public getManifest: any = async (requestId: string) => {
        const manifestError: IError = {
            status: 403,
            title: "This request is not supported for the given carrier",
            //@ts-ignore
            carrier: this._props.account.carrierRef.carrierName
        }
        return manifestError;
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
                'Authorization': 'Bearer ' + this.accesstoken,
                "X-PB-UnifiedErrorStructure": true
            }
        }

        return headers;
    };

    private convertToPBAddress(address: IAddress): IPBAddress {
        let addressLines = [];
        addressLines.push(address.street1);
        if(address.street2) addressLines.push(address.street2);

        return {
            addressLines,
            cityTown: address.city,
            stateProvince: address.state,
            postalCode: address.postalCode,
            countryCode: address.country,
            company: address.company,
            name: address.name,
            phone: address.phone,
            email: address.email,
        }
    }

    private buildPBParcel(packageDetail: IPackageDetail) {
        // For USPS convert weigth to oz
        // @ts-ignore
        const weightInOZ = convert(packageDetail.weight.value).from(packageDetail.weight.unitOfMeasure.toLowerCase()).to("oz");
        const pbParcel: IPBParcel = {
            weight: {
                weight: weightInOZ,
                unitOfMeasurement:  "OZ"
            }
        }
        // For USPS convert unit to in
        if(packageDetail.dimension) {
            // @ts-ignore
            const widthIn = convert(packageDetail.dimension.width).from(packageDetail.dimension.unitOfMeasure.toLowerCase()).to("in");
            // @ts-ignore
            const heightIn = convert(packageDetail.dimension.height).from(packageDetail.dimension.unitOfMeasure.toLowerCase()).to("in");
            // @ts-ignore
            const lengthIn = convert(packageDetail.dimension.length).from(packageDetail.dimension.unitOfMeasure.toLowerCase()).to("in");
            pbParcel.dimension = {
                width: widthIn,
                height: heightIn,
                length: lengthIn,
                unitOfMeasurement: "IN"
            }
        }

        return pbParcel;
    }

    private buildPBRates(data: IProductRequest | ILabelRequest) {
        const provider = data.provider!;
        const serviceId = data.service!;
        const parcelType = data.packageDetail.parcelType!;

        const pbRate: IPBRate = {
            carrier: provider,
            serviceId: serviceId,
            parcelType: parcelType,
            currencyCode: data.rate.currency,
            specialServices: [{
                // Delivery Confirmation - free of charge
                specialServiceId: "DelCon"
            }]
        };

        if((!parcelType) || (serviceId === "FCM" && parcelType === "FLAT")) {
            pbRate.specialServices = undefined;
        } 

        return [pbRate];
    }

    private buildSubmitDate() {
        let d = new Date(),
        month = (d.getMonth() + 1).toString(),
        day =  d.getDate().toString(),
        year = d.getFullYear(),
        hour = d.getHours();

        if(hour >= 20) {
            day = (parseInt(day) + 1).toString();
        }

        if (month.length < 2) {
            month = '0' + month;
        }

        if (day.length < 2) {
            day = '0' + day;
        }

        return [year, month, day].join('-');
    }

    private convertToProducts(data: IPBRatesResponse, currency: string) {
        const rates = data.rates;
        const products = rates.map((rate: IPBRate) => {
            const product: IProduct = {
                carrier: rate.carrier,
                service: rate.serviceId,
                parcelType: rate.parcelType
            }

            product.rate = {
                amount: rate.totalCarrierCharge!,
                currency: currency,
                rateComponents: [{
                    description: "Base Rate",
                    amount: rate.baseCharge!
                }]
            }

            if(rate.surcharges) {
                const surcharges = rate.surcharges.map((charge: {name: string, fee: number}) => {
                    return {description: charge.name, amount: charge.fee};
                })
                product.rate.rateComponents.concat(surcharges);
            }

            if(rate.dimensionalWeight) {
                product.dimentionalWeight = {
                    value: rate.dimensionalWeight.weight,
                    unitOfMeasure: rate.dimensionalWeight.unitOfMeasurement
                }
            }
            
            if(rate.deliveryCommitment) {
                product.estimatedDeliveryDate = {
                    isGuaranteed: rate.deliveryCommitment.guarantee === "FULL",
                    deliveryDaysMax: parseInt(rate.deliveryCommitment.maxEstimatedNumberOfDays),
                    deliveryDaysMin: parseInt(rate.deliveryCommitment.minEstimatedNumberOfDays),
                    estimateDeliveryMin: rate.deliveryCommitment.estimatedDeliveryDateTime
                }
            }

            return product;
        })

        return products;
    }
}

export default PbApi;
