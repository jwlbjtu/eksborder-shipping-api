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
    accessKey: { type: String },
    accountNum: { type: String },
    returnAddress: {
      type: {
        name: { type: String, trim: true },
        attentionName: { type: String },
        company: { type: String, trim: true },
        taxIdNum: { type: String },
        street1: { type: String, trim: true },
        street2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, default: 'US', trim: true },
        postalCode: { type: String, trim: true },
        email: { type: String, match: [/\S+@\S+\.\S+/], trim: true },
        phone: { type: String, trim: true },
        shipperNum: { type: String }
      }
    },
    testClientId: { type: String, minlength: 3, trim: true },
    testClientSecret: {
      type: String,
      minlength: 3,
      trim: true
    },
    facilities: {
      type: [
        {
          pickup: { type: String, required: true, trim: true },
          facility: { type: String, required: true, trim: true }
        }
      ]
    },
    testFacilities: {
      type: [
        {
          pickup: { type: String, required: true, trim: true },
          facility: { type: String, required: true, trim: true }
        }
      ]
    },
    services: {
      type: [
        {
          key: { type: String, required: true },
          id: { type: String },
          name: { type: String, required: true }
        }
      ]
    },
    shipperId: { type: String },
    regions: { type: [String], required: true },
    isActive: { type: Boolean, default: true },
    thirdparties: {
      type: [
        {
          thirdpartyRef: { type: String },
          condition: {
            type: {
              minWeight: { type: Number },
              maxWeight: { type: Number },
              weightUnit: { type: String }
            }
          }
        }
      ]
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

CarrierSchema.methods.toJSON = function () {
  const carrierObject = this.toObject();
  carrierObject.id = this._id;
  return carrierObject;
};

export default mongoose.model<ICarrier>('Carrier', CarrierSchema);
