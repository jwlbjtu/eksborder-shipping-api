import mongoose, { Schema } from 'mongoose';
import { IManifestResponse } from '../types/shipping.types';

const ManifestSchema: Schema = new Schema(
  {
    timestamp: { type: Date, required: true },
    carrier: { type: String, required: true },
    provider: { trye: String },
    carrierAccount: { type: String, required: true },
    facility: { type: String },
    requestId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['CREATED', 'IN PROGRESS', 'COMPLETED'],
      index: true
    },
    manifests: [
      {
        createdOn: { type: Date, required: true },
        manifestId: { type: String, required: true },
        total: { type: Number, required: true },
        manifestData: { type: String, required: true },
        encodeType: { type: String, required: true },
        format: { type: String, required: true }
      }
    ],
    manifestSummary: {
      total: { type: Number },
      invalid: {
        total: { type: Number },
        trackingIds: [
          {
            trackingId: { type: String, required: true },
            errorCode: { type: String, required: true },
            errorDescription: { type: String, required: true }
          }
        ]
      }
    },
    trackingIds: [String],
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
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

export default mongoose.model<IManifestResponse>('Manifest', ManifestSchema);
