import mongoose, { Schema } from 'mongoose';
import { FILE_FORMATS, FILE_TYPES } from '../../lib/constants';
import { IPrintFormat } from '../../types/client/printformat';

const PrintFormatSchema: Schema<IPrintFormat> = new Schema<IPrintFormat>({
  labelFormat: {
    format: { type: String, default: FILE_FORMATS.thermal },
    type: { type: String, default: FILE_TYPES.pdf }
  },
  packSlipFormat: {
    format: { type: String, default: FILE_FORMATS.standard },
    type: { type: String, default: FILE_TYPES.pdf }
  },
  userRef: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

export default mongoose.model<IPrintFormat>('PrintFormat', PrintFormatSchema);
