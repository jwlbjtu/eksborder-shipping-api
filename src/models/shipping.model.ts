import mongoose, { Schema } from 'mongoose';
import { IShipping } from '../types/record.types';

const ShippingSchema: Schema = new Schema(
  {
    accountName: { type: String, required: true },
    carrier: { type: String, required: true },
    provider: { type: String },
    service: { type: String, required: true },
    facility: { type: String },
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
    shippingId: { type: String },
    trackingId: { type: String, required: true, index: true },
    rate: { type: Number, required: true },
    manifested: { type: Boolean, required: true, default: false },
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
    packageInfo: {
      weight: {
        value: { type: Number },
        unitOfMeasure: { type: String, enum: ['BL', 'OZ', 'KG', 'G'] }
      },
      dimension: {
        type: {
          length: { type: Number, required: true },
          width: { type: Number, required: true },
          height: { type: Number, required: true },
          unitOfMeasure: { type: String, enum: ['IN', 'CM'] }
        },
        required: false
      }
    },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    billingRef: {
      type: Schema.Types.ObjectId,
      ref: 'Billing',
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
