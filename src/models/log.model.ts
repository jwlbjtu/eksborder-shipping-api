import mongoose, { Schema } from 'mongoose';
import { ILog } from '../types/record.types';

const LogSchema: Schema = new Schema({
    request: {type: Object, required: true},
    response: {type: Object},
    isError: {type: Boolean, default: false},
    callType: {type: String, trim: true, required: true},
    accountRef: {
        type: Schema.Types.ObjectId,
        ref: "Account",
        required: true
    },
    userRef: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, {
    timestamps: true,
    autoIndex: true,
    toJSON: {
        virtuals: true,
        getters: true,
    },
});

export default mongoose.model<ILog>('Logging', LogSchema);
