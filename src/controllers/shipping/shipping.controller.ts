import { Request, Response } from 'express';
import convert from 'convert-units';
import uniqid from 'uniqid';
import LRes from '../../lib/lresponse.lib';
import {
  DHL_ECOMMERCE,
  errorTypes,
  BILLING_TYPES,
  PITNEY_BOWES,
  FEE_BASES
} from '../../lib/constants';
import { createFlatLabel } from '../../lib/carriers/flat/flat.helper';

import Billing from '../../models/billing.model';
import Shipping from '../../models/shipping.model';
import Manifest from '../../models/manifest.model';
import User from '../../models/user.model';
import Carrier from '../../models/carrier.model';

import {
  IManifestRequest,
  IProduct,
  ILabelRequest,
  IProductResponse,
  IProductRequest,
  ILabelResponse,
  IManifestResponse,
  IManifestSummary,
  IManifestSummaryError
} from '../../types/shipping.types';
import { IBilling, IShipping } from '../../types/record.types';
import { IAccount } from '../../types/user.types';
import {
  validateMassUnit,
  validateCarrier,
  validateCarrierAccount,
  validateService,
  validateParcelType,
  validateFacility
} from '../../lib/validation';
import ShippingUtil from '../../lib/utils/shipping.utils';
import { IAdminProductRequest } from '../../types/admin.types';

/**
 * Create Shipping Label
 * @param req
 * @param res
 */
export const createShippingLabel = async (
  req: Request,
  res: Response
): Promise<any> => {
  const body: ILabelRequest = req.body;
  let carrier: string | undefined = body.carrier || undefined;
  let provider: string | undefined = body.provider || undefined;
  let service: string | undefined = body.service || undefined;
  let facility: string | undefined = body.facility || undefined;
  let parcelType: string | undefined = body.packageDetail.parcelType;
  let carrierAccount: string | undefined = body.carrierAccount || undefined;
  let account: IAccount | undefined | null = undefined;
  const weight = body.packageDetail.weight.value;
  const unitOfMeasure = body.packageDetail.weight.unitOfMeasure;

  try {
    // * Validate Client Carrier Account
    const checkValues = await validateCarrierAccount(
      carrierAccount,
      // @ts-expect-error: ignore
      req.user
    );
    carrierAccount = checkValues.carrierAccount;
    account = checkValues.account;
    // * Validate Carrier Name is Supported
    const checkedCarrier = validateCarrier(account, carrier, provider);
    carrier = checkedCarrier.carrier;
    provider = checkedCarrier.provider;
    // * Validate Service Name is Supported
    service = validateService(account, service);
    // * Validate Facility Name is Supported
    facility = validateFacility(account, facility);
    // * Validate ParcelType is Supported
    parcelType = validateParcelType(carrier, service, parcelType);
    // * Validate Weight Unit of Measure if Supported
    validateMassUnit(unitOfMeasure, carrier);
    // * Validate User Balance is above the minimum required
    // @ts-expect-error: ignore
    if (req.user.balance <= req.user.minBalance) {
      throw LRes.invalidParamsErr(
        400,
        'Insufficient balance, please contact the customer service.',
        carrier
      );
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
  const weightInOZ = convert(weight)
    // @ts-expect-error: ignore
    .from(unitOfMeasure.toLowerCase())
    .to('oz');
  // Set packageId and billingReference
  body.packageDetail.packageId = uniqid('EK');
  body.packageDetail.billingReference1 = 'Eksborder Platform';
  // @ts-expect-error: ignore
  body.packageDetail.billingReference2 = req.user.company;

  try {
    console.log('1. Check Package Price');
    let packagePrice: number | undefined = undefined;
    let priceCurrency = 'USD';
    let product: IProduct | undefined = undefined;

    const prodRequest: IProductRequest = req.body;
    prodRequest.rate = {
      calculate: true,
      currency: 'USD'
    };
    prodRequest.estimatedDeliveryDate = {
      calculate: true
    };
    const pResponse = await ShippingUtil.getProducts(
      account,
      // @ts-expect-error: ignore
      req.user,
      prodRequest,
      weightInOZ,
      carrier,
      service
    );
    if (!pResponse)
      return res
        .status(500)
        .json(
          LRes.invalidParamsErr(500, 'Failed to compute package price', carrier)
        );
    if (pResponse.hasOwnProperty('status') && pResponse.status > 203) {
      return res.status(pResponse.status).json(pResponse);
    }
    const productResponse: IProductResponse = pResponse;
    if (productResponse.products && productResponse.products.length > 0) {
      const productBody: IProduct = productResponse.products[0];

      if (productBody && productBody.rate) {
        const rate = productBody.rate;
        packagePrice = rate.amount;
        priceCurrency = rate.currency;
        product = productBody;
      } else {
        return LRes.resErr(res, 404, productBody.messages);
      }
    }

    console.log(`Package price is ${packagePrice} ${priceCurrency}`);
    if (!packagePrice)
      return res
        .status(500)
        .json(
          LRes.invalidParamsErr(500, 'Failed to compute package price', carrier)
        );

    console.log('2. Apply fee on top of the price to get total price');
    const billingType = account.billingType;
    const feeBase = account.feeBase;
    const fee = account.fee;

    let totalFee = fee;
    if (billingType === BILLING_TYPES.PROPORTION) {
      totalFee = parseFloat((packagePrice * (fee / 100)).toFixed(2));
    } else {
      if (feeBase === FEE_BASES.WEIGHT_BASED) {
        // Calculate Weight Based Fee by KG
        const weightInKG = convert(weight)
          // @ts-expect-error: ignore
          .from(unitOfMeasure.toLowerCase())
          .to('kg');
        totalFee = parseFloat((Math.ceil(weightInKG) * fee).toFixed(2));
      }
    }
    const totalCost = parseFloat((packagePrice + totalFee).toFixed(2));

    console.log('3. Check total price against user balance');
    // @ts-expect-error: ignore
    if (req.user.balance < totalCost) {
      return res
        .status(400)
        .json(
          LRes.invalidParamsErr(
            400,
            'Insufficient balance, please contact the customer service.',
            carrier
          )
        );
    }

    console.log('4. Create Shipping label and response data');
    let labelResponse: ILabelResponse | undefined = undefined;
    if (carrier === DHL_ECOMMERCE && service === 'FLAT') {
      // Crate FLAT label
      // @ts-expect-error: ignore
      labelResponse = await createFlatLabel(body, account, req.user);
    } else {
      // @ts-expect-error: ignore
      const api = await ShippingUtil.initCF(account, req.user); // TODO: refine carrier factory auth logic

      body.rate = { currency: 'USD' };

      const response = await api.label(body);
      if (response.hasOwnProperty('status') && response.status > 203) {
        return res.status(response.status).json(response);
      }
      labelResponse = response;
    }
    if (!labelResponse)
      return res
        .status(500)
        .json(LRes.invalidParamsErr(500, 'Failed to create label', carrier));

    console.log('5. Charge the fee from user balance');
    // @ts-expect-error: ignore
    const newBalance = parseFloat((req.user.balance - totalCost).toFixed(2));
    await User.findByIdAndUpdate(
      // @ts-expect-error: ignore
      { _id: req.user._id },
      { balance: newBalance },
      { runValidators: true, new: true }
    );

    console.log('6. Generate billing record');
    // @ts-expect-error: ignore
    const billingObj: IBilling = {
      // @ts-expect-error: ignore
      userRef: req.user.id,
      description: `${carrier}, ${service}, ${labelResponse.labels[0].trackingId}`,
      account: account.accountName,
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
          type:
            billingType === BILLING_TYPES.PROPORTION ? `${fee}%` : `$${fee}`,
          base: feeBase
        }
      },
      addFund: false
    };
    const createBilling = new Billing(billingObj);
    await createBilling.save();

    console.log('7. Create shipping record');
    const shippingRecord: IShipping = {
      accountName: account.accountName,
      carrier: labelResponse.carrier,
      provider: labelResponse.provider,
      service: labelResponse.service,
      facility: labelResponse.facility,
      toAddress: body.toAddress,
      shippingId: labelResponse.shippingId,
      trackingId: labelResponse.labels[0].trackingId,
      rate: totalCost,
      manifested: false,
      labels: labelResponse.labels,
      packageInfo: {
        weight: body.packageDetail.weight,
        dimension: body.packageDetail.dimension
      },
      // @ts-expect-error: ignore
      userRef: req.user.id,
      // @ts-expect-error: ignore
      billingRef: createBilling._id
    };
    await new Shipping(shippingRecord).save();

    console.log('8. Return Label Data');
    return LRes.resOk(res, labelResponse);
  } catch (err) {
    console.log('!!!ERROR!!!' + err);
    console.log(err);
    return LRes.resErr(res, 500, err);
  }
};

/**
 * Get Label from Eksborder Database
 * @param req
 * @param res
 */
export const GetLabelByShippingId = async (
  req: Request,
  res: Response
): Promise<any> => {
  const shippingId: string | undefined = req.params.shippingId || undefined;

  if (!shippingId)
    return res
      .status(400)
      .json(LRes.fieldErr('shippingId', '/', errorTypes.MISSING));

  try {
    // @ts-expect-error: ignore
    const shipping: IShipping = await Shipping.findOne({
      shippingId,
      // @ts-expect-error: ignore
      userRef: req.user._id
    });
    if (shipping) {
      const label: ILabelResponse = {
        timestamp: shipping.timestamp,
        carrier: shipping.carrier,
        provider: shipping.provider,
        service: shipping.service,
        labels: shipping.labels,
        shippingId: shipping.shippingId
      };
      console.log('Find local Label Data');
      return LRes.resOk(res, label);
    } else {
      return LRes.resErr(
        res,
        404,
        `No label found for shippingId [${shippingId}]`
      );
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
export const createManifest = async (
  req: Request,
  res: Response
): Promise<any> => {
  const body: IManifestRequest = req.body;
  let carrier: string | undefined = body.carrier || undefined;
  let provider: string | undefined = body.provider || undefined;
  let carrierAccount: string | undefined = body.carrierAccount || undefined;
  let account: IAccount | undefined | null = undefined;
  const manifests: [{ trackingIds: string[] }] = body.manifests;

  try {
    // * Validate Client Carrier Account
    const checkValues = await validateCarrierAccount(
      carrierAccount,
      // @ts-expect-error: ignore
      req.user
    );
    carrierAccount = checkValues.carrierAccount;
    account = checkValues.account;
    // * Validate Carrier Name is Supported
    const checkedCarrier = validateCarrier(account, carrier, provider);
    carrier = checkedCarrier.carrier;
    provider = checkedCarrier.provider;
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }

  if (!manifests) {
    return res
      .status(400)
      .json(LRes.fieldErr('manifests', '/', errorTypes.MISSING, carrier));
  }
  if (manifests.length < 1) {
    return res
      .status(400)
      .json(LRes.fieldErr('manifests', '/', errorTypes.EMPTY, carrier));
  }
  if (!manifests[0].trackingIds) {
    res
      .status(400)
      .json(
        LRes.fieldErr(
          'trackingIds',
          '/manifests/0/trackingIds',
          errorTypes.MISSING,
          carrier
        )
      );
  }
  if (manifests[0].trackingIds.length < 1) {
    return res
      .status(400)
      .json(
        LRes.fieldErr(
          'trackingIds',
          '/manifests/0/trackingIds',
          errorTypes.EMPTY,
          carrier
        )
      );
  }

  // make sure all tracking ids belong to the request user
  const shippings = await Shipping.find(
    // @ts-expect-error: ignore
    { trackingId: { $in: manifests[0].trackingIds }, userRef: req.user._id },
    'trackingId'
  );
  if (!shippings || shippings.length < 1) {
    return res
      .status(400)
      .json(
        LRes.fieldErr(
          'trackingIds',
          '/manifests/0/trackingIds',
          errorTypes.INVALID,
          'trackingIds',
          carrier
        )
      );
  }
  console.log(shippings);
  const newIds = shippings.map((item: IShipping) => {
    return item.trackingId;
  });
  console.log(newIds);
  body.manifests[0].trackingIds = newIds;

  try {
    // @ts-expect-error: ignore
    const api = await ShippingUtil.initCF(account, req.user);
    const response = await api.manifest(body);
    if (
      response.hasOwnProperty('status') &&
      typeof response.status !== 'string' &&
      response.status > 203
    ) {
      return res.status(response.status).json(response);
    }

    const manifestResponse: IManifestResponse = response;
    // @ts-expect-error: ignore
    manifestResponse.userRef = req.user._id;
    manifestResponse.trackingIds = manifests[0].trackingIds;
    if (carrier === PITNEY_BOWES) {
      manifestResponse.status = 'COMPLETED';
    }
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
export const downloadManifest = async (
  req: Request,
  res: Response
): Promise<any> => {
  const requestId: string | undefined = req.params.requestId || undefined;
  let carrierAccount: string | undefined =
    req.params.carrierAccount || undefined;
  let account: IAccount | undefined | null = undefined;

  if (!requestId) {
    return res
      .status(400)
      .json(LRes.fieldErr('requestId', '/', errorTypes.MISSING));
  }
  try {
    const checkValues = await validateCarrierAccount(
      carrierAccount,
      // @ts-expect-error: ignore
      req.user
    );
    carrierAccount = checkValues.carrierAccount;
    account = checkValues.account;
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }

  try {
    // check if data is available in the system
    const manifest = await Manifest.findOne(
      // @ts-expect-error: ignore
      { requestId: requestId, userRef: req.user._id }
    );
    if (!manifest)
      return LRes.resErr(
        res,
        404,
        `No manifest found with requiredId [${requestId}], please create manifest first`
      );
    if (manifest.status === 'COMPLETED') return LRes.resOk(res, manifest);

    // request latest manifest data from carrier
    // @ts-expect-error: ignore
    const api = await ShippingUtil.initCF(account, req.user);
    const response = await api.getManifest(requestId);
    if (
      response.hasOwnProperty('status') &&
      typeof response.status !== 'string' &&
      response.status > 203
    ) {
      return res.status(response.status).json(response);
    }
    // update local manifest data
    const manifestResponse: IManifestResponse = response;
    // @ts-expect-error: ignore
    manifestResponse.userRef = req.user._id;

    const updatedManifest = await Manifest.findOneAndUpdate(
      // @ts-expect-error: ignore
      { requestId: requestId, userRef: req.user._id },
      manifestResponse,
      { new: true }
    );

    // if the manifest is completed update shipping records
    if (updatedManifest && updatedManifest.status === 'COMPLETED') {
      console.log('start to check for tracking ids');
      let trackingIds: string[] | undefined = updatedManifest.trackingIds;
      console.log(trackingIds);
      if (trackingIds) {
        const summary: IManifestSummary | undefined =
          updatedManifest.manifestSummary;
        if (summary) {
          const invalidTrackingIds: IManifestSummaryError[] | undefined =
            summary.invalid.trackingIds;
          if (invalidTrackingIds) {
            console.log('Find summary');
            console.log(invalidTrackingIds);
            const invalidIds = invalidTrackingIds.map(
              (item: IManifestSummaryError) => {
                return item.trackingId;
              }
            );
            console.log(invalidIds);
            trackingIds = trackingIds.filter((item: string) => {
              return invalidIds.includes(item) === false;
            });
            console.log(trackingIds);
          }
        }
        console.log('Updating');
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
//         // @ts-expect-error: ignore
//         const checkValues = await this.validateCarrierAccount(carrierAccount, req.user);
//         carrierAccount = checkValues.carrierAccount;
//         account = checkValues.account;
//     } catch (error) {
//         console.log(error);
//         return res.status(400).send(error);
//     }

//     try {
//         // first try to find the label data from local
//         // @ts-expect-error: ignore
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
//             // @ts-expect-error: ignore
//             const cf = await this.initCF(account, req.user._id);
//             // @ts-expect-error: ignore
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

//************************************************************//
//************** Get USPS Shipping Rules API *****************//
//************************************************************//
// public rules: any = async (req: Request, res: Response) => {
//   // build account for admin
//   const carrierRef = await Carrier.findOne({ carrierName: PITNEY_BOWES });
//   // @ts-expect-error: ignore
//   const account = ShippingUtil.buildIAccountForAdmin(carrierRef!, req.user);

//   try {
//     // @ts-expect-error: ignore
//     const api = await ShippingUtil.initCF(account, req.user);
//     const response = await api.rules('USPS', 'US', 'US');
//     return LRes.resOk(res, response);
//   } catch (error) {
//     console.log(error);
//     return LRes.resErr(res, 500, error);
//   }
// };

//************************************************************//
//**************** Get Carrier Products API ******************//
//************************************************************//
// public products: any = async (req: Request, res: Response) => {
//   const body: IAdminProductRequest = req.body;
//   let carrier: string | undefined = body.carrier || undefined;
//   let provider: string | undefined = body.provider || undefined;
//   const service: string | undefined = body.service || undefined;
//   const weight = body.packageDetail.weight.value;
//   const unitOfMeasure = body.packageDetail.weight.unitOfMeasure;

//   try {
//     const checkedCarrier = validateCarrier(carrier, provider);
//     carrier = checkedCarrier.carrier;
//     provider = checkedCarrier.provider;
//     validateMassUnit(unitOfMeasure, carrier);
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json(error);
//   }

//   const weightInOZ = convert(weight)
//     // @ts-expect-error: ignore
//     .from(unitOfMeasure.toLowerCase())
//     .to('oz');
//   // Set packageId and billingReference
//   body.packageDetail.packageId =
//     'EK-' + Date.now() + Math.round(Math.random() * 1000000).toString();
//   // @ts-expect-error: ignore
//   body.packageDetail.billingReference1 = req.user.company;

//   // build account for admin
//   const carrierRef = await Carrier.findOne({ carrierName: carrier });

//   const account = ShippingUtil.buildIAccountForAdmin(
//     carrierRef!,
//     // @ts-expect-error: ignore
//     req.user,
//     body.pickup,
//     body.distributionCenter
//   );
//   // build IProductRequest
//   const productRequest = ShippingUtil.buildIProductRequestForAdmin(body);

//   try {
//     const response = await ShippingUtil.getProducts(
//       account,
//       // @ts-expect-error: ignore
//       req.user,
//       productRequest,
//       weightInOZ,
//       carrier,
//       service
//     );
//     if (!response)
//       return res
//         .status(500)
//         .json(
//           LRes.invalidParamsErr(
//             500,
//             'Failed to compute package price',
//             carrier
//           )
//         );
//     if (response.hasOwnProperty('status') && response.status > 203) {
//       return res.status(response.status).json(response);
//     }
//     return LRes.resOk(res, response);
//   } catch (err) {
//     console.log('!!!PRODUCT ERROR!!!' + err);
//     console.log(err);
//     return LRes.resErr(res, 500, err);
//   }
// };
