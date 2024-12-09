import mongoose, { Schema } from 'mongoose';
import { AccountingItemDocument } from '../types/accounting.types';

const AccountingItemSchema: Schema<AccountingItemDocument> =
  new Schema<AccountingItemDocument>(
    {
      status: { type: Number, required: true },
      weight: { type: Number, required: true },
      weightType: { type: String, required: true },
      uspsState: { type: String, required: true },
      pieceId: { type: String, required: true },
      trackingNumber: { type: String, required: true },
      amount: { type: Number, required: true },
      baseAmount: { type: Number, required: true },
      channel: { type: String, required: true },
      orderId: { type: String, required: true },
      orderDate: { type: String, required: true },
      recordRef: {
        type: Schema.Types.ObjectId,
        ref: 'Reconciliation',
        required: true
      },
      userRef: { type: String },
      userName: { type: String },
      remark: { type: String },
      zone: { type: String },
      docName: { type: String }
    },
    {
      timestamps: true
    }
  );

AccountingItemSchema.methods.toJSON = function () {
  const accountingItemObject = this.toObject();
  accountingItemObject.id = this._id;
  return accountingItemObject;
};

export default mongoose.model<AccountingItemDocument>(
  'AccountingItem',
  AccountingItemSchema
);
