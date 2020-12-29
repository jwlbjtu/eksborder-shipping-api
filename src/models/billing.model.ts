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
        type: { type: String }
      }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IBilling>('Billing', BillingSchema);
