import { Request, Response } from 'express';
import LRes from '../../lib/lresponse.lib';
import User from '../../models/user.model';
import ShippingRecord from '../../models/shipping.model';
import { Types } from 'mongoose';
import { CARRIERS, ShipmentStatus } from '../../lib/constants';
import BillingSchema from '../../models/billing.model';
import { updateUserBalanceAndDeposit } from '../../lib/utils/user.balance.utils';
import { removeLabelResponseForOrderId } from '../../lib/utils/api.utils';
import { logger } from '../../lib/logger';
import util from 'util';
import { cancelByCarrierAPI } from '../../lib/carriers/carrier.cancel';
import { IShipping } from '../../types/record.types';

export const getShippingRecordsForClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(Types.ObjectId(userId));
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });
    const records = await ShippingRecord.find({
      userRef: Types.ObjectId(userId),
      status: ShipmentStatus.FULFILLED
    }).sort({ createdAt: -1 });
    return LRes.resOk(res, records);
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const batchSearchShippingRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as { trackingNumbers: string[] };
    const trackingNumbers = body.trackingNumbers;
    const records = await ShippingRecord.find({
      trackingId: { $in: trackingNumbers }
    });
    return LRes.resOk(res, records);
  } catch (error) {
    console.log(error);
    return LRes.resErr(res, 500, error);
  }
};

export const searchShippingRecordsForClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as {
      id: string;
      searchQuery: UserShippingRecordsSearchQuery;
    };
    const userId = body.id;
    const user = await User.findById(Types.ObjectId(userId));
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });

    const {
      startDate,
      endDate,
      orderId,
      name,
      phone,
      trackingId,
      zip,
      status
    } = body.searchQuery;
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
    const records = await ShippingRecord.find(searchQuery).sort({
      createdAt: -1
    });
    return LRes.resOk(res, records);
  } catch (error) {
    console.log(error);
    logger.error((error as Error).message);
    logger.error(util.inspect(error, false, null, true));
    return LRes.resErr(res, 500, error);
  }
};

export const updateShippingRecordStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as { id: string; recordId: string; status: string };
    const userId = body.id;
    const user = await User.findById(Types.ObjectId(userId));
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });

    const recordId = body.recordId;
    const record = await ShippingRecord.findOne({
      _id: recordId,
      userRef: userId
    });
    if (!record) {
      return LRes.resErr(res, 404, { title: '面单信息未找到' });
    }
    if (record.status === body.status) {
      return LRes.resOk(res, { title: '面单状态已更新' });
    }
    if (ShipmentStatus.DELETED === body.status) {
      logger.info(`Start to cancel label with trakcing: ${record.trackingId}`);
      let flag = true;
      if (
        record.carrier === CARRIERS.MAO_YUAN ||
        record.carrier === CARRIERS.DPD
      ) {
        // Call MoaYuan API to cancel label
        flag = await cancelByCarrierAPI(record);
      }
      if (flag) {
        // 取消面单
        record.status = ShipmentStatus.DELETED;
        // 取消账单
        const bill = await BillingSchema.findOne({
          description: record.orderId,
          userRef: userId
        });
        if (!bill) {
          return LRes.resErr(res, 404, { title: '面单账单为找到' });
        }
        const total = bill.total;
        bill.status = ShipmentStatus.DELETED;
        await updateUserBalanceAndDeposit(userId, total, 0);
        await record.save();
        await bill.save();
        // Remove shipping in processed cache
        await removeLabelResponseForOrderId(
          record.orderId,
          user.userName.substring(0, 2)
        );
        return LRes.resOk(res, { title: '面单状态已更新' });
      } else {
        return LRes.resErr(res, 400, { title: '取消面单失败' });
      }
    }
    if (
      (record.status === ShipmentStatus.FULFILLED &&
        ShipmentStatus.DEL_PENDING === body.status) ||
      (record.status === ShipmentStatus.DEL_PENDING &&
        ShipmentStatus.FULFILLED === body.status)
    ) {
      record.status = body.status;
      await record.save();
      return LRes.resOk(res, { title: '面单状态已更新' });
    }
    return LRes.resErr(res, 400, { title: '不支持操作' });
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const batchCancelShippingRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logger.info('Start to batch cancel shipping records');
    const body = req.body as IShipping[];
    const success: string[] = [];
    const failed: string[] = [];
    logger.info(`Total records to cancel: ${body.length}`);
    for (const item of body) {
      logger.info(`Start to cancel label with trakcing: ${item.trackingId}`);
      const record = await ShippingRecord.findById(item.id);
      if (!record) {
        failed.push(item.trackingId!);
        continue;
      }
      if (record.status === ShipmentStatus.DELETED) {
        failed.push(record.trackingId!);
        continue;
      }
      // Get client user
      const user = await User.findById(record.userRef);
      if (!user) {
        failed.push(record.trackingId!);
        continue;
      }
      let flag = true;
      if (record.carrier === CARRIERS.MAO_YUAN) {
        // Call MoaYuan API to cancel label
        flag = await cancelByCarrierAPI(record);
      }
      if (flag) {
        // 取消面单
        record.status = ShipmentStatus.DELETED;
        // 取消账单
        const bill = await BillingSchema.findOne({
          description: record.orderId,
          userRef: user._id
        });
        if (!bill) {
          failed.push(record.trackingId!);
          continue;
        }
        const total = bill.total;
        bill.status = ShipmentStatus.DELETED;
        await updateUserBalanceAndDeposit(user._id.toString(), total, 0);
        await record.save();
        await bill.save();
        // Remove shipping in processed cache
        await removeLabelResponseForOrderId(
          record.orderId,
          user.userName.substring(0, 2)
        );
        success.push(record.trackingId!);
      } else {
        failed.push(record.trackingId!);
      }
    }
    logger.info(`Success: ${success.length}, Failed: ${failed.length}`);
    return LRes.resOk(res, { success, failed });
  } catch (error) {
    console.error(error);
    return LRes.resErr(res, 500, error);
  }
};

export const batchCancelSingleShippingRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as IShipping;
    const recordId = body.id;
    const record = await ShippingRecord.findById(recordId);
    if (!record) {
      return LRes.resErr(res, 404, { title: '面单信息未找到' });
    }
    if (record.status === ShipmentStatus.DELETED) {
      return LRes.resErr(res, 400, { title: '面单状态不支持取消' });
    }
    // Get client user
    const user = await User.findById(record.userRef);
    if (!user) {
      return LRes.resErr(res, 404, { title: 'No user found' });
    }
    let flag = true;
    if (record.carrier === CARRIERS.MAO_YUAN) {
      // Call MoaYuan API to cancel label
      flag = await cancelByCarrierAPI(record);
    }
    if (flag) {
      // 取消面单
      record.status = ShipmentStatus.DELETED;
      // 取消账单
      const bill = await BillingSchema.findOne({
        description: record.orderId,
        userRef: user._id
      });
      if (!bill) {
        return LRes.resErr(res, 404, { title: '面单账单为找到' });
      }
      const total = bill.total;
      bill.status = ShipmentStatus.DELETED;
      await updateUserBalanceAndDeposit(user._id.toString(), total, 0);
      await record.save();
      await bill.save();
      // Remove shipping in processed cache
      await removeLabelResponseForOrderId(
        record.orderId,
        user.userName.substring(0, 2)
      );
      return LRes.resOk(res, { title: '面单状态已更新' });
    }
    return LRes.resErr(res, 400, { title: '取消面单失败' });
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export const batchRevertSingleShippingRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as IShipping;
    const recordId = body.id;
    const record = await ShippingRecord.findById(recordId);
    if (!record) {
      return LRes.resErr(res, 404, { title: '面单信息未找到' });
    }
    if (record.status === ShipmentStatus.DELETED) {
      return LRes.resErr(res, 400, { title: '面单状态不支持恢复' });
    }
    if (record.status === ShipmentStatus.FULFILLED) {
      return LRes.resErr(res, 400, { title: '面单状态不支持恢复' });
    }
    record.status = ShipmentStatus.FULFILLED;
    await record.save();
    return LRes.resOk(res, { title: '面单状态已更新' });
  } catch (error) {
    return LRes.resErr(res, 500, error);
  }
};

export interface UserShippingRecordsSearchQuery {
  startDate: string;
  endDate: string;
  status: string;
  orderId?: string;
  name?: string;
  phone?: string;
  trackingId?: string;
  zip?: string;
}
