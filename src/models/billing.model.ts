import mongoose, { Schema } from 'mongoose';
import { Currency } from '../lib/constants';
import { IBilling } from '../types/record.types';

const BillingSchema: Schema<IBilling> = new Schema<IBilling>(
  {
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: { type: String },
    description: { type: String, required: true },
    account: { type: String },
    total: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true },
    deposit: { type: Number, required: true },
    clientDeposit: { type: Number, required: true },
    currency: { type: String, required: true },
    details: {
      type: {
        shippingCost: {
          amount: { type: Number, required: true, min: 0 },
          currency: { type: String, required: true, default: Currency.USD }
        },
        fee: {
          amount: { type: Number, required: true, min: 0 },
          currency: { type: String, required: true, default: Currency.USD }
        }
      }
    },
    addFund: { type: Boolean, default: false },
    invoice: { type: String }
  },
  {
    timestamps: true
  }
);

BillingSchema.methods.toJSON = function () {
  const billingObject = this.toObject();
  billingObject.id = this._id;
  return billingObject;
};

export default mongoose.model<IBilling>('Billing', BillingSchema);
