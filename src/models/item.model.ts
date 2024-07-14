import mongoose, { Schema } from 'mongoose';
import { WeightUnit, Country, Currency } from '../lib/constants';
import { IItem } from '../types/record.types';

const ItemSchema: Schema<IItem> = new Schema<IItem>({
  index: { type: Number },
  itemTitle: { type: String, required: true },
  quantity: { type: Number, required: true },
  itemWeight: { type: Number },
  totalWeight: { type: Number },
  itemWeightUnit: { type: WeightUnit, default: WeightUnit.LB },
  itemValue: { type: Number },
  totalValue: { type: Number, required: true },
  itemValueCurrency: { type: Currency, default: Currency.USD },
  country: { type: Country, default: Country.USA },
  sku: { type: String },
  shipmentRef: { type: Schema.Types.ObjectId, ref: 'Shipping', required: true }
});

ItemSchema.methods.toJSON = function () {
  const itemObject = this.toObject();
  itemObject.id = this._id;
  return itemObject;
};

export default mongoose.model<IItem>('Item', ItemSchema);
