import { Request, Response } from 'express';
import ReconciliationSchema from '../../models/reconciliation.model';
import fs, { stat } from 'fs';
import util from 'util';
import CsvParser from 'csv-parse';
import { logger } from '../../lib/logger';
import ShippingSchema from '../../models/shipping.model';
import BillingSchema from '../../models/billing.model';
import AccountingItemSchema from '../../models/accountingItem.model';
import HelperLib from '../../lib/helper.lib';
import UserSchema from '../../models/user.model';
import {
  base64Encode,
  computeFeeWithAmount,
  getWeightUnit
} from '../../lib/utils/helpers';
import { Currency, ShipmentStatus, WeightUnit } from '../../lib/constants';

export const searchAccountItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const recordId = req.params.id;
    const { orderId, status, userName, trackingNumber, docName } =
      req.body as AccountingItemSearchQuery;

    const searchQuery: Record<string, any> = {
      recordRef: recordId
    };
    if (orderId) {
      searchQuery['orderId'] = { $regex: orderId, $options: 'i' };
    }
    if (status) {
      searchQuery['status'] = status;
    }
    if (userName) {
      searchQuery['userName'] = { $regex: userName, $options: 'i' };
    }
    if (trackingNumber) {
      searchQuery['trackingNumber'] = { $regex: trackingNumber, $options: 'i' };
    }
    if (docName) {
      searchQuery['docName'] = { $regex: docName, $options: 'i' };
    }
    const items = await AccountingItemSchema.find(searchQuery);
    console.log(items);
    res.json(items);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const fetchAccountItenForRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const recordId = req.params.id;
    console.log(recordId);
    const items = await AccountingItemSchema.find({ recordRef: recordId });
    console.log(items);
    res.json(items);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const fetchReconciliationRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const records = await ReconciliationSchema.find();
    res.json(records);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const uploadReconciliationCsv = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const name = req.body.name;
    // find record with name
    const record = await ReconciliationSchema.findOne({ name });
    let recordId = '';
    if (!record) {
      // If not found then create a new record
      const newRecord = new ReconciliationSchema({
        name,
        date: new Date(),
        status: 0
      });
      await newRecord.save();
      recordId = newRecord._id;
    } else {
      // If found then update the record
      record.status = 0;
      await record.save();
      recordId = record._id;
    }
    // process csv data for the record
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: '未找到上传文件' });
    } else {
      processReconciliationCsv(recordId, file);
      res.json({ message: '对账进行中...' });
    }
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) =>
        logger.error(util.inspect(err, true, null))
      );
    }
    console.log(error);
    logger.error((error as Error).message);
    res.status(500).json(error);
  }
};

const processReconciliationCsv = async (
  recordId: string,
  file: Express.Multer.File
): Promise<void> => {
  logger.info(`开始处理对账文件 ${file.path}`);
  fs.createReadStream(file.path)
    .pipe(CsvParser())
    .on('data', async function (data) {
      console.log(data);
      if (data[4] !== 'PIC') {
        try {
          const trackingNum = data[4];
          // find shipping and billing based on the tracking number
          const shipping = await ShippingSchema.findOne({
            trackingId: trackingNum
          });
          if (shipping) {
            if (
              shipping.status === ShipmentStatus.DEL_PENDING ||
              shipping.status === ShipmentStatus.DELETED
            ) {
              await createOrUpdateFailedAccountingItem(
                data,
                recordId,
                '订单待删除或已删除',
                '-'
              );
            } else {
              const weight = data[0];
              const weightType = data[1];
              const amount = Number(data[5]);
              const zone = data[6];
              const docName = data[7];

              const orderId = shipping.orderId;
              const carrierAccount = shipping.carrierAccount;
              const userRef = shipping.userRef;

              if (carrierAccount) {
                // find billing and update billing charges
                const billing = await BillingSchema.findOne({
                  description: orderId
                });
                if (
                  billing &&
                  billing.details &&
                  billing.details.shippingCost &&
                  billing.details.fee
                ) {
                  const billingAmount = billing.total;

                  const clientUser = await UserSchema.findById(userRef);
                  if (clientUser) {
                    const carrierAccountObj =
                      await HelperLib.getCurrentUserAccount(
                        carrierAccount,
                        clientUser
                      );
                    if (carrierAccountObj) {
                      const fee = computeFeeWithAmount(
                        shipping,
                        amount,
                        Currency.USD,
                        weight,
                        weightType ? getWeightUnit(weightType) : WeightUnit.LB,
                        carrierAccountObj.rates
                      );
                      const total = amount + fee;
                      // update user balance
                      const diff = total - billingAmount;
                      const newBalance = clientUser.balance - diff;
                      clientUser.balance = newBalance;
                      await clientUser.save();
                      // update billing accounting status
                      billing.total = total;
                      billing.details.shippingCost.amount = amount;
                      billing.details.fee.amount = fee;
                      billing.accountingStatus = '已对账';
                      billing.accountingDiff = diff;
                      await billing.save();
                      // update shipping accounting status
                      shipping.accountingStatus = '已对账';
                      shipping.accountingDiff = diff;
                      shipping.accountingWeight = weight;
                      shipping.accountingWeightUnit = weightType
                        ? getWeightUnit(weightType)
                        : undefined;
                      await shipping.save();
                      // create accounting item
                      const eItem = await AccountingItemSchema.findOne({
                        trackingNumber: trackingNum,
                        recordRef: recordId
                      });
                      if (!eItem) {
                        const item = new AccountingItemSchema({
                          status: 0,
                          weight: weight ? weight : 0,
                          weightType: weightType ? weightType : '-',
                          uspsState: data[2] ? data[2] : '-',
                          pieceId: data[3] ? data[3] : '-',
                          trackingNumber: trackingNum,
                          channel: carrierAccount,
                          amount: total,
                          baseAmount: amount,
                          orderId,
                          orderDate: shipping.createdAt,
                          recordRef: recordId,
                          userRef: clientUser._id,
                          userName: clientUser.companyName,
                          remark: '对账完成',
                          zone: zone ? zone : '-',
                          docName: docName ? docName : '-'
                        });
                        await item.save();
                      } else {
                        eItem.status = 0;
                        eItem.weight = weight ? weight : 0;
                        eItem.weightType = weightType ? weightType : '-';
                        uspsState: data[2] ? data[2] : '-';
                        eItem.pieceId = data[3] ? data[3] : '-';
                        eItem.channel = carrierAccount;
                        eItem.amount = total;
                        eItem.baseAmount = amount;
                        eItem.orderId = orderId;
                        eItem.orderDate = shipping.createdAt;
                        eItem.userRef = clientUser._id;
                        eItem.userName = clientUser.companyName;
                        eItem.remark = '对账完成';
                        eItem.zone = zone ? zone : '-';
                        eItem.docName = docName ? docName : '-';
                        await eItem.save();
                      }
                    } else {
                      await createOrUpdateFailedAccountingItem(
                        data,
                        recordId,
                        '未找到对应的物流账户',
                        carrierAccount
                      );
                    }
                  } else {
                    await createOrUpdateFailedAccountingItem(
                      data,
                      recordId,
                      '未找到对应的用户',
                      carrierAccount
                    );
                  }
                } else {
                  await createOrUpdateFailedAccountingItem(
                    data,
                    recordId,
                    '对应的账单异常或不存在',
                    carrierAccount
                  );
                }
              } else {
                await createOrUpdateFailedAccountingItem(
                  data,
                  recordId,
                  '未找到对应的物流账户',
                  carrierAccount ? carrierAccount : '-'
                );
              }
            }
          } else {
            await createOrUpdateFailedAccountingItem(
              data,
              recordId,
              '未找到对应的运单',
              '-'
            );
          }
        } catch (error) {
          console.log(error);
          logger.error((error as Error).message);
        }
      } else {
        logger.info('跳过标题行');
      }
    })
    .on('end', async function () {
      await ReconciliationSchema.updateOne(
        { _id: recordId },
        {
          status: 1
        }
      );
      if (file) {
        fs.unlink(file.path, (err) => {
          if (err) {
            if (file) logger.error(`Failed to delete file ${file.path}`);
            logger.error(util.inspect(err, true, null));
          } else {
            if (file) logger.info(`File ${file.path} is deleted`);
          }
        });
      }
    });
};

const createOrUpdateFailedAccountingItem = async (
  data: any,
  recordId: string,
  msg: string,
  carrierAccount: string
) => {
  const trackingNum = data[4];
  const eItem = await AccountingItemSchema.findOne({
    trackingNumber: trackingNum,
    recordRef: recordId
  });
  if (!eItem) {
    const item = new AccountingItemSchema({
      status: 1,
      weight: data[0] ? data[0] : 0,
      weightType: data[1] ? data[1] : '-',
      uspsState: data[2] ? data[2] : '-',
      pieceId: data[3] ? data[3] : '-',
      trackingNumber: trackingNum,
      channel: carrierAccount ? carrierAccount : '-',
      amount: data[5],
      baseAmount: data[5],
      orderId: '-',
      orderDate: '-',
      recordRef: recordId,
      remark: msg,
      zone: data[6] ? data[6] : '-',
      docName: data[7] ? data[7] : '-'
    });
    console.log(item);
    await item.save();
  } else {
    eItem.channel = carrierAccount ? carrierAccount : '-';
    eItem.status = 1;
    eItem.remark = msg;
    eItem.baseAmount = data[5];
    eItem.zone = data[6] ? data[6] : '-';
    eItem.docName = data[7] ? data[7] : '-';
    await eItem.save();
  }
};

export interface AccountingItemSearchQuery {
  userName?: string;
  orderId?: string;
  trackingNumber?: string;
  status?: number;
  docName?: string;
}
