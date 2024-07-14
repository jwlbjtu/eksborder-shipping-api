import { Request, Response } from 'express';
import LRes from '../../lib/lresponse.lib';
import User from '../../models/user.model';
import keygen from 'keygen';
import { ApiLabelHandlerRequest } from '../../types/carriers/api';
import { validationResult } from 'express-validator';
import AccountSchema from '../../models/account.model';
import { logger } from '../../lib/logger';
import {
  createApiFailedResponse,
  createShipmentData
} from '../../lib/utils/api.utils';
import ShipmentSchema from '../../models/shipping.model';
import BillingSchema from '../../models/billing.model';
import CarrierFactory from '../../lib/carriers/carrier.factory';
import { isShipmentInternational } from '../../lib/carriers/carrier.helper';
import { Rate } from '../../types/carriers/carrier';
import ItemSchema from '../../models/item.model';
import { computeFee, roundToTwoDecimal } from '../../lib/utils/helpers';
import { Currency, ShipmentStatus } from '../../lib/constants';
import { IBilling, Item } from '../../types/record.types';
import { ILabelResponse } from '../../types/shipping.types';
import {
  chargeUserBalance,
  getUserBalance,
  IUserBalance,
  updateUserBalanceAndDeposit
} from '../../lib/utils/user.balance.utils';
import { Types } from 'mongoose';

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
  const body = req.body as ApiLabelHandlerRequest;
  // Validate token
  const token = body.token;
  const user = await User.findOne({ apiToken: token, isActive: true });
  if (!user) {
    res.status(401).json(createApiFailedResponse('token 不存在'));
    return;
  }
  try {
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
    logger.info(shipmentData);
    let shipping = new ShipmentSchema(shipmentData);
    shipping = await shipping.save();

    // 1.1 Create Items Object
    logger.info('1.1 Create Items Object');
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
    logger.info('2. Get Carrier API');
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
    logger.info('3. Get Shipment Price');
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
    logger.info('4. Compute total price = shipment price + fee');
    fee = computeFee(shipping, rate.rate!, rate.currency, clientAccount.rates);
    totalRate = roundToTwoDecimal(rate.rate! + fee);
    logger.info('4.1 Check total price against user balance');
    // Validate user balance and charge fee
    userBalance = await chargeUserBalance(user.id.toString(), totalRate);

    // 5. Create Shipment Label
    logger.info('5. Create Shipment Label');
    const labelResponse = await api.label(shipping, rate);
    const labels = labelResponse.labels;
    const forms = labelResponse.forms;

    if (!rate.isTest) {
      logger.info('6 Generate billing record');
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
      logger.info('6 Test mode - skip payment');
    }

    // 7. Update shipping record
    logger.info('7. Update shipping record');
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
    logger.info('8. Return Label Data');
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
    return LRes.resOk(res, labelResult);
  } catch (error) {
    logger.error(error);
    await updateUserBalanceAndDeposit(user.id.toString(), totalRate, 0);
    res.status(500).json(createApiFailedResponse((error as Error).message));
  }
};
