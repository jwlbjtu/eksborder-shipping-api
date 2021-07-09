import { Document, Types } from 'mongoose';
import { DistanceUnit, WeightUnit } from '../constants';

export interface PackageUnitsData {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  userRef: Types.ObjectId;
}

export interface PackageUnits {
  id: Types.ObjectId;
}

export interface IPackageUnits extends Document {
  id: Types.ObjectId;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  userRef: Types.ObjectId;
}
