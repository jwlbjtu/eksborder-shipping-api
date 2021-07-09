import { Document, Types } from 'mongoose';

export interface PrintSetting {
  format: string;
  type: string;
}

export interface PrintFormatData {
  labelFormat: PrintSetting;
  packSlipFormat: PrintSetting;
  userRef: Types.ObjectId;
}

export interface PrintFormat extends PrintFormatData {
  id: Types.ObjectId;
}

export interface IPrintFormat extends Document {
  id: Types.ObjectId;
  labelFormat: PrintSetting;
  packSlipFormat: PrintSetting;
  userRef: Types.ObjectId;
}
