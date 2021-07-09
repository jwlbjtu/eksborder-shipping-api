import mongoose, { Schema } from 'mongoose';
import { ISystemId } from '../types/IdGenerator';

const SystemIdSchema: Schema = new Schema({
  biz_type: { type: String, reuqired: true, index: true },
  minId: { type: Number, required: true },
  step: { type: Number, required: true },
  version: { type: Number, required: true }
});

SystemIdSchema.methods.toJSON = function () {
  const systemIdObj = this.toObject();
  systemIdObj.id = this._id;
  return systemIdObj;
};

export default mongoose.model<ISystemId>('SystemId', SystemIdSchema);
