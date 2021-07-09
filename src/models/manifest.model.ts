import mongoose, { Schema } from 'mongoose';
import { IManifest } from '../types/carriers/dhl_ecommerce';

const ManifestSchema: Schema = new Schema(
  {
    carrier: { type: String, required: true },
    timestamp: { type: Date, required: true },
    facility: { type: String },
    pickup: { type: String },
    requestId: { type: String, required: true, index: true },
    status: { type: String, index: true },
    link: { type: String },
    manifests: {
      type: [
        {
          createdOn: { type: Date },
          manifestId: { type: String, required: true },
          distributionCenter: { type: String },
          manifestData: { type: String, required: true },
          encodeType: { type: String, required: true },
          format: { type: String, required: true }
        }
      ],
      default: []
    },
    manifestErrors: { type: [String], default: [] },
    userRef: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    carrierRef: { type: Schema.Types.ObjectId, ref: 'Account', required: true }
  },
  {
    timestamps: true,
    autoIndex: true,
    toJSON: {
      virtuals: true,
      getters: true
    }
  }
);

ManifestSchema.methods.toJSON = function () {
  const manifestObject = this.toObject();
  manifestObject.id = this._id;
  return manifestObject;
};

export default mongoose.model<IManifest>('Manifest', ManifestSchema);
