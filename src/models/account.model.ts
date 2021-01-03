import mongoose, { Schema } from 'mongoose';
import { IAccount } from '../types/user.types';

const AccountSchema: Schema = new Schema(
  {
    accountName: {
      type: String,
      required: true,
      unique: true,
      minlength: 2,
      maxlength: 100,
      trim: true,
      index: true
    },
    accountId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    carrier: { type: String, required: true },
    connectedAccount: { type: String, required: true },
    services: [String],
    facilities: [String],
    fee: { type: Number, required: true, min: 0 },
    feeBase: {
      type: String,
      required: true,
      enum: ['price', 'order', 'weight']
    },
    billingType: {
      type: String,
      required: true,
      enum: ['proportions', 'amount'],
      default: 'amount'
    },
    carrierRef: {
      type: Schema.Types.ObjectId,
      ref: 'Carrier',
      required: true
    },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    autoIndex: true,
    toJSON: {
      virtuals: true,
      getters: true
    }
  }
);

AccountSchema.methods.toJSON = function () {
  const accountObject = this.toObject();
  accountObject.id = this._id;
  return accountObject;
};

export default mongoose.model<IAccount>('Account', AccountSchema);
