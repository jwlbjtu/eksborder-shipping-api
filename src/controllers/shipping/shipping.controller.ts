import * as express from "express";
import {NextFunction, Request, Response} from "express";
import LRes from "../../lib/lresponse.lib";
import AuthController from "../auth/auth.controller"

import CarrierFactory from "../../lib/carrier.factory";
import IControllerBase from "../../interfaces/IControllerBase.interface";
import ICarrierAPI from "../../lib/carriers/ICarrierAPI.interface";
import HelperLib from "../../lib/helper.lib";

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
        this.router.post(this.path + "/products/:type", this.authJwt.authenticateJWT, this.authJwt.checkRole("admin"), this.products);
        this.router.post(this.path + "/label/:type/:format", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.label);
        this.router.get(this.path + "/label/:type/:packageId/:dhlPackageId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getLabel);
        this.router.post(this.path + "/manifest/:type", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.manifest);
        this.router.get(this.path + "/manifest/:type/:requestId", this.authJwt.authenticateJWT, this.authJwt.checkRole("customer"), this.getManifest);
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
        const _type: string = req.params.type;
        this.carriersType = await HelperLib.getCarrierType();
        this.account = await HelperLib.getCurrentUserAccount(_type, req.user);
        // @ts-ignore
        if (_type !== undefined && _type.length > 0 && this.account !== null && _type == this.account.accountName && this.carriersType.includes(this.account.carrierRef.accountCode)) {
            // @ts-ignore
            this.cf = new CarrierFactory(this.account.carrierRef.accountCode, {user: req.user, account: this.account});
            // @ts-ignore
            return  await this.cf.auth();
        } else {
            return LRes.resErr(res, 401, "Bead type of carrier");
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

    public label: any = async (req: Request, res: Response) => {
        const body = req.body;
        const _type: string | null = req.params.type || null;
        const _format: string | null = req.params.format || null;

        if (_type !== null && _format !== null ) {

            try {
                await this.initCF(req, res);

                const findBody = {
                    consigneeAddress: body.consigneeAddress,
                    packageDetail: body.packageDetail
                }
                findBody.packageDetail.packageId = "EK";
                // @ts-ignore
                const cfFind = await this.cf.products(findBody);
                if (cfFind.hasOwnProperty('messages') || (cfFind.hasOwnProperty('status') && cfFind.status > 203)) {
                    return LRes.resErr(res, cfFind.status, cfFind.messages + " " + cfFind.data.title);
                }

                // @ts-ignore
                const billingObj: IBilling = {
                    shippingRef: {},
                    // @ts-ignore
                    accountRef: this.account._id,
                    // @ts-ignore
                    userRef: req.user._id,
                    shippingCost: 0,
                    // @ts-ignore
                    billingType: this.account.billingType,
                    // @ts-ignore
                    fee: this.account.fee,
                    total: 0
                };

                if (cfFind.hasOwnProperty('packageDetail') && cfFind.packageDetail.hasOwnProperty('shippingCost') && cfFind.packageDetail.shippingCost.hasOwnProperty('freight')) {
                    billingObj.shippingCost = cfFind.packageDetail.shippingCost.freight;
                    if (billingObj.billingType === "amount") {
                        billingObj.total = parseFloat(cfFind.packageDetail.shippingCost.freight + billingObj.fee);
                    } else if (billingObj.billingType === "proportions") {
                        let procAmount: number = parseFloat((((cfFind.packageDetail.shippingCost.freight*billingObj.fee) / 100)).toFixed(2));
                        billingObj.total = cfFind.packageDetail.shippingCost.freight + procAmount;
                    }
                }

                // @ts-ignore
                if (req.user.balance >= billingObj.total) {
                    // @ts-ignore
                    const cfLabel = await this.cf.label(body, _format);
                    if (cfLabel.hasOwnProperty('messages') || (cfLabel.hasOwnProperty('status') && cfLabel.status > 203)) {
                        return LRes.resErr(res, cfLabel.status, cfLabel.messages);
                    }

                    await Shipping.findOne({
                            callType: "label",
                            // @ts-ignore
                            userRef: req.user._id,
                            isError: false,
                            // @ts-ignore
                            "response.pickup": this.account.pickupRef.pickupAccount
                        }
                    ).sort('-createdAt')
                        .then(async (res) => {
                            if (res) {
                                billingObj.shippingRef = res._id;

                                await User.findByIdAndUpdate(
                                    // @ts-ignore
                                    {_id: req.user._id},
                                    // @ts-ignore
                                    {balance: (req.user.balance - billingObj.total)},
                                    {runValidators: true, new: true});

                            }
                        });

                    const createBilling = new Billing(billingObj);
                    await createBilling.save();

                    return LRes.resOk(res, cfLabel);
                }



            } catch (err) {
                return LRes.resErr(res, 401, err);
            }

        } else {
            return LRes.resErr(res, 404, "not enough parameters");
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

    public manifest: any = async (req: Request, res: Response) => {
        const body = req.body;
        const _type: string | null = req.params.type || null;

        if (_type !== null) {

            try {
                await this.initCF(req, res);
                // @ts-ignore
                const cfManifest = await this.cf.manifest(body);
                if (cfManifest.hasOwnProperty('messages') || (cfManifest.hasOwnProperty('status') && cfManifest.status > 203)) {
                    return LRes.resErr(res, cfManifest.status, cfManifest.messages);
                }
                return LRes.resOk(res, cfManifest);

            } catch (err) {
                return LRes.resErr(res, 401, err);
            }
        } else {
            return LRes.resErr(res, 404, "not enough parameters");
        }
    };

    public getManifest: any = async (req: Request, res: Response) => {
        const _requestId: string | null = req.params.requestId || null;

        if (_requestId !== null ) {
            await this.initCF(req, res);
            await Manifest.findOne(
                {
                    callType: "manifest",
                    // @ts-ignore
                    userRef: req.user._id,
                    isError: false,
                    "response.requestId": _requestId,
                }
            ).then(async (lData) => {
                if (!lData) {
                    try {

                        // @ts-ignore
                        const cfManifest = await this.cf.getManifest(_requestId);
                        if (cfManifest.hasOwnProperty('messages') || (cfManifest.hasOwnProperty('status') && cfManifest.status > 203)) {
                            return LRes.resErr(res, cfManifest.status, cfManifest.messages);
                        }
                        return LRes.resOk(res, cfManifest);

                    } catch (err) {
                        return LRes.resErr(res, 401, err);
                    }
                } else {
                    // @ts-ignore
                    lData.response.carrier = this.account.carrierRef.accountName;
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
}

export default ShippingController;
