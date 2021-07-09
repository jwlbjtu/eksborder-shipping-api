import mongoose, { Schema } from 'mongoose';
import { Country, Currency, WeightUnit } from '../lib/constants';
import { IItem } from '../types/record.types';

const CustomItemSchema: Schema<IItem> = new Schema<IItem>({
  itemTitle: { type: String, required: true },
  quantity: { type: Number, required: true },
  itemWeight: { type: Number, required: true },
  totalWeight: { type: Number, required: true },
  itemWeightUnit: { type: WeightUnit, default: WeightUnit.LB },
  itemValue: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  itemValueCurrency: { type: Currency, default: Currency.USD },
  country: { type: Country, default: Country.USA },
  sku: { type: String, required: true },
  hsTariffNumber: { type: String },
  shipmentRef: { type: Schema.Types.ObjectId, ref: 'Shipping', required: true }
});

CustomItemSchema.methods.toJSON = function () {
  const itemObject = this.toObject();
  itemObject.id = this._id;
  return itemObject;
};

export default mongoose.model<IItem>('CustomItem', CustomItemSchema);
