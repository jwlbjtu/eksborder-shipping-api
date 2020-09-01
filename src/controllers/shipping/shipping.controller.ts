import * as express from "express";
import {NextFunction, Request, Response} from "express";
import convert from "convert-units";
import LRes from "../../lib/lresponse.lib";
import AuthController from "../auth/auth.controller"

import CarrierFactory from "../../lib/carrier.factory";
import IControllerBase from "../../interfaces/IControllerBase.interface";
import ICarrierAPI from "../../lib/carriers/ICarrierAPI.interface";
import HelperLib from "../../lib/helper.lib";
import { DHL_ECOMMERCE, DHL_FLAT_PRICES, massUnits, errorTypes, BILLING_TYPES } from "../../lib/carriers/constants";
import { createFlatLabel } from "../../lib/carriers/flat/flat.helper";
import { IManifestRequest } from "../../types/shipping.types";

import Billing, {IBilling} from "../../models/billing.model";
import Shipping, {IShipping} from "../../models/shipping.model";
import Manifest, {IManifest} from "../../models/manifest.model";
import User, {IUser} from "../../models/user.model";

class ShippingController implements IControllerBase, ICarrierAPI {
    public path = "/shipping";
    public router = express.Router();
    private authJwt: AuthController = new AuthController();
    private cf: CarrierFactory | null = null;

    private carriersType: Array<string> = [];
    private account: Array<string> = [];

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.post(this.path + "/products/:type", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin_super"), this.products);
        this.router.post(this.path + "/label", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.label);
        this.router.get(this.path + "/label/:type/:packageId/:dhlPackageId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getLabel);
        this.router.post(this.path + "/manifest", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.manifest);
        this.router.get(this.path + "/manifest/:carrierAccount/:requestId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getManifest);
    }

    // private auth: any = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const cfAuth = await this.initCF(req, req,);
    //         return LRes.resOk(res, cfAuth);
    //     } catch (err) {
    //         return LRes.resErr(res, 401, err)
    //     }
    // };

    private initCF: CarrierFactory | any = async (req: Request, res: Response) => {
        const accountName: string = req.body.carrierAccount;
        this.carriersType = await HelperLib.getCarrierType();
        this.account = await HelperLib.getCurrentUserAccount(accountName, req.user);
        // @ts-ignore
        if (accountName !== undefined && accountName.length > 0 && this.account !== null && accountName == this.account.accountName && this.carriersType.includes(this.account.carrierRef.accountCode)) {
            // @ts-ignore
            this.cf = new CarrierFactory(this.account.carrierRef.accountCode, {user: req.user, account: this.account});
            // @ts-ignore
            return  await this.cf.auth();
        } else {
            return LRes.resErr(res, 400, "Invalid carrier account");
        }
    };

    public products: any = async (req: Request, res: Response) => {

        const body = req.body;

        try {
            await this.initCF(req, res);
            // @ts-ignore
            const cfFind = await this.cf.products(body);
            if (cfFind.hasOwnProperty('messages') || (cfFind.hasOwnProperty('status') && cfFind.status > 203)) {
                return LRes.resErr(res, cfFind.status, cfFind.messages);
            }
            return LRes.resOk(res, cfFind);

        } catch (err) {
            return LRes.resErr(res, 401, err);
        }
    };

    /**
     * Create Shipping Label
     * @param req 
     * @param res 
     */
    public label: any = async (req: Request, res: Response) => {
        const body = req.body;
        const carrier: string | null = body.carrier || null;
        const service: string | null = body.service || null;
        const carrierAccount: string | null = body.carrierAccount || null;

        if(!carrier) return res.status(400).json(LRes.fieldErr("carrier", "/", errorTypes.MISSING));
        if(!service) return res.status(400).json(LRes.fieldErr("service", "/", errorTypes.MISSING, carrier));
        if(!carrierAccount) return res.status(400).json(LRes.fieldErr("carrierAccount", "/", errorTypes.MISSING,carrier));

        try {
            // 1. Check Package Price
            let packagePrice: number | undefined = undefined;
            let priceCurrency: string | undefined = undefined;
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

                const weightInOZ = convert(weight).from(unitOfMeasure.toLowerCase()).to("oz");
                packagePrice = DHL_FLAT_PRICES[Math.ceil(weightInOZ).toString()];
                priceCurrency = "USD";
            } else {
                // Check price from Carrier Product Finder
                await this.initCF(req, res); // TODO: refine carrier factory auth logic
                // @ts-ignore
                const productResponse = await this.cf.products(body);
                if (productResponse.hasOwnProperty('messages') || (productResponse.hasOwnProperty('status') && productResponse.status > 203)) {
                    return res.status(productResponse.status).json(productResponse);
                }
                if (productResponse.hasOwnProperty('products') && productResponse.products.length > 0) {
                    const product = productResponse.products[0];

                    if(product.hasOwnProperty("rate")) {
                        const rate = product.rate;
                        packagePrice = rate.amonut;
                        priceCurrency = rate.currency;
                    } else {
                        return LRes.resErr(res, 404, product.messages);
                    }
                }
            }
            console.log(packagePrice);
            if(!packagePrice) return res.status(500).json(LRes.invalidParamsErr(500, "Failed to compute package price", carrier));

            // 2. Apply fee on top of the price to get total price
            // @ts-ignore
            const billingType = this.account.billingType;
            // @ts-ignore
            const fee = this.account.fee;

            let totalCost = packagePrice;
            if (billingType === BILLING_TYPES.AMOUNT) {
                totalCost = parseFloat(totalCost + fee);
            } else if (billingType === BILLING_TYPES.PROPORTION) {
                const procAmount: number = parseFloat((totalCost * (1 + (fee / 100))).toFixed(2));
                totalCost = totalCost + procAmount;
            }

            // 3. Check total price against user balance
            // @ts-ignore
            if (req.user.balance < totalCost) return res.status(400).json(LRes.invalidParamsErr(400, "Insufficient balance, please contact the customer service.", carrier));

            // 4. Create Shipping label and response data
            let labelResponse = undefined;
            if(carrier === DHL_ECOMMERCE && service === "FLAT") {
                // Crate FLAT label
                const account = await HelperLib.getCurrentUserAccount(carrierAccount, req.user);
                labelResponse = await createFlatLabel(body, account, req.user);
            } else {
                // @ts-ignore
                labelResponse = await this.cf.label(body);
                if ((labelResponse.hasOwnProperty('status') && labelResponse.status > 203)) {
                    return res.status(labelResponse.status).json(labelResponse);
                }
            }
            if(!labelResponse) return res.status(500).json(LRes.invalidParamsErr(500, "Failed to create label", carrier));
            
            // 5. Charge the fee from user balance
            // @ts-ignore
            const newBalance = req.user.balance - totalCost;
            await User.findByIdAndUpdate(
                // @ts-ignore
                {_id: req.user._id},
                // @ts-ignore
                {balance: newBalance},
                {runValidators: true, new: true}
            );
                        
            // 6. Create shipping record
            // @ts-ignore
            const shippingRecord = await Shipping.findOne({
                callType: "label",
                // @ts-ignore
                userRef: req.user._id,
                isError: false,
                // @ts-ignore
                "response.pickup": this.account.pickupRef.pickupAccount
            }).sort('-createdAt');

            // 7. Generate billing record
            // @ts-ignore
            const billingObj: IBilling = {
                // @ts-ignore
                shippingRef: shippingRecord._id,
                // @ts-ignore
                accountRef: this.account._id,
                // @ts-ignore
                userRef: req.user._id,
                shippingCost: packagePrice,
                // @ts-ignore
                billingType: billingType,
                // @ts-ignore
                fee: fee,
                total: totalCost,
                // @ts-ignore
                currency: priceCurrency
            };
            const createBilling = new Billing(billingObj);
            await createBilling.save();
            
            // 8. Return Label Data
            return LRes.resOk(res, labelResponse);
        } catch (err) {
            console.log("!!!ERROR!!!" + err);
            return LRes.resErr(res, 500, err);
        }
    };

    public getLabel: any = async (req: Request, res: Response) => {
        const _packageId: string | null = req.params.packageId || null;
        const _dhlPackageId: string | null = req.params.dhlPackageId || null;

        if (_packageId !== null && _dhlPackageId !== null ) {
            await this.initCF(req, res);

            await Shipping.findOne({
                callType: "label",
                // @ts-ignore
                userRef: req.user._id,
                isError: false,
                "response.labels.packageId": _packageId,
                "response.labels.dhlPackageId": _dhlPackageId,
            }).then(async (lData) => {
                if (!lData) {
                    try {
                        // @ts-ignore
                        const cfLabel = await this.cf.getLabel(_packageId, _dhlPackageId);
                        if (cfLabel.hasOwnProperty('messages') || (cfLabel.hasOwnProperty('status') && cfLabel.status > 203)) {
                            return LRes.resErr(res, cfLabel.status, cfLabel.messages);
                        }
                        return LRes.resOk(res, cfLabel);

                    } catch (err) {
                        return LRes.resErr(res, 401, err);
                    }
                } else {
                    delete lData.response.labels[0].packageId;
                    delete lData.response.labels[0].dhlPackageId;
                    delete lData.response.labels[0].link;
                    delete lData.response.labels[0].labelDetail;
                    return LRes.resOk(res, lData.response);
                }
            }).catch(async (err: Error) => {
                console.log(err);
                return LRes.resErr(res, 401, err);
            });

        } else {
            return LRes.resErr(res, 404, "not enough parameters");
        }

    };

    /**
     * Reqiest Manifest from Carrier
     * @param req 
     * @param res 
     */
    public manifest: any = async (req: Request, res: Response) => {
        const body: IManifestRequest = req.body;
        const carrier: string | null = body.carrier || null;
        const carrierAccount: string | null = body.carrierAccount || null;
        const manifests: [{ trackingIds: [string] }] = body.manifests;

        if(!carrier) return res.status(400).json(LRes.fieldErr("carrier", "/", errorTypes.MISSING));
        if(!carrierAccount) return res.status(400).json(LRes.fieldErr("carrierAccount", "/", errorTypes.MISSING, carrier));
        if(!manifests) return res.status(400).json(LRes.fieldErr("manifests", "/", errorTypes.MISSING, carrier));
        if(manifests.length < 1) return res.status(400).json(LRes.fieldErr("manifests", "/", errorTypes.EMPTY, carrier));
        if(!manifests[0].trackingIds) res.status(400).json(LRes.fieldErr("trackingIds", "/manifests/0/trackingIds", errorTypes.MISSING, carrier));
        if(manifests[0].trackingIds.length < 1) return res.status(400).json(LRes.fieldErr("trackingIds", "/manifests/0/trackingIds", errorTypes.EMPTY, carrier));

        try {
            await this.initCF(req, res);
            // @ts-ignore
            const cfManifest = await this.cf.manifest(body);
            if ((cfManifest.hasOwnProperty('status') && cfManifest.status > 203)) {
                return res.status(cfManifest.status).json(cfManifest);
            }
            // TODO: save manifest response data into database
            return LRes.resOk(res, cfManifest);

        } catch (err) {
            return LRes.resErr(res, 500, err);
        }
    };

    /**
     * Download Manifest from Carrier
     * @param req 
     * @param res 
     */
    public getManifest: any = async (req: Request, res: Response) => {
        const _requestId: string | null = req.params.requestId || null;
        const carrierAccount: string | null = req.params.carrierAccount || null;

        if(!_requestId) return res.status(400).json(LRes.fieldErr("requestId", "/", errorTypes.MISSING));
        if(!carrierAccount) return res.status(400).json(LRes.fieldErr("carrierAccount", "/", errorTypes.MISSING));

        req.body.carrierAccount = carrierAccount;

        try {
            // TODO : Check local data before send to Carrier
            const manifest = await Manifest.findOne(
                {
                    callType: "manifest",
                    // @ts-ignore
                    userRef: req.user._id,
                    isError: false,
                    "response.requestId": _requestId,
                }
            );
            // TODO: check for manifest status is not COMPLETE then require from carrier
            await this.initCF(req, res);
            // @ts-ignore
            const cfManifest = await this.cf.getManifest(_requestId);
            if ((cfManifest.hasOwnProperty('status') && cfManifest.status > 203)) {
                return LRes.resErr(res, cfManifest.status, "cfManifest.messages");
            }
            // TODO: save manifest data into database
            return LRes.resOk(res, cfManifest);

        } catch (err) {
            return LRes.resErr(res, 500, err);
        }
    };
}

export default ShippingController;
