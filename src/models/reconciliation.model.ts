import mongoose, { Schema } from 'mongoose';
import { ReconciliationRecordDocument } from '../types/accounting.types';

const ReconciliationSchema: Schema<ReconciliationRecordDocument> =
  new Schema<ReconciliationRecordDocument>(
    {
      date: { type: Date, required: true },
      name: { type: String, required: true },
      status: { type: Number, required: true, default: 0 },
      sucessCount: { type: Number, required: true, default: 0 },
      failedCount: { type: Number, required: true, default: 0 }
    },
    {
      timestamps: true
    }
  );

ReconciliationSchema.methods.toJSON = function () {
  const reconciliationObject = this.toObject();
  reconciliationObject.id = this._id;
  return reconciliationObject;
};

export default mongoose.model<ReconciliationRecordDocument>(
  'Reconciliation',
  ReconciliationSchema
);
