import mongoose, {Document, Schema, Types} from 'mongoose';

export interface IShipping extends Document {
    request: object;
    response: object | any;
    isError: boolean;
    callType: string;
    accountRef: object;
    userRef: object;
}


const ShippingSchema: Schema = new Schema({
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


export default mongoose.model<IShipping>('Shipping', ShippingSchema);
