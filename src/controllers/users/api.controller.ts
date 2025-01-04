import { Request, Response } from 'express';
import LRes from '../../lib/lresponse.lib';
import User from '../../models/user.model';
import keygen from 'keygen';
import { ApiLabelHandlerRequest } from '../../types/carriers/api';
import { validationResult } from 'express-validator';
import AccountSchema from '../../models/account.model';
import { logger } from '../../lib/logger';
import {
  cacheLabelResponseForOrderId,
  checkOrderIdProcessed,
  createApiFailedResponse,
  createShipmentData,
  validatePackageList
} from '../../lib/utils/api.utils';
import ShipmentSchema from '../../models/shipping.model';
import BillingSchema from '../../models/billing.model';
import CarrierFactory from '../../lib/carriers/carrier.factory';
import { isShipmentInternational } from '../../lib/carriers/carrier.helper';
import { Rate } from '../../types/carriers/carrier';
import ItemSchema from '../../models/item.model';
import { computeFee, roundToTwoDecimal } from '../../lib/utils/helpers';
import {
  Currency,
  DistanceUnit,
  ShipmentStatus,
  WeightUnit
} from '../../lib/constants';
import {
  IBilling,
  IShipping,
  Item,
  ShipmentData
} from '../../types/record.types';
import { ILabelResponse, IRateResponse } from '../../types/shipping.types';
import {
  chargeUserBalance,
  getUserBalance,
  IUserBalance,
  updateUserBalanceAndDeposit
} from '../../lib/utils/user.balance.utils';
import { Types } from 'mongoose';
import util from 'util';
import {
  ApiShippingCancelRequest,
  ApiShippingRateRequest,
  UserShippingRateRequest
} from '../../types/client/shipment';

export const generateApiToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user) return LRes.resErr(res, 404, { message: 'No user found' });
    let key = keygen.url(keygen.medium);
    while ((await User.findOne({ apiToken: key })) != null) {
      key = keygen.url(keygen.medium);
    }
    user.apiToken = key;
    await user.save();
    const authJson = {
      token: key,
      message: 'API token generated successfully'
    };
    LRes.resOk(res, authJson);
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const deleteApiToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user) return LRes.resErr(res, 404, { message: 'No user found' });
    user.apiToken = undefined;
    await user.save();
    LRes.resOk(res, { message: 'API token is revoked' });
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const apiLabelHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Validate request body
  const result = validationResult(req);
  if (!result.isEmpty()) {
    res
      .status(400)
      .json(createApiFailedResponse('Validation failed', result.array()));
    return;
  }

  let totalRate = 0;
  let feeIsCharged = false;
  const body = req.body as ApiLabelHandlerRequest;
  // Validate token
  const token = body.token;
  const user = await User.findOne({ apiToken: token, isActive: true });
  if (!user) {
    res.status(401).json(createApiFailedResponse('token 不存在'));
    return;
  }

  let orderId = body.orderId;
  if (body.orderId) {
    // Check if orderId has been processed
    logger.info(`${body.orderId} - *. Check if orderId has been processed`);
    const { flag, data } = await checkOrderIdProcessed(
      body.orderId,
      user.userName.substring(0, 2),
      user._id
    );
    // console.log('flag', flag);
    // console.log('data', data);
    if (flag) {
      logger.info(
        `*. OrderId: ${body.orderId} has been processed for user ${user.userName}`
      );
      return LRes.resOk(res, data);
    }
  }

  try {
    logger.info('Start. API Label Handler');
    // Validate channelId
    const channelId = body.channelId;
    const clientAccount = await AccountSchema.findOne({
      userRef: user._id,
      accountId: channelId,
      isActive: true
    });
    if (!clientAccount) {
      res.status(404).json(createApiFailedResponse('channelId 不存在'));
      return;
    }
    const carrier = clientAccount.carrier;
    // const chargeFee = clientAccount?.payOffline;
    const service = clientAccount.service;
    const facility = clientAccount.facility;
    const sender = clientAccount.address;

    // Validate user balance
    let userBalance: IUserBalance = await getUserBalance(user.id.toString());
    // console.log('userBalance', userBalance);
    if (!body.test && userBalance.balance <= user.minBalance) {
      res.status(400).json(createApiFailedResponse('用户余额低于限定额度'));
      return;
    }

    // 0. Validate body packageList
    logger.info('0. Validate body packageList');
    const result = validatePackageList(body.packageList);
    if (!result.status) {
      res.status(400).json(createApiFailedResponse(result.message));
      return;
    }

    // 1. Create Shipment Object
    logger.info('1. Create Shipment Object');
    const shipmentData = await createShipmentData(
      body,
      user,
      carrier,
      service,
      facility,
      sender
    );
    logger.info(util.inspect(shipmentData, false, null, true));
    let shipping = new ShipmentSchema(shipmentData);
    shipping = await shipping.save();
    orderId = shipping.orderId;

    // 1.1 Create Items Object
    logger.info(`${shipping.orderId} - 1.1 Create Items Object`);
    // const itemList: Item[] = [];
    for (let i = 0; i < body.packageList.length; i++) {
      const pkg = body.packageList[i];
      const items = pkg.lineItems.map((lineItem) => {
        const r: Item = {
          index: i,
          itemTitle: lineItem.name,
          sku: lineItem.sku,
          hsTariffNumber: lineItem.hsCode,
          totalValue: lineItem.totalValue,
          itemValueCurrency: Currency.USD,
          quantity: lineItem.quantity,
          shipmentRef: Types.ObjectId(shipping.id)
        };
        return new ItemSchema(r);
      });
      await ItemSchema.insertMany(items);
      shipping.items = items;
    }

    // 2. Get Carrier API
    logger.info(`${shipping.orderId} - 2. Get Carrier API`);
    const api = CarrierFactory.getCarrierAPI(
      clientAccount,
      body.test,
      shipping.facility
    );
    if (!api) {
      res.status(500).json(createApiFailedResponse('获取API失败'));
      return;
    }
    await api.init();

    // 3. Get Shipment Price
    logger.info(`${shipping.orderId} - 3. Get Shipment Price`);
    const priceResult = await api.products(
      shipping,
      isShipmentInternational(shipping)
    );
    if (typeof priceResult === 'string') {
      res.status(400).json(createApiFailedResponse(priceResult));
      return;
    } else if (priceResult.errors && priceResult.errors.length > 0) {
      res.status(500).json(createApiFailedResponse(priceResult.errors[0]));
      return;
    }

    let rate: Rate;
    if (priceResult && priceResult.rates) {
      rate = priceResult.rates[0];
    } else {
      res.status(500).json(createApiFailedResponse('API报价异常'));
      return;
    }
    if (!rate.rate || !rate.currency) {
      res.status(400).json(createApiFailedResponse('获取邮寄费失败'));
      return;
    }

    // 4. Compute total price = shipment price + fee
    let fee = 0;
    logger.info(
      `${shipping.orderId} - 4. Compute total price = shipment price + fee`
    );
    fee = computeFee(shipping, rate.rate!, rate.currency, clientAccount.rates);
    totalRate = roundToTwoDecimal(rate.rate! + fee);
    if (!body.test) {
      logger.info(
        `${shipping.orderId} - 4.1 Check total price against user balance for total cost: ${totalRate}`
      );
      // Validate user balance and charge fee
      userBalance = await chargeUserBalance(user.id.toString(), totalRate);
      feeIsCharged = true;
    } else {
      logger.info(
        `${shipping.orderId} - 4.1 skip user balance check for test mode`
      );
    }

    // 5. Create Shipment Label
    logger.info(`${shipping.orderId} - 5. Create Shipment Label`);
    const labelResponse = await api.label(shipping, rate);
    const labels = labelResponse.labels;
    const forms = labelResponse.forms;

    if (!rate.isTest) {
      logger.info(`${shipping.orderId} - 6 Generate billing record`);
      const billingObj: Partial<IBilling> = {
        userRef: user._id,
        description: shipmentData.orderId,
        account: clientAccount.accountName,
        total: totalRate,
        balance: userBalance.balance,
        clientDeposit: userBalance.deposit,
        deposit: 0,
        currency: rate.currency || Currency.USD,
        details: {
          shippingCost: {
            amount: rate.rate!,
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
    } else {
      // 6.2 Test mode - skip payment
      logger.info(`${shipping.orderId} - 6 Test mode - skip payment`);
    }

    // 7. Update shipping record
    logger.info(`${shipping.orderId} - 7. Update shipping record`);
    if (!shipping.labels) shipping.labels = [];
    const newLabels = shipping.labels.concat(labels);
    shipping.labels = newLabels;
    if (forms) {
      if (!shipping.forms) shipping.forms = [];
      const newForms = shipping.forms.concat(forms);
      shipping.forms = newForms;
    }
    if (!shipping.labelUrlList) shipping.labelUrlList = [];
    shipping.labelUrlList = labelResponse.labelUrlList;
    shipping.trackingId = labelResponse.trackingNum;
    if (!body.test) {
      shipping.status = ShipmentStatus.FULFILLED;
      shipping.rate = {
        amount: totalRate,
        currency: rate.currency || Currency.USD
      };
    }
    shipping.rOrderId = labelResponse.rOrderId;
    shipping.turnChannelId = labelResponse.turnChanddelId;
    shipping.turnServiceType = labelResponse.turnServiceType;
    shipping.invoiceUrl = labelResponse.invoiceUrl;
    await shipping.save();

    // 8. Return response
    logger.info(`${shipping.orderId} - 8. Return Label Data`);
    const labelResult: ILabelResponse = {
      timestamp: new Date(),
      carrier: labelResponse.turnChanddelId,
      service: labelResponse.turnServiceType,
      channelId: shipping.carrierAccount!,
      labels: shipping.labels.map((ele) => {
        return {
          createdOn: new Date(),
          trackingId: ele.tracking,
          labelData: ele.data,
          encodeType: ele.encodeType,
          format: ele.format
        };
      }),
      labelUrlList: labelResponse.labelUrlList,
      trackingNumber: shipping.trackingId
    };
    // Cache the labelResult with the orderId
    logger.info(`${shipping.orderId} - 9. Cache label response`);
    await cacheLabelResponseForOrderId(
      shipping.orderId,
      user.userName.substring(0, 2),
      labelResult
    );
    logger.info(
      `End. OrderID: ${shipping.orderId}}, Shipping trackingId: ${shipping.trackingId}`
    );
    return LRes.resOk(res, labelResult);
  } catch (error) {
    console.error(orderId, error);
    logger.error(`${orderId ? orderId + ' - ' : ''}` + error);
    if (feeIsCharged) {
      await updateUserBalanceAndDeposit(user.id.toString(), totalRate, 0);
    }
    res
      .status(500)
      .json(
        createApiFailedResponse(
          `${orderId ? orderId + ' - ' : ''}` + (error as Error).message
        )
      );
  }
};

export const apiRateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res
        .status(400)
        .json(createApiFailedResponse('Validation failed', result.array()));
      return;
    }

    const totalAmt = 0;
    const body = req.body as ApiShippingRateRequest;
    // Validate token
    const token = body.token;
    const user = await User.findOne({ apiToken: token, isActive: true });
    if (!user) {
      res.status(401).json(createApiFailedResponse('token 不存在'));
      return;
    }

    // 0. Validate body packageList
    logger.info('0. Validate body packageList');
    const validateResult = validatePackageList(body.packageList);
    if (!validateResult.status) {
      res.status(400).json(createApiFailedResponse(validateResult.message));
      return;
    }

    const { channelId, shipTo, packageList } = body;
    const clientAccount = await AccountSchema.findOne({
      accountId: channelId,
      isActive: true,
      userRef: user._id
    });
    if (!clientAccount) {
      res.status(404).json(createApiFailedResponse('无效渠道代码'));
      return;
    }
    const carrier = clientAccount.carrier;
    const service = clientAccount.service;
    const facility = clientAccount.facility;
    const sender = clientAccount.address;

    const shipmentData: ShipmentData = {
      orderId: '',
      carrier,
      service,
      facility,
      sender,
      toAddress: {
        name: shipTo.name,
        company: shipTo.companyName,
        street1: shipTo.address1,
        street2: shipTo.address2,
        city: shipTo.city,
        state: shipTo.state,
        country: shipTo.country,
        zip: shipTo.zipCode,
        phone: shipTo.phone,
        email: shipTo.email,
        taxNumber: shipTo.taxNumber
      },
      shipmentOptions: {
        shipmentDate: new Date()
      },
      packageList: packageList.map((p) => {
        return {
          packageType: '02',
          weight: { value: p.weight, unitOfMeasure: WeightUnit.LB },
          dimension: {
            length: p.length,
            width: p.width,
            height: p.height,
            unitOfMeasure: DistanceUnit.IN
          },
          count: p.count || 1
        };
      }),
      status: ShipmentStatus.PENDING,
      manifested: false,
      userRef: user._id
    };

    const api = CarrierFactory.getCarrierAPI(clientAccount, false, facility);
    if (!api) {
      res.status(500).json(createApiFailedResponse('获取API失败'));
      return;
    }
    await api.init();
    const priceResult = await api.products(shipmentData as IShipping, false);
    if (typeof priceResult === 'string') {
      res.status(400).json({ message: priceResult });
      return;
    } else if (priceResult.errors && priceResult.errors.length > 0) {
      res.status(500).json({ message: priceResult.errors[0] });
      return;
    }

    let rate: Rate;
    if (priceResult && priceResult.rates) {
      rate = priceResult.rates[0];
    } else {
      res.status(500).json(createApiFailedResponse('API报价异常'));
      return;
    }
    if (!rate.rate || !rate.currency) {
      res.status(400).json(createApiFailedResponse('获取邮寄费失败'));
      return;
    }

    let fee = 0;
    fee = computeFee(
      shipmentData as IShipping,
      rate.rate!,
      rate.currency,
      clientAccount.rates
    );

    const totalRate = roundToTwoDecimal(rate.rate! + fee);

    const rateResponse: IRateResponse = {
      timestamp: new Date(),
      channelId: channelId,
      totalAmt: totalRate.toString(),
      currency: rate.currency || Currency.USD
    };

    return LRes.resOk(res, rateResponse);
  } catch (error) {
    console.error(error);
    logger.error((error as Error).message);
    res.status(500).json(createApiFailedResponse((error as Error).message));
  }
};

export const apiCancelHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as ApiShippingCancelRequest;
    // Validate token
    const token = body.token;
    const user = await User.findOne({ apiToken: token, isActive: true });
    if (!user) {
      res.status(401).json(createApiFailedResponse('token 不存在'));
      return;
    }
    const trackingNumbers = body.trackingNumbers;
    const shipments = await ShipmentSchema.find({
      trackingId: { $in: trackingNumbers },
      userRef: user._id
    });
    if (!shipments || shipments.length === 0) {
      res.status(404).json(createApiFailedResponse('未找到邮寄记录'));
      return;
    }
    shipments.map(async (shipment) => {
      shipment.status = ShipmentStatus.DEL_PENDING;
      await shipment.save();
    });
    return LRes.resOk(res, { message: '邮寄取消成功' });
  } catch (error) {
    console.error(error);
    logger.error((error as Error).message);
    res.status(500).json(createApiFailedResponse((error as Error).message));
  }
};
