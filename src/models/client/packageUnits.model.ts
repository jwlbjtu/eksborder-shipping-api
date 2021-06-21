import mongoose, { Schema } from 'mongoose';
import { DistanceUnit, WeightUnit } from '../../lib/constants';
import { IPackageUnits } from '../../types/client/packageUnits';

const PackageUnitsSchema: Schema<IPackageUnits> = new Schema<IPackageUnits>({
  weightUnit: { type: WeightUnit, default: WeightUnit.LB },
  distanceUnit: { type: DistanceUnit, default: DistanceUnit.IN },
  userRef: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

export default mongoose.model<IPackageUnits>(
  'PackageUnits',
  PackageUnitsSchema
);
