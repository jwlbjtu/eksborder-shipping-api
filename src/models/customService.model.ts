import mongoose, { Schema } from 'mongoose';
import { ICustomService } from '../types/record.types';

const CustomServiceSchema: Schema<ICustomService> = new Schema<ICustomService>({
  name: { type: String, required: true },
  description: { type: String },
  carrierId: { type: Schema.Types.ObjectId, required: true },
  services: [
    {
      name: { type: String, required: true },
      code: { type: String, required: true },
      conditions: [
        {
          type: { type: String, required: true },
          fields: { type: Map, of: Schema.Types.Mixed }
        }
      ],
      isBackup: { type: Boolean, default: false }
    }
  ],
  active: { type: Boolean, default: true }
});

export default mongoose.model<ICustomService>(
  'CustomService',
  CustomServiceSchema
);
