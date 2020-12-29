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
      trim: true
    },
    carrierRef: {
      type: Schema.Types.ObjectId,
      ref: 'Carrier',
      required: true
    },
    pickupRef: {
      type: Schema.Types.ObjectId,
      ref: 'Pickup'
    },
    facilityRef: {
      type: Schema.Types.ObjectId,
      ref: 'Facility'
    },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    billingType: {
      type: String,
      required: true,
      enum: ['proportions', 'amount'],
      default: 'amount'
    },
    fee: { type: Number, required: true, min: 0 },
    apiId: { type: String, required: false, trim: true },
    note: { type: String, trim: true },
    isTest: { type: Boolean, default: true },
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

export default mongoose.model<IAccount>('Account', AccountSchema);
