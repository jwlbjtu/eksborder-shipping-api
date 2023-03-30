import { Request, Response } from 'express';
import convert from 'convert-units';
import LRes from '../../lib/lresponse.lib';
import {
  CARRIERS,
  Currency,
  DistanceUnit,
  errorTypes,
  ShipmentStatus,
  WeightUnit
} from '../../lib/constants';
import BillingSchema from '../../models/billing.model';
import ShipmentSchema from '../../models/shipping.model';
import ManifestSchema from '../../models/manifest.model';
import ClientCarrierSchema from '../../models/account.model';
import {
  IManifestRequest,
  ILabelRequest,
  ILabelResponse,
  IManifestResponse
} from '../../types/shipping.types';
import { IBilling, ShipmentData } from '../../types/record.types';
import { IAccount, IUser } from '../../types/user.types';
import {
  validateWeight,
  validateCarrierAccount,
  validateService,
  validateFacility,
  validateDimensions
} from '../../lib/validation';
import { logger } from '../../lib/logger';
import IdGenerator from '../../lib/utils/IdGenerator';
import {
  checkCustomService,
  isShipmentInternational,
  validateShipment
} from '../../lib/carriers/carrier.helper';
import CarrierFactory from '../../lib/carriers/carrier.factory';
import { computeFee, roundToTwoDecimal } from '../../lib/utils/helpers';
import { IManifestObj } from '../../types/shipping.types';

/**
 * Create Shipping Label API
 * @param req
 * @param res
 */
export const createShippingLabel = async (
  req: Request,
  res: Response
): Promise<any> => {
  const body = req.body as ILabelRequest;
  console.log(body);
  const user = req.user as IUser;
  let carrier: string | undefined = undefined;
  const provider: string | undefined = body.provider || undefined;
  let service: string | undefined = body.service || undefined;
  let facility: string | undefined = body.facility || undefined;
  //const parcelType: string | undefined = body.packageDetail.parcelType;
  let carrierAccount: string | undefined = body.carrierAccount || undefined;
  let account: IAccount | undefined | null = undefined;
  const weight = body.packageDetail.weight.value;
  const unitOfMeasure = body.packageDetail.weight.unitOfMeasure;
  const dimension = body.packageDetail.dimension;

  try {
    // * Validate Client Carrier Account
    const checkValues = await validateCarrierAccount(carrierAccount, user);
    carrierAccount = checkValues.carrierAccount;
    account = checkValues.account;
    carrier = account.carrier;
    // * Validate Service Name is Supported
    service = validateService(account, service);
    // * Validate Facility Name is Supported
    facility = validateFacility(account, facility);
    // * Validate ParcelType is Supported
    // parcelType = validateParcelType(carrier, service, parcelType);
    // * Validate Weight Unit of Measure is Supported
    validateWeight(weight, unitOfMeasure, carrier);
    validateDimensions(dimension, carrier);
    // * Validate User Balance is above the minimum required
    // TODO: 2023 add flag to skip this validation
    if (!body.test && user.balance <= user.minBalance) {
      throw LRes.invalidParamsErr(400, '用户余额低于限定额度', carrier);
    }
    if (user.uploading) {
      res.status(400).json({ message: '正在处理上传任务，请稍后再试' });
      return;
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }

  try {
    logger.info('1. Create Shipment');
    const fromAddress = body.fromAddress;
    const toAddress = body.toAddress;
    if (!fromAddress) {
      throw LRes.invalidParamsErr(400, 'fromAddress is required.', carrier);
    }
    const shipmentData: ShipmentData = {
      orderId: `${user.userName
        .substring(0, 2)
        .toUpperCase()}${await IdGenerator.generateId(user.userName)}`,
      accountName: account.accountName,
      carrierAccount: account.accountId,
      carrier: account.carrier,
      service: account.services.find((ele) => ele.name === service)!,
      facility: facility,
      sender: {
        name: fromAddress.name,
        company: fromAddress.companyName,
        street1: fromAddress.street1,
        street2: fromAddress.street2,
        city: fromAddress.city,
        state: fromAddress.state,
        country: fromAddress.country,
        zip: fromAddress.postalCode,
        phone: fromAddress.phone
      },
      toAddress: {
        name: toAddress.name,
        company: toAddress.companyName,
        street1: toAddress.street1,
        street2: toAddress.street2,
        city: toAddress.city,
        state: toAddress.state,
        country: toAddress.country,
        zip: toAddress.postalCode,
        phone: toAddress.phone
      },
      return: {
        name: fromAddress.name,
        company: fromAddress.companyName,
        street1: fromAddress.street1,
        street2: fromAddress.street2,
        city: fromAddress.city,
        state: fromAddress.state,
        country: fromAddress.country,
        zip: fromAddress.postalCode,
        phone: fromAddress.phone
      },
      shipmentOptions: {
        shipmentDate: new Date()
      },
      packageInfo: {
        packageType: 'PKG',
        weight: {
          value: convert(weight)
            .from(unitOfMeasure.toLowerCase() as WeightUnit)
            .to(WeightUnit.LB),
          unitOfMeasure: WeightUnit.LB
        },
        dimentions: {
          length: convert(dimension?.length)
            .from(dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
            .to(DistanceUnit.IN),
          width: convert(dimension?.width)
            .from(dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
            .to(DistanceUnit.IN),
          height: convert(dimension?.height)
            .from(dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
            .to(DistanceUnit.IN),
          unitOfMeasure: DistanceUnit.IN
        }
      },
      morePackages: [],
      status: ShipmentStatus.PENDING,
      manifested: false,
      userRef: user._id
    };
    let shipping = new ShipmentSchema(shipmentData);
    shipping = await shipping.save();

    // Check if Custom Service is Used
    const checkResult = await checkCustomService(shipping, account);
    if (checkResult) {
      if (typeof checkResult === 'string') {
        res.status(400).json({ message: checkResult });
        return;
      }
      shipping.service!.name = checkResult.name;
      shipping.service!.key = checkResult.code;
    }

    const valiResult = validateShipment(shipping, account);
    if (valiResult) {
      res.status(400).json({ message: valiResult });
    }
    const api = CarrierFactory.getCarrierAPI(
      account,
      body.test,
      shipping.facility
    );
    if (api) {
      await api.init();
      //***** TODO: 2023 START-1 add flag to skip search price *****/
      logger.info('2. Check Package Price');
      const result = await api.products(
        shipping,
        isShipmentInternational(shipping)
      );
      if (typeof result === 'string') {
        res.status(400).json({ message: result });
        return;
      } else if (result.errors && result.errors.length > 0) {
        res.status(500).json({ message: result.errors[0] });
        return;
      } else {
        const rate = result.rates[0];
        if (rate.rate && rate.currency) {
          logger.info('3. Apply fee on top of the price to get total price');
          const fee = computeFee(
            shipping,
            rate.rate,
            rate.currency,
            account.rates
          );
          const totalRate = roundToTwoDecimal(rate.rate + fee);
          logger.info('4. Check total price against user balance');
          if (!rate.isTest && user.balance < totalRate) {
            res.status(400).json({ message: '余额不足' });
            return;
          }
          //***** TODO: 2023 END-1 add flag to skip search price *****/
          logger.info('5. Create Shipping label and response data');
          const labelResponse = await api.label(shipping, rate);
          const labels = labelResponse.labels;
          const forms = labelResponse.forms;
          if (!rate.isTest) {
            logger.info('6. Charge the fee from user balance');
            //***** TODO: 2023 START-2 add flag to skip charge fee *****/
            const newBalance = roundToTwoDecimal(user.balance - totalRate);
            user.balance = newBalance;
            await user.save();
            //***** TODO: 2023 END-2 add flag to skip charge fee *****/
            logger.info('7. Generate billing record');
            // @ts-expect-error: ignore
            const billingObj: IBilling = {
              userRef: user._id,
              description: `${rate.carrier}, ${rate.service}, ${labels[0].tracking}`,
              account: account.accountName,
              total: totalRate,
              balance: newBalance,
              currency: rate.currency || Currency.USD,
              details: {
                shippingCost: {
                  amount: rate.rate,
                  currency: rate.currency || Currency.USD
                },
                fee: {
                  amount: fee,
                  currency: rate.currency || Currency.USD
                }
              },
              addFund: false
            };
            await new BillingSchema(billingObj).save();
          }
          logger.info('8. Update shipment record');
          if (!shipping.labels) shipping.labels = [];
          const newLabels = shipping.labels.concat(labels);
          shipping.labels = newLabels;
          if (forms) {
            if (!shipping.forms) shipping.forms = [];
            const newForms = shipping.forms.concat(forms);
            shipping.forms = newForms;
          }
          shipping.trackingId = labels[0].tracking;
          if (!body.test) {
            shipping.status = ShipmentStatus.FULFILLED;
            shipping.rate = {
              amount: totalRate,
              currency: rate.currency || Currency.USD
            };
          }
          await shipping.save();
          logger.info('9. Return Label Data');
          const labelResult: ILabelResponse = {
            timestamp: new Date(),
            carrier: shipping.carrier!,
            service: shipping.service!.name,
            facility: shipping.facility,
            carrierAccount: shipping.carrierAccount!,
            labels: shipping.labels.map((ele) => {
              return {
                createdOn: new Date(),
                trackingId: ele.tracking,
                labelData: ele.data,
                encodeType: ele.encodeType,
                format: ele.format
              };
            }),
            shippingId: shipping.trackingId,
            ref: body.ref
          };
          return LRes.resOk(res, labelResult);
        } else {
          res.status(400).json({ message: '获取邮寄费失败' });
          return;
        }
      }
    } else {
      res.status(500).json({ message: 'Failed to create carrier api' });
      return;
    }
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
  const user = req.user as IUser;
  const shippingId: string | undefined = req.params.shippingId || undefined;

  if (!shippingId)
    return res
      .status(400)
      .json(LRes.fieldErr('shippingId', '/', errorTypes.MISSING));

  try {
    const shipping = await ShipmentSchema.findOne({
      trackingId: shippingId,
      userRef: user._id
    });
    if (shipping && shipping.labels) {
      const labelResult: ILabelResponse = {
        timestamp: shipping.createdAt,
        carrier: shipping.carrier!,
        service: shipping.service!.name,
        facility: shipping.facility,
        carrierAccount: shipping.carrierAccount!,
        labels: shipping.labels.map((ele) => {
          return {
            createdOn: shipping.createdAt,
            trackingId: ele.tracking,
            labelData: ele.data,
            encodeType: ele.encodeType,
            format: ele.format
          };
        }),
        shippingId: shipping.trackingId
      };
      return LRes.resOk(res, labelResult);
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
  const user = req.user as IUser;
  const body: IManifestRequest = req.body;
  let carrier: string | undefined = body.carrier || undefined;
  const provider: string | undefined = body.provider || undefined;
  let carrierAccount: string | undefined = body.carrierAccount || undefined;
  let facility: string | undefined = body.facility || undefined;
  let account: IAccount | undefined | null = undefined;
  const manifests: [{ trackingIds: string[] }] = body.manifests;

  try {
    // * Validate Client Carrier Account
    const checkValues = await validateCarrierAccount(carrierAccount, user);
    carrierAccount = checkValues.carrierAccount;
    account = checkValues.account;
    carrier = account.carrier;
    // * Validate Facility Name is Supported
    facility = validateFacility(account, facility);
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
  const shippings = await ShipmentSchema.find({
    trackingId: { $in: manifests[0].trackingIds },
    userRef: user._id,
    manifested: false
  });
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

  try {
    const api = CarrierFactory.getCarrierAPI(account, body.test, facility);
    if (api && api.createManifest) {
      await api.init();
      const results = await api.createManifest(shippings, user);
      results.forEach((ele) => {
        ele.userRef = user._id;
        ele.facility = facility;
        return ele;
      });
      const mSave = results.map((ele) => {
        const manifest = new ManifestSchema(ele);
        return manifest.save();
      });

      await Promise.all(mSave);
      if (!body.test) {
        await ShipmentSchema.updateMany(
          { trackingId: { $in: manifests[0].trackingIds } },
          { $set: { manifested: true } }
        );
      }

      const mData = results[0];
      const manifestResponse: IManifestResponse = {
        timestamp: mData.timestamp!,
        carrier: mData.carrier,
        carrierAccount: account.accountId,
        facility: facility,
        requestId: mData.requestId!,
        manifests: mData.manifests.map((ele) => {
          const mObj: IManifestObj = {
            createdOn: ele.createdOn!,
            manifestId: ele.manifestId,
            total: manifests[0].trackingIds.length,
            manifestData: ele.manifestData,
            encodeType: ele.encodeType,
            format: ele.format
          };
          return mObj;
        }),
        trackingIds: manifests[0].trackingIds
      };
      return LRes.resOk(res, manifestResponse);
    } else {
      return LRes.resErr(res, 400, 'No carrier api found');
    }
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
  const user = req.user as IUser;
  const requestId: string | undefined = req.params.requestId || undefined;
  let carrierAccount: string | undefined =
    req.params.carrierAccount || undefined;
  let account: IAccount | undefined | null = undefined;
  let facility: string | undefined = req.params.facility || undefined;
  const test: boolean = req.params.test === 'true';
  console.log(test);
  console.log(typeof test);

  if (!requestId) {
    return res
      .status(400)
      .json(LRes.fieldErr('requestId', '/', errorTypes.MISSING));
  }
  try {
    // * Validate Client Carrier Account
    const checkValues = await validateCarrierAccount(
      carrierAccount,
      // @ts-expect-error: ignore
      req.user
    );
    carrierAccount = checkValues.carrierAccount;
    account = checkValues.account;
    // * Validate facility
    facility = await validateFacility(account, facility);
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }

  try {
    // check if data is available in the system
    const manifest = await ManifestSchema.findOne({
      facility: facility,
      requestId: requestId,
      userRef: user._id
    });
    if (!manifest)
      return LRes.resErr(
        res,
        404,
        `No manifest found with requiredId [${requestId}], please create manifest first`
      );
    if (manifest.status === 'COMPLETED') return LRes.resOk(res, manifest);

    const clientAccount = await ClientCarrierSchema.findOne({
      _id: manifest.carrierRef
    });
    if (clientAccount) {
      const api = CarrierFactory.getCarrierAPI(
        clientAccount,
        test,
        clientAccount.carrier === CARRIERS.DHL_ECOMMERCE
          ? clientAccount.facilities![0]
          : undefined
      );
      if (api && api.getManifest) {
        await api.init();
        const result = await api.getManifest(manifest);
        manifest.carrier = result.carrier;
        manifest.carrierRef = result.carrierRef;
        manifest.timestamp = result.timestamp;
        manifest.requestId = result.requestId;
        manifest.link = result.link;
        manifest.status = result.status;
        manifest.userRef = result.userRef;
        manifest.manifests = result.manifests;
        manifest.manifestErrors = result.manifestErrors;
        await manifest.save();

        const manifestResponse: IManifestResponse = {
          timestamp: manifest.timestamp!,
          carrier: manifest.carrier,
          carrierAccount: account.accountId,
          facility: manifest.facility,
          requestId: manifest.requestId!,
          manifests: manifest.manifests.map((ele) => {
            const mObj: IManifestObj = {
              createdOn: ele.createdOn!,
              manifestId: ele.manifestId,
              total: 0,
              manifestData: ele.manifestData,
              encodeType: ele.encodeType,
              format: ele.format
            };
            return mObj;
          })
        };
        return LRes.resOk(res, manifestResponse);
      } else {
        return LRes.resErr(res, 400, 'No carrier api found');
      }
    } else {
      return LRes.resErr(res, 400, 'No carrier account found');
    }
  } catch (error) {
    console.log(error);
    return LRes.resErr(res, 500, error);
  }
};
