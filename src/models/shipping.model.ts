import mongoose, { Schema } from 'mongoose';
import { IShipping } from '../types/record.types';

const ShippingSchema: Schema = new Schema(
  {
    timestamp: { type: Date, required: true },
    carrier: { type: String, required: true },
    provider: { type: String },
    service: { type: String, required: true },
    labels: [
      {
        createdOn: { type: Date },
        trackingId: { type: String },
        labelData: { type: String },
        encodeType: { type: String },
        parcelType: { type: String },
        format: { type: String }
      }
    ],
    toAddress: {
      name: { type: String },
      company: { type: String },
      street1: { type: String, required: true },
      street2: { type: String },
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
      email: { type: String },
      phone: { type: String }
    },
    trackingId: { type: String, required: true, index: true },
    shippingId: { type: String },
    manifested: { type: Boolean, required: true, default: false },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
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

export default mongoose.model<IShipping>('Shipping', ShippingSchema);
