import mongoose, {Document, Schema, Types} from 'mongoose';

export interface IAccount extends Document {
    accountName: string;
    carrierRef: object;
    pickupRef: object;
    userRef: object;
    facilityRef: object;
    billingType: "proportions" | "amount";
    fee: number;
    apiId: string;
    note: string;
    isTest: boolean;
    isActive: boolean;
}



const AccountSchema: Schema = new Schema({
    accountName: {type: String, required: true, unique: true, minlength:2, maxlength:100, trim: true},
    carrierRef: {
        type: Schema.Types.ObjectId,
        ref: "Carrier",
        required: true
    },
    pickupRef: {
        type: Schema.Types.ObjectId,
        ref: "Pickup",
        required: true
    },
    facilityRef: {
        type: Schema.Types.ObjectId,
        ref: "Facility",
        required: true
    },
    userRef: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    billingType: {type: String, required: true, enum: ["proportions", "amount"], default: "amount"},
    fee: {type: Number, required: true, min: 0},
    apiId: {type: String, required: false, trim: true},
    note: {type: String, trim: true},
    isTest: {type: Boolean, default: true},
    isActive: {type: Boolean, default: true}
}, {
    timestamps: true,
    autoIndex: true,
    toJSON: {
        virtuals: true,
        getters: true,
    },
});

AccountSchema.virtual('shippingRef', {
    ref: 'Shipping', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'accountRef', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: false
});

export default mongoose.model<IAccount>('Account', AccountSchema);
