import mongoose, { Schema } from 'mongoose';
import ObjectId from 'mongodb';
import { IPickup } from '../types/record.types';

const PickupSchema: Schema = new Schema(
  {
    pickupAccount: {
      type: String,
      required: true,
      unique: true,
      minlength: 2,
      maxlength: 100,
      trim: true
    },
    description: { type: String, trim: true },
    carrierRef: {
      type: Schema.Types.ObjectId,
      ref: 'Carrier',
      required: true
    },
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

PickupSchema.pre<IPickup>('save', function save(next) {
  // const pickup = this;

  if (typeof this.carrierRef === 'string') {
    // @ts-expect-error: ignore
    this.carrierRef = ObjectId(this.carrierRef);
  }
  next();
});

export default mongoose.model<IPickup>('Pickup', PickupSchema);
