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
    service: {
      type: {
        key: { type: String, required: true },
        id: { type: String },
        name: { type: String, required: true }
      }
    },
    facility: { type: String },
    rates: {
      type: [
        {
          ratebase: { type: String, required: true },
          weightUnit: { type: String },
          currency: { type: String, required: true },
          rate: { type: Number, required: true },
          ratetype: { type: String, required: true }
        }
      ],
      default: []
    },
    thirdpartyPrice: { type: Boolean, default: false },
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
    isActive: { type: Boolean, default: true },
    payOffline: { type: Boolean, default: false }
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
