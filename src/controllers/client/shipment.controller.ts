import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../../lib/logger';
import ShipmentSchema from '../../models/shipping.model';
import AccountSchema from '../../models/account.model';
import BillingSchema from '../../models/billing.model';
import User from '../../models/user.model';
import { IAccount, IUser } from '../../types/user.types';
import {
  CreateShipmentData,
  UserShippingRateRequest
} from '../../types/client/shipment';
import util from 'util';
import {
  Currency,
  ShipmentStatus,
  SHIPMENT_UPDATE_FIELDS,
  WeightUnit,
  DistanceUnit
} from '../../lib/constants';
import {
  checkCustomService,
  isShipmentInternational,
  validateShipment
} from '../../lib/carriers/carrier.helper';
import IdGenerator from '../../lib/utils/IdGenerator';
import CarrierFactory from '../../lib/carriers/carrier.factory';
import { computeFee, roundToTwoDecimal } from '../../lib/utils/helpers';
import { IBilling, IShipping, ShipmentData } from '../../types/record.types';
import fs from 'fs';
import CsvParser from 'csv-parse';
import path from 'path';
import AddressSchema from '../../models/client/address.model';
import { sendCsvImportEmail } from '../../lib/utils/email.helper';
import TransformDataToShipment from '../../lib/utils/shipment.transform';
import { IClientAddress } from '../../types/client/address';
import { IAddress } from '../../types/shipping.types';
import es from 'event-stream';
import TransformShipmentToProduct from '../../lib/utils/product.transform';
import { Rate } from '../../types/carriers/carrier';
import { UserShippingRecordsSearchQuery } from '../users/record.controller';
import { validatePackageList } from '../../lib/utils/api.utils';

export const getShippingRateForClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: '用户未找到' });
      return;
    }
    const data = req.body as UserShippingRateRequest;
    // 0. Validate body packageList
    logger.info('0. Validate body packageList');
    const validateResult = validatePackageList(data.packageList);
    if (!validateResult.status) {
      res.status(400).json({ message: validateResult.message });
      return;
    }
    const { channel, toAddress, packageList } = data;
    const clientAccount = await AccountSchema.findOne({
      accountId: channel,
      isActive: true,
      userRef: user._id
    });
    if (!clientAccount) {
      res.status(404).json({ message: '无效渠道代码' });
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
      toAddress,
      shipmentOptions: {
        shipmentDate: new Date()
      },
      packageList: packageList.map((p) => {
        console.log(p);
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
      res.status(500).json({ message: '获取API失败' });
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
      res.status(500).json({ message: 'API报价异常' });
      return;
    }
    if (!rate.rate || !rate.currency) {
      res.status(400).json({ message: '获取邮寄费失败' });
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
    res.json({
      rate: totalRate,
      currency: rate.currency,
      fee,
      baseRate: rate.rate,
      details: priceResult.data
    });
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const getUserShippingRate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const data = req.body as UserShippingRateRequest;
    // 0. Validate body packageList
    logger.info('0. Validate body packageList');
    const validateResult = validatePackageList(data.packageList);
    if (!validateResult.status) {
      res.status(400).json({ message: validateResult.message });
      return;
    }
    const { channel, toAddress, packageList } = data;
    const clientAccount = await AccountSchema.findOne({
      accountId: channel,
      isActive: true,
      userRef: user._id
    });
    if (!clientAccount) {
      res.status(404).json({ message: '无效渠道代码' });
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
      toAddress,
      shipmentOptions: {
        shipmentDate: new Date()
      },
      packageList: packageList.map((p) => {
        console.log(p);
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
      res.status(500).json({ message: '获取API失败' });
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
      res.status(500).json({ message: 'API报价异常' });
      return;
    }
    if (!rate.rate || !rate.currency) {
      res.status(400).json({ message: '获取邮寄费失败' });
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
    res.json({
      rate: totalRate,
      currency: rate.currency,
      fee,
      baseRate: rate.rate,
      details: priceResult.data
    });
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const getShipmentsForUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const match: Record<string, string> = {};
    if (req.query.orderStatus) match.status = req.query.orderStatus.toString();
    const orders = await ShipmentSchema.find({ ...match, userRef: user._id })
      .sort({ $natural: -1 })
      .populate('items')
      .populate('customItems');
    res.json(orders);
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const searchShipmentsForUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as UserShippingRecordsSearchQuery;
    const user = req.user as IUser;
    const userId = user.id;
    const userObj = await User.findById(userId);
    if (!userObj) {
      res.status(404).json({ message: 'No user found' });
      return;
    }

    const {
      startDate,
      endDate,
      orderId,
      name,
      phone,
      trackingId,
      zip,
      status
    } = body;
    const searchQuery: Record<string, any> = {
      userRef: userId,
      status,
      createdAt: { $gte: startDate + ' 00:00:00', $lte: endDate + ' 23:59:59' }
    };
    if (orderId) {
      searchQuery['orderId'] = { $regex: orderId, $options: 'i' };
    }
    if (name) {
      searchQuery['toAddress.name'] = { $regex: name, $options: 'i' };
    }
    if (phone) {
      searchQuery['toAddress.phone'] = { $regex: phone, $options: 'i' };
    }
    if (trackingId) {
      searchQuery['trackingId'] = { $regex: trackingId, $options: 'i' };
    }
    if (zip) {
      searchQuery['toAddress.zip'] = { $regex: zip, $options: 'i' };
    }
    const records = await ShipmentSchema.find(searchQuery).sort({
      createdAt: -1
    });
    res.json(records);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const cancelShipmentForUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as { recordId: string; status: string };
    const user = req.user as IUser;
    const userId = user.id;
    const userObj = await User.findById(userId);
    if (!userObj) {
      res.status(404).json({ message: 'No user found' });
      return;
    }

    const recordId = body.recordId;
    const record = await ShipmentSchema.findOne({
      _id: recordId,
      userRef: userId
    });
    if (!record) {
      res.status(404).json({ message: '面单信息未找到' });
      return;
    }
    if (record.status === body.status) {
      res.json({ message: '面单状态已更新' });
      return;
    }
    if (ShipmentStatus.DEL_PENDING === body.status) {
      // 取消面单
      record.status = ShipmentStatus.DEL_PENDING;
      res.json({ message: '面单状态已更新' });
      return;
    }
    res.status(400).json({ message: '不支持操作' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const createShipment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Create shipment validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body as CreateShipmentData;
      const shipment = new ShipmentSchema(data);
      shipment.orderId = `${user.userName
        .substring(0, 2)
        .toUpperCase()}${await IdGenerator.generateId(user.userName)}`;
      shipment.return = data.sender;
      shipment.shipmentOptions = { shipmentDate: new Date() };
      shipment.userRef = user._id;
      await shipment.save();
      res.json(shipment);
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const updateShipments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body;
      const shipment = await ShipmentSchema.findOne({
        _id: data.id,
        userRef: user._id
      });
      if (shipment) {
        Object.keys(data).forEach((key) => {
          if (SHIPMENT_UPDATE_FIELDS.includes(key)) {
            if (key === 'shipmentOptions') {
              shipment.shipmentOptions = {
                shipmentDate: new Date(data.shipmentOptions.shipmentDate)
              };
            } else {
              shipment[key] = data[key];
            }
          }
        });
        await shipment.save();
        const result = await ShipmentSchema.findOne({ _id: data.id })
          .populate('items')
          .populate('customItems');
        res.json(result);
      } else {
        res.status(404).json({ message: 'Shipment not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const purchaseLabel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error(`Purcahse label validation error`);
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body;
      if (user.uploading) {
        res.status(400).json({ message: '订单正在上传, 请稍后再试' });
        return;
      }

      const shipmentData = await ShipmentSchema.findOne({
        _id: data.id,
        userRef: user._id,
        status: ShipmentStatus.PENDING
      }).populate('customItems');
      if (shipmentData) {
        logger.info(
          `Purchase label for user ${user._id}, Order ${shipmentData._id}`
        );
        // validation all required information of a shipment
        // - carrier account
        const carrierAccount = await AccountSchema.findOne({
          accountId: shipmentData.carrierAccount,
          isActive: true,
          userRef: user._id
        });
        if (!carrierAccount) {
          res.status(404).json({ message: '无效账号' });
          return;
        }

        const chargeFee = !carrierAccount.payOffline;

        // - validate user balance is greater than mini requirement
        if (chargeFee && !data.isTest && user.balance <= user.minBalance) {
          res.status(400).json({ message: '用户余额低于限定额度' });
          return;
        }

        // Check if Custom Service is Used
        let isCustomService = false;
        const checkResult = await checkCustomService(
          shipmentData,
          carrierAccount
        );
        if (checkResult) {
          if (typeof checkResult === 'string') {
            res.status(400).json({ message: checkResult });
            return;
          }
          shipmentData.service!.name = checkResult.name;
          shipmentData.service!.key = checkResult.code;
          isCustomService = true;
        }

        console.log(shipmentData);

        const valiResult = validateShipment(
          shipmentData,
          carrierAccount,
          isCustomService
        );
        if (valiResult) {
          res.status(400).json({ message: valiResult });
          return;
        }
        const api = CarrierFactory.getCarrierAPI(
          carrierAccount,
          data.isTest,
          shipmentData.facility
        );

        if (api) {
          await api.init();

          if (api.validateAddress) {
            const result = await api.validateAddress(
              shipmentData.toAddress,
              true
            ); // TDOD: replace with data.isTest
            if (!result) {
              res.status(400).json({
                message:
                  'Destination address validation failed, please double check your address'
              });
              return;
            }
          }

          let result;
          if (chargeFee) {
            result = await api.products(
              shipmentData,
              isShipmentInternational(shipmentData)
            );
            if (typeof result === 'string') {
              res.status(400).json({ message: result });
              return;
            } else if (result.errors && result.errors.length > 0) {
              res.status(500).json({ message: result.errors[0] });
              return;
            }
          }

          let rate: Rate;
          if (chargeFee && result && result.rates) {
            rate = result.rates[0];
          } else {
            res.status(400).json({ message: '获取邮寄费失败' });
            return;
          }

          let totalRate = 0;
          let fee = 0;
          // check user balance
          fee = computeFee(
            shipmentData,
            rate.rate!,
            rate.currency,
            carrierAccount.rates
          );
          totalRate = roundToTwoDecimal(rate.rate! + fee);
          if (!rate.isTest && user.balance < totalRate) {
            res.status(400).json({ message: '余额不足' });
            return;
          }

          // call carrierAPI to get label
          const labelResponse = await api.label(shipmentData, rate);
          const labels = labelResponse.labels;
          const forms = labelResponse.forms;
          // charge fee from user balance
          if (!rate.isTest) {
            let newBalance = user.balance;
            if (chargeFee) {
              newBalance = roundToTwoDecimal(user.balance - totalRate);
              user.balance = newBalance;
              await user.save();
            }
            // generate billing record
            // @ts-expect-error: ignore
            const billingObj: IBilling = {
              userRef: user._id,
              description: `${rate.carrier}, ${rate.service}, ${labels[0].tracking}`,
              account: carrierAccount.accountName,
              total: totalRate,
              balance: newBalance,
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
          }
          // update shipment data
          if (!shipmentData.labels) shipmentData.labels = [];
          const newLabels = shipmentData.labels.concat(labels);
          shipmentData.labels = newLabels;
          if (forms) {
            if (!shipmentData.forms) shipmentData.forms = [];
            const newForms = shipmentData.forms.concat(forms);
            shipmentData.forms = newForms;
          }

          shipmentData.trackingId = labels[0].tracking;
          if (!data.isTest) {
            shipmentData.status = ShipmentStatus.FULFILLED;
            shipmentData.rate = {
              amount: totalRate,
              currency: rate.currency || Currency.USD
            };
          }
          await shipmentData.save();
          const returnShipment = await ShipmentSchema.findOne({
            _id: shipmentData
          })
            .populate('items')
            .populate('customItems');
          res.json({ order: returnShipment, balance: user.balance });
          return;
        } else {
          res.status(500).json({ message: 'Failed to create carrier api' });
          return;
        }
      }
    }
  } catch (error) {
    console.log(error);
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const preloadCsvFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    if (user.balance <= user.minBalance) {
      res.status(400).json({ message: '用户余额低于限定额度' });
      return;
    }
    // 防止短时间内多次上传
    const findUser = await User.findOne({ _id: user._id });
    if (!findUser) {
      res.status(400).json({ message: 'User not found' });
      return;
    }
    if (findUser.uploading) {
      res.status(400).json({ message: '正在处理上传任务，请稍后再试' });
      return;
    }
    let count = 0;
    const dataList: string[][] = [];
    const readStream = fs
      .createReadStream(req.file!.path)
      .pipe(CsvParser())
      .on('data', function (data) {
        dataList.push(data);
        count += 1;
        if (count === 2) readStream.destroy();
      })
      .on('end', function () {
        logger.info('Stream is ended');
        if (count < 2) {
          fs.unlink(req.file!.path, (err) => {
            if (err) {
              logger.error(`Failed to delete file ${req.file!.path}`);
              logger.error(util.inspect(err, true, null));
            } else {
              logger.info(`File ${req.file!.path} is deleted`);
            }
          });
          if (!res.headersSent)
            res.status(400).json({ message: 'Failed to upload CSV file' });
        } else {
          if (!res.headersSent)
            res.json({
              name: req.file!.filename.split('.')[0],
              list: dataList
            });
        }
      })
      .on('close', function () {
        logger.info('Stream has been destroied');
        if (count < 2) {
          fs.unlink(req.file!.path, (err) => {
            if (err) {
              logger.error(`Failed to delete file ${req.file!.path}`);
              logger.error(util.inspect(err, true, null));
            } else {
              logger.info(`File ${req.file!.path} is deleted`);
            }
          });
          if (!res.headersSent)
            res.status(400).json({ message: 'Failed to upload CSV file' });
        } else {
          if (!res.headersSent)
            res.json({
              name: req.file!.filename.split('.')[0],
              list: dataList
            });
        }
      });
  } catch (error) {
    fs.unlink(req.file!.path, (err) =>
      logger.error(util.inspect(err, true, null))
    );
    logger.error(util.inspect(error, true, null));
    res.status(500).json({ message: (error as any).message });
  }
};

export const importCsvData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error(`Purcahse label validation error`);
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      let user = req.user as IUser;
      if (user.balance <= user.minBalance) {
        res.status(400).json({ message: '用户余额低于限定额度' });
        return;
      }
      // 防止短时间内多次上传
      const findUser = await User.findOne({ _id: user._id });
      if (!findUser) {
        res.status(400).json({ message: 'User not found' });
        return;
      }
      if (findUser.uploading) {
        res.status(400).json({ message: '正在处理上传任务，请稍后再试' });
        return;
      } else {
        const newUser = await User.findOneAndUpdate(
          { _id: user._id },
          { uploading: true },
          { new: true }
        );
        if (newUser) {
          user = newUser;
        } else {
          res.status(400).json({ message: 'User update failed' });
          return;
        }
      }
      const data = req.body;
      const map = data.map;
      const name = data.name;
      const filePath = path.join('static', 'csv', `${name}.csv`);
      let count = 0;
      let success = 0;
      const defaultSender = await AddressSchema.findOne({
        isDefaultSender: true,
        userRef: user._id
      });

      if (defaultSender) {
        // Create Transform Stream
        const createShipmentTransformStream = new TransformDataToShipment(
          {},
          map,
          convertClientAddressToIAddress(defaultSender),
          convertClientAddressToIAddress(defaultSender), // TODO: after fix the return address logic use default address
          user
        );
        const productTransformStream = new TransformShipmentToProduct({}, user);

        fs.createReadStream(filePath)
          .pipe(CsvParser())
          .pipe(createShipmentTransformStream)
          .on('data', function (data) {
            if (data) {
              count += 1;
            }
          })
          .pipe(productTransformStream)
          .pipe(
            es.mapSync(function (
              data:
                | { shipment: IShipping; carrierAccount: IAccount; rate: Rate }
                | undefined
            ) {
              if (data) {
                const rate = data.rate;
                const shipment = data.shipment;
                const carrierAccount = data.carrierAccount;
                if (rate.rate && rate.currency) {
                  // check user balance
                  const fee = computeFee(
                    shipment,
                    rate.rate,
                    rate.currency,
                    carrierAccount.rates
                  );
                  const totalRate = roundToTwoDecimal(rate.rate + fee);
                  const newBalance = roundToTwoDecimal(
                    user.balance - totalRate
                  );
                  if (newBalance > 0 && newBalance > user.minBalance) {
                    user.balance = newBalance;
                    return { ...data, totalRate, newBalance, fee };
                  } else {
                    return undefined;
                  }
                } else {
                  return undefined;
                }
              } else {
                return undefined;
              }
            })
          )
          .pipe(
            es.map(async function (data: any, callback: any) {
              const {
                rate,
                shipment,
                carrierAccount,
                totalRate,
                newBalance,
                fee
              } = data;
              try {
                // call carrierAPI to get label
                const api = CarrierFactory.getCarrierAPI(
                  carrierAccount,
                  false,
                  shipment.facility
                );
                if (api) {
                  await api.init();
                  const labelResponse = await api.label(shipment, rate);
                  const labels = labelResponse.labels;
                  const forms = labelResponse.forms;
                  // generate billing record
                  // @ts-expect-error: ignore
                  const billingObj: IBilling = {
                    userRef: user._id,
                    description: `${rate.carrier}, ${rate.service}, ${labels[0].tracking}`,
                    account: carrierAccount.accountName,
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
                  // update shipment data
                  if (!shipment.labels) shipment.labels = [];
                  const newLabels = shipment.labels.concat(labels);
                  shipment.labels = newLabels;
                  if (forms) {
                    if (!shipment.forms) shipment.forms = [];
                    const newForms = shipment.forms.concat(forms);
                    shipment.forms = newForms;
                  }
                  shipment.status = ShipmentStatus.FULFILLED;
                  shipment.trackingId = labels[0].tracking;
                  shipment.rate = {
                    amount: totalRate,
                    currency: rate.currency || Currency.USD
                  };
                  await ShipmentSchema.findOneAndUpdate(
                    { _id: shipment._id },
                    shipment
                  );
                  success += 1;
                  callback(null, shipment);
                } else {
                  callback(null, undefined);
                  user.balance += totalRate;
                }
              } catch (error) {
                logger.error(error);
                callback(null, undefined);
              }
            })
          )
          .pipe(
            es.wait(async function (err: any, body: any) {
              fs.unlink(filePath, (err) => {
                if (err) {
                  logger.error(`Failed to delete file ${filePath}`);
                  logger.error(util.inspect(err, true, null));
                } else {
                  logger.info(`File ${filePath} is deleted`);
                }
              });
              // Release the uploading flag
              await User.findOneAndUpdate(
                { _id: user._id },
                { uploading: false, balance: user.balance }
              );
              sendCsvImportEmail(
                user.firstName,
                user.lastName,
                user.email,
                count,
                success
              );
            })
          );
        res.json({ message: 'CSV 处理中。。。.' });
      } else {
        res.status(400).json({ message: 'MISS_DEFAULT_ADDRESS' });
      }
    }
  } catch (error) {
    console.log(error);
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

const convertClientAddressToIAddress = (address: IClientAddress): IAddress => {
  const result: IAddress = {
    name: address.name,
    company: address.company,
    email: address.email,
    phone: address.phone,
    country: address.country,
    street1: address.street1,
    street2: address.street2,
    city: address.city,
    state: address.state,
    zip: address.zip || ''
  };
  return result;
};
