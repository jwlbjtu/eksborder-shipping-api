import { Document } from 'mongoose';

export interface IdMap {
  currentId: number;
  maxId: number;
}

export interface ISystemId extends Document {
  biz_type: string;
  minId: number;
  step: number;
  version: number;
}
