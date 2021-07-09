import monggose, { Schema } from 'mongoose';
import { IPriceTable } from '../types/record.types';

const PriceTable: Schema = new Schema({
  name: { type: String, required: true },
  carrier: { type: String, required: true },
  service: {
    type: {
      key: { type: String, required: true },
      id: { type: String },
      name: { type: String, required: true }
    },
    required: true
  },
  region: { type: String, required: true },
  condition: {
    type: {
      minWeight: { type: Number },
      maxWeight: { type: Number },
      weightUnit: { type: String }
    },
    required: true
  },
  price: {
    type: {
      weightUnit: { type: String, required: true },
      currency: { type: String, required: true },
      data: { type: [{ type: Map, of: String }] }
    }
  },
  zones: { type: [String] },
  zoneMap: {
    type: [
      {
        zone: { type: String, required: true },
        maps: { type: String, default: '' }
      }
    ]
  },
  rates: {
    type: [
      {
        ratebase: { type: String, required: true },
        weightUnit: { type: String },
        currency: { type: String, required: true },
        rate: { type: Number, required: true },
        ratetype: { type: String, required: true }
      }
    ],
    default: []
  },
  carrierRef: { type: Schema.Types.ObjectId, ref: 'Carrier', required: true }
});

PriceTable.methods.toJSON = function () {
  const accountObject = this.toObject();
  accountObject.id = this._id;
  return accountObject;
};

export default monggose.model<IPriceTable>('PriceTable', PriceTable);
