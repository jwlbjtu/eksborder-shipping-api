import * as express from "express";
import { Request, Response} from "express";
import convert from "convert-units";
import LRes from "../../lib/lresponse.lib";
import AuthController from "../../lib/auth/auth.handler"

import CarrierFactory from "../../lib/carrier.factory";
import IControllerBase from "../../interfaces/IControllerBase.interface";
import ICarrierAPI from "../../lib/carriers/ICarrierAPI.interface";
import HelperLib from "../../lib/helper.lib";
import { 
    DHL_ECOMMERCE, 
    DHL_FLAT_PRICES, 
    massUnits, 
    errorTypes, 
    BILLING_TYPES, 
    SUPPORTED_CARRIERS, 
    SUPPORTED_SERVICES,
    CARRIERS,
    SUPPORTED_PROVIDERS} from "../../lib/constants";
import { createFlatLabel } from "../../lib/carriers/flat/flat.helper";

import Billing from "../../models/billing.model";
import Shipping from "../../models/shipping.model";
import Manifest from "../../models/manifest.model";
import User from "../../models/user.model";

import { 
    IManifestRequest, 
    IProduct, 
    ILabelRequest, 
    IProductResponse, 
    IProductRequest, 
    ILabelResponse, 
    IManifestResponse,
    IManifestSummary,
    IManifestSummaryError} from "../../types/shipping.types";
import { IBilling, IShipping } from "../../types/record.types";
import { IUser, IAccount } from "../../types/user.types";

class ShippingController implements IControllerBase, ICarrierAPI {
    public path = "/shipping";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        //this.router.post(this.path + "/products/:type", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.products);
        this.router.post(this.path + "/label", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.label);
        this.router.get(this.path + "/label/:shippingId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getLabel);
        //this.router.get(this.path + "/label/:carrierAccount/:carrier/:shippingId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getLabel);
        this.router.post(this.path + "/manifest", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.manifest);
        this.router.get(this.path + "/manifest/:carrierAccount/:requestId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getManifest);
    }

    private initCF: CarrierFactory | any = async (account: IAccount, user: IUser) => {
        // @ts-ignore
        const cf = new CarrierFactory(account.carrierRef.carrierName, {user, account});
        // @ts-ignore
        await cf.auth();
        return cf;
    };

    public products: any = async (req: Request, res: Response) => {
        res.send();
        // const body = req.body;

        // try {
        //     await this.initCF(req, res);
        //     // @ts-ignore
        //     const cfFind = await this.cf.products(body);
        //     if (cfFind.hasOwnProperty('messages') || (cfFind.hasOwnProperty('status') && cfFind.status > 203)) {
        //         return LRes.resErr(res, cfFind.status, cfFind.messages);
        //     }
        //     return LRes.resOk(res, cfFind);

        // } catch (err) {
        //     return LRes.resErr(res, 401, err);
        // }
    };

    /**
     * Create Shipping Label
     * @param req 
     * @param res 
     */
    public label: any = async (req: Request, res: Response) => {
        const body: ILabelRequest = req.body;
        let carrier: string | undefined = body.carrier || undefined;
        let provider: string | undefined = body.provider || undefined;
        let service: string | undefined = body.service || undefined;
        let carrierAccount: string | undefined = body.carrierAccount || undefined;
        let account: IAccount | undefined | null = undefined;
        try {
            const checkedCarrier = this.validateCarrier(carrier, provider);
            carrier = checkedCarrier.carrier;
            provider = checkedCarrier.provider;
            service = this.validateService(carrier.toLowerCase(), provider, service);
            // @ts-ignore
            const checkValues = await this.validateCarrierAccount(carrierAccount, req.user);
            carrierAccount = checkValues.carrierAccount;
            account = checkValues.account;
        } catch (error) {
            console.log(error);
            return res.status(400).json(error);
        }

        // Set packageId and billingReference
        body.packageDetail.packageId = "EK-" + Date.now() + Math.round(Math.random() * 1000000).toString();
        // @ts-ignore
        body.packageDetail.billingReference1 = req.user.company;

        try {
            console.log("1. Check Package Price");
            let packagePrice: number | undefined = undefined;
            let priceCurrency: string = "USD";
            let product: IProduct | undefined = undefined;
            if(carrier === DHL_ECOMMERCE && service === "FLAT") {
                // TODO: Create FLAT Rate data in database
                // Load and Check FLAT Rate based on request
                const weight = body.packageDetail.weight.value;
                const unitOfMeasure = body.packageDetail.weight.unitOfMeasure;

                if(!massUnits.includes(unitOfMeasure.toUpperCase())) {
                    return res.status(400).json(LRes.fieldErr(
                        "unitOfMeasure", 
                        "/packageDetail/weight/unitOfMeasure", 
                        errorTypes.UNSUPPORTED, unitOfMeasure, carrier));
                }
                // @ts-ignore
                const weightInOZ = convert(weight).from(unitOfMeasure.toLowerCase()).to("oz");
                packagePrice = DHL_FLAT_PRICES[Math.ceil(weightInOZ).toString()];
                priceCurrency = "USD";
            } else {
                // Check price from Carrier Product Finder
                const cf = await this.initCF(account, req.user); // TODO: refine carrier factory auth logic

                const prodRequest: IProductRequest = {
                    ...body,
                    rate: {
                        calculate: true,
                        currency: "USD"
                    },
                    estimatedDeliveryDate: {
                        calculate: true
                    }
                }

                const response = await cf.products(prodRequest);
                if (response.hasOwnProperty('status') && response.status > 203) {
                    return res.status(response.status).json(response);
                }

                const productResponse: IProductResponse = response;
                if (productResponse.products && productResponse.products.length > 0) {
                    const productBody: IProduct = productResponse.products[0];

                    if(productBody && productBody.rate) {
                        const rate = productBody.rate;
                        packagePrice = rate.amount;
                        priceCurrency = rate.currency;
                        product = productBody;
                    } else {
                        return LRes.resErr(res, 404, productBody.messages);
                    }
                }
            }

            console.log(`Package price is ${packagePrice} ${priceCurrency}`);            
            if(!packagePrice) return res.status(500).json(LRes.invalidParamsErr(500, "Failed to compute package price", carrier));

            console.log("2. Apply fee on top of the price to get total price");
            // @ts-ignore
            const billingType = account.billingType;
            // @ts-ignore
            const fee = account.fee;

            let totalFee = fee;
            if (billingType === BILLING_TYPES.PROPORTION) {
                totalFee = parseFloat((packagePrice * (fee / 100)).toFixed(2));
            }
            const totalCost = parseFloat((packagePrice + totalFee).toFixed(2));

            console.log("3. Check total price against user balance");
            // @ts-ignore
            if (req.user.balance < totalCost) return res.status(400).json(LRes.invalidParamsErr(400, "Insufficient balance, please contact the customer service.", carrier));

            console.log("4. Create Shipping label and response data");
            let labelResponse: ILabelResponse | undefined = undefined;
            if(carrier === DHL_ECOMMERCE && service === "FLAT") {
                // Crate FLAT label
                // @ts-ignore
                labelResponse = await createFlatLabel(body, account, req.user);
            } else {
                const cf = await this.initCF(account, req.user); // TODO: refine carrier factory auth logic

                body.rate = { currency: "USD" };

                const response = await cf.label(body);
                if ((response.hasOwnProperty('status') && response.status > 203)) {
                    return res.status(response.status).json(response);
                }
                labelResponse = response;
            }
            // @ts-ignore
            if(!labelResponse) return res.status(500).json(LRes.invalidParamsErr(500, "Failed to create label", carrier));
            
            console.log("5. Charge the fee from user balance");
            // @ts-ignore
            const newBalance = parseFloat((req.user.balance - totalCost).toFixed(2));
            await User.findByIdAndUpdate(
                // @ts-ignore
                {_id: req.user._id},
                // @ts-ignore
                {balance: newBalance},
                {runValidators: true, new: true}
            );
                        
            console.log("6. Create shipping record");
            // @ts-ignore
            const shippingRecord: IShipping = {
                ...labelResponse,
                toAddress: body.toAddress,
                trackingId: labelResponse.labels[0].trackingId,
                shippingId: labelResponse.shippingId,
                manifested: false,
                // @ts-ignore
                userRef: req.user.id
            }
            await new Shipping(shippingRecord).save();

            console.log("7. Generate billing record");
            // @ts-ignore
            const billingObj: IBilling = {
                // @ts-ignore
                userRef: req.user.id,
                description: `${carrier}, ${service}, ${labelResponse.labels[0].trackingId}`,
                account: carrierAccount,
                total: totalCost,
                balance: newBalance,
                currency: priceCurrency,
                details: {
                    shippingCost: {
                        amount: packagePrice,
                        components: product?.rate?.rateComponents
                    },
                    fee: {
                        amount: totalFee,
                        type: billingType === BILLING_TYPES.PROPORTION ? 
                            `${fee}%` : `$${fee}`
                    }
                }
            };
            const createBilling = new Billing(billingObj);
            await createBilling.save();
            
            console.log("8. Return Label Data");
            return LRes.resOk(res, labelResponse);
        } catch (err) {
            console.log("!!!ERROR!!!" + err);
            return LRes.resErr(res, 500, err);
        }
    };

    /**
     * Get Label from Eksborder Database
     * @param req 
     * @param res 
     */
    public getLabel: any = async (req: Request, res: Response) => {
        const shippingId: string | undefined = req.params.shippingId || undefined;

        if(!shippingId) return res.status(400).json(LRes.fieldErr("shippingId", "/", errorTypes.MISSING));

        try {
            // first try to find the label data from local
            // @ts-ignore
            const shipping: IShipping = await Shipping.findOne({shippingId, userRef: req.user._id });
            if(shipping) {
                const label: ILabelResponse = {
                    timestamp: shipping.timestamp,
                    carrier: shipping.carrier,
                    provider: shipping.provider,
                    service: shipping.service,
                    labels: shipping.labels,
                    shippingId: shipping.shippingId
                };
                console.log("Find local Label Data");
                return LRes.resOk(res, label);
            } else {
                return LRes.resErr(res, 404, `No label found for shippingId [${shippingId}]`);
            }
        } catch (error) {
            console.log(error);
            return LRes.resErr(res, 500, error);
        }
    };

    
    /**
     * Reqiest Manifest from Carrier
     * @param req 
     * @param res 
     */
    public manifest: any = async (req: Request, res: Response) => {
        const body: IManifestRequest = req.body;
        let carrier: string | undefined = body.carrier || undefined;
        let provider: string | undefined = body.provider || undefined;
        let carrierAccount: string | undefined = body.carrierAccount || undefined;
        let account: IAccount | undefined | null = undefined;
        const manifests: [{ trackingIds: string[] }] = body.manifests;

        try {
            const checkedCarrier = this.validateCarrier(carrier, provider);
            carrier = checkedCarrier.carrier;
            provider = checkedCarrier.provider;
            // @ts-ignore
            const checkValues = await this.validateCarrierAccount(carrierAccount, req.user);
            carrierAccount = checkValues.carrierAccount;
            account = checkValues.account;
        } catch (error) {
            return res.status(400).json(error);
        }

        if(!manifests) return res.status(400).json(LRes.fieldErr("manifests", "/", errorTypes.MISSING, carrier));
        if(manifests.length < 1) return res.status(400).json(LRes.fieldErr("manifests", "/", errorTypes.EMPTY, carrier));
        if(!manifests[0].trackingIds) res.status(400).json(LRes.fieldErr("trackingIds", "/manifests/0/trackingIds", errorTypes.MISSING, carrier));
        if(manifests[0].trackingIds.length < 1) return res.status(400).json(LRes.fieldErr("trackingIds", "/manifests/0/trackingIds", errorTypes.EMPTY, carrier));

        // make sure all tracking ids belong to the request user
        // @ts-ignore
        const shippings = await Shipping.find({trackingId: { $in: manifests[0].trackingIds }, userRef: req.user._id}, "trackingId");
        if(!shippings || shippings.length < 1) return res.status(400).json(LRes.fieldErr("trackingIds", "/manifests/0/trackingIds", errorTypes.INVALID, "trackingIds", carrier));
        console.log(shippings);
        const newIds = shippings.map((item: IShipping) => {
            return item.trackingId;
        });
        console.log(newIds);
        body.manifests[0].trackingIds = newIds;

        try {
            const cf = await this.initCF(account, req.user);
            // @ts-ignore
            const response = await cf.manifest(body);
            if ((response.hasOwnProperty('status') && typeof response.status !== "string" && response.status > 203)) {
                return res.status(response.status).json(response);
            }

            const manifestResponse: IManifestResponse = response;
            //@ts-ignore
            manifestResponse.userRef = req.user._id;
            manifestResponse.trackingIds = manifests[0].trackingIds;
            // save manifest response data into database
            await new Manifest(manifestResponse).save();

            return LRes.resOk(res, manifestResponse);
        } catch (err) {
            console.log(err);
            return LRes.resErr(res, 500, err);
        }
    };


    /**
     * Download Manifest from Carrier
     * @param req 
     * @param res 
     */
    public getManifest: any = async (req: Request, res: Response) => {
        const requestId: string | undefined = req.params.requestId || undefined;
        let carrierAccount: string | undefined = req.params.carrierAccount || undefined;
        let account: IAccount | undefined | null = undefined;

        if(!requestId) return res.status(400).json(LRes.fieldErr("requestId", "/", errorTypes.MISSING));
        try {
            // @ts-ignore
            const checkValues = await this.validateCarrierAccount(carrierAccount, req.user);
            carrierAccount = checkValues.carrierAccount;
            account = checkValues.account;
        } catch (error) {
            console.log(error);
            return res.status(400).send(error);
        }

        try {
            // check if data is available in the system
            const manifest = await Manifest.findOne(
                // @ts-ignore
                { requestId: requestId, userRef: req.user._id}
            );
            if(!manifest) return LRes.resErr(res, 404, `No manifest found with requiredId [${requestId}], please create manifest first`);
            if(manifest.status === "COMPLETED") return LRes.resOk(res, manifest);

            // request latest manifest data from carrier
            const cf = await this.initCF(account, req.user);
            // @ts-ignore
            const response = await cf.getManifest(requestId);
            if ((response.hasOwnProperty('status') && typeof response.status !== "string" && response.status > 203)) {
                return res.status(response.status).json(response);
            }
            // update local manifest data
            const manifestResponse: IManifestResponse = response;
            // @ts-ignore
            manifestResponse.userRef = req.user._id;

            const updatedManifest = await Manifest.findOneAndUpdate(
                // @ts-ignore
                { requestId: requestId, userRef: req.user._id},
                manifestResponse,
                { new: true }
            );

            // if the manifest is completed update shipping records
            if(updatedManifest && updatedManifest.status === "COMPLETED") {
                console.log("start to check for tracking ids");
                let trackingIds: string[] | undefined = updatedManifest.trackingIds;
                console.log(trackingIds);
                if(trackingIds) {
                    const summary: IManifestSummary | undefined = updatedManifest.manifestSummary;
                    if(summary) {
                        const invalidTrackingIds: IManifestSummaryError[] | undefined = summary.invalid.trackingIds;
                        if(invalidTrackingIds) {
                            console.log("Find summary");
                            console.log(invalidTrackingIds);
                            const invalidIds = invalidTrackingIds.map((item: IManifestSummaryError) => {
                                return item.trackingId;
                            });
                            console.log(invalidIds);
                            trackingIds = trackingIds.filter((item: string) => {
                                return invalidIds.includes(item) === false;
                            });
                            console.log(trackingIds);
                        }
                    }
                    console.log("Updating");
                    console.log(trackingIds);
                    await Shipping.updateMany(
                        { trackingId: { $in: trackingIds } },
                        { $set: { manifested: true } }
                    );
                } 
            }

            return LRes.resOk(res, updatedManifest);
        } catch (error) {
            console.log(error);
            return LRes.resErr(res, 500, error);
        }
    };

    private validateCarrier = (carrier: string | undefined, provider: string | undefined) => {
        if(!carrier) throw LRes.fieldErr("carrier", "/", errorTypes.MISSING);
        if(!SUPPORTED_CARRIERS.includes(carrier.toLowerCase())) throw LRes.fieldErr("carrier", "/", errorTypes.UNSUPPORTED, carrier);
        if(carrier.toLowerCase() === CARRIERS.PITNEY_BOWES && !provider) throw LRes.fieldErr("provider", "/", errorTypes.MISSING);
        if(provider && !SUPPORTED_PROVIDERS[carrier.toLowerCase()].includes(provider)) throw LRes.fieldErr("provider", "/", errorTypes.UNSUPPORTED, provider, carrier);
        return { carrier, provider };
    }

    private validateService = (carrier: string, provider: string | undefined, service: string | undefined): string => {
        if(!service) throw LRes.fieldErr("service", "/", errorTypes.MISSING);
        let supportedServices = SUPPORTED_SERVICES[carrier.toLowerCase()];
        if(carrier.toLowerCase() === CARRIERS.PITNEY_BOWES && provider) {
            supportedServices = SUPPORTED_SERVICES[provider];
        }
        if(!supportedServices.includes(service)) throw LRes.fieldErr("service", "/", errorTypes.UNSUPPORTED, service, carrier);
        return service;
    }

    private validateCarrierAccount = async (carrierAccount: string | undefined, user: IUser): Promise<{carrierAccount: string, account: IAccount}> => {
        if(!carrierAccount) throw LRes.fieldErr("carrierAccount", "/", errorTypes.MISSING);
        const account = await HelperLib.getCurrentUserAccount(carrierAccount, user);
        if(!account) throw LRes.fieldErr("carrierAccount", "/", errorTypes.INVALID, carrierAccount);
        return {carrierAccount, account};
    }
}

export default ShippingController;

//************************************************************//
//*************** Get Label From Carrier API *****************//
//************************************************************//
// /**
//  * Get Label (Shipping) data
//  * @param req 
//  * @param res 
//  */
// public getLabel: any = async (req: Request, res: Response) => {
//     const shippingId: string | undefined = req.params.shippingId || undefined;
//     let carrierAccount: string | undefined = req.params.carrierAccount || undefined;
//     let account: IAccount | undefined | null = undefined;

//     if(!shippingId) return res.status(400).json(LRes.fieldErr("shippingId", "/", errorTypes.MISSING));
//     try {
//         // @ts-ignore
//         const checkValues = await this.validateCarrierAccount(carrierAccount, req.user);
//         carrierAccount = checkValues.carrierAccount;
//         account = checkValues.account;
//     } catch (error) {
//         console.log(error);
//         return res.status(400).send(error);
//     }

//     try {
//         // first try to find the label data from local
//         // @ts-ignore
//         const shipping: IShipping = await Shipping.findOne({shippingId, userRef: req.user._id });
//         if(false) {
//             const label: ILabelResponse = {
//                 timestamp: shipping.timestamp,
//                 carrier: shipping.carrier,
//                 service: shipping.service,
//                 labels: shipping.labels
//             };
//             console.log("Find local Label Data");
//             return LRes.resOk(res, label);
//         } else {
//             // Get label data from carrier                
//             console.log("Getting Label Data from Carrier");
//             // @ts-ignore
//             const cf = await this.initCF(account, req.user._id);
//             // @ts-ignore
//             const response = await cf.getLabel(shippingId, "usps");
//             if ((response.hasOwnProperty('status') && response.status > 203)) {
//                 return res.status(response.status).json(response);
//             }

//             console.log("Return Label Data");
//             return LRes.resOk(res, response);
//         }
//     } catch (error) {
//         console.log(error);
//         return LRes.resErr(res, 500, error);
//     }
// };