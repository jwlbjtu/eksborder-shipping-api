import { Request, Response } from 'express';
import LRes from '../../lib/lresponse.lib';
import User from '../../models/user.model';
import ShippingRecord from '../../models/shipping.model';
import { Types } from 'mongoose';
import { ShipmentStatus } from '../../lib/constants';
import BillingSchema from '../../models/billing.model';
import { updateUserBalanceAndDeposit } from '../../lib/utils/user.balance.utils';
import { removeLabelResponseForOrderId } from '../../lib/utils/api.utils';

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
