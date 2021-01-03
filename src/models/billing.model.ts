import mongoose, { Schema, Types } from 'mongoose';
import { IBilling } from '../types/record.types';

const BillingSchema: Schema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: { type: String, required: true },
    account: { type: String },
    total: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    details: {
      type: {
        shippingCost: {
          amount: { type: Number, required: true, min: 0 },
          components: [
            {
              description: { type: String, required: true },
              amount: { type: Number, required: true, min: 0 }
            }
          ]
        },
        fee: {
          amount: { type: Number, required: true, min: 0 },
          type: { type: String },
          base: { type: String }
        }
      }
    },
    addFund: { type: Boolean, default: false }
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
