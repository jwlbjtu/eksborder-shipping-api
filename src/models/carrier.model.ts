import mongoose, { Schema } from 'mongoose';
import { ICarrier } from '../types/record.types';

const CarrierSchema: Schema = new Schema(
  {
    carrierName: {
      type: String,
      required: true,
      minlength: 2,
      trim: true
    },
    accountName: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 250,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    clientId: { type: String, required: true, minlength: 3, trim: true },
    clientSecret: { type: String, required: true, minlength: 3, trim: true },
    facilities: [
      {
        pickup: { type: String, required: true, trim: true },
        facility: { type: String, required: true, trim: true }
      }
    ],
    services: [
      {
        key: { type: String, required: true },
        name: { type: String, required: true }
      }
    ],
    returnAddress: {
      name: { type: String, trim: true },
      company: { type: String, required: true, trim: true },
      street1: { type: String, required: true, trim: true },
      street2: { type: String, trim: true },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      },
      country: {
        type: String,
        required: true,
        default: 'US',
        trim: true
      },
      postalCode: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        lowercase: true,
        match: [/\S+@\S+\.\S+/],
        trim: true
      },
      phone: { type: String, trim: true }
    },
    shipperId: { type: String },
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

export default mongoose.model<ICarrier>('Carrier', CarrierSchema);
