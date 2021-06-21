import mongoose, { Schema } from 'mongoose';
import { Country } from '../../lib/constants';
import { IClientAddress } from '../../types/client/address';

const ClientAddressSchema: Schema<IClientAddress> = new Schema<IClientAddress>({
  name: { type: String, required: true, trim: true },
  company: { type: String },
  email: { type: String },
  phone: { type: String },
  country: { type: Country, required: true, default: Country.USA },
  street1: { type: String, required: true },
  street2: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  zip: { type: String },
  isDefaultSender: { type: Boolean, default: false },
  isDefaultReturn: { type: Boolean, default: false },
  userRef: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

ClientAddressSchema.methods.toJSON = function () {
  const addressObject = this.toObject();
  addressObject.id = this._id;
  return addressObject;
};

export default mongoose.model<IClientAddress>('Address', ClientAddressSchema);
