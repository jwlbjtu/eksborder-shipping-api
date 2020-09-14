import mongoose, { Schema } from 'mongoose';
import { ICarrier } from '../types/record.types';
import Pickup from "../models/pickup.model";
import Facility from "../models/facility.model";

const CarrierSchema: Schema = new Schema({
    carrierName: {type: String, required: true, unique: true, minlength:2, trim: true},
    accountName: {type: String, required: true, minlength:3, maxlength:250, trim: true},
    clientId: {type: String, required: true, minlength:3, trim: true},
    clientSecret: {type: String, required: true, minlength:3, trim: true},
    isTest: {type: Boolean, default: false},
    returnAddress: {
        name: {type: String, trim: true},
        company: {type: String, required: true, trim: true},
        street1: {type: String, required: true, trim: true},
        street2: {type: String, trim: true},
        city: {type: String, required: true, minlength:3, maxlength:120, trim: true},
        state: {type: String, required: true, minlength:2, maxlength:3, trim: true},
        country: {type: String, required: true, minlength:2, maxlength:3, default: "US", trim: true},
        postalCode: {type: String, required: true, minlength:2, maxlength:10, trim: true},
        email: {type: String, lowercase: true, match: [/\S+@\S+\.\S+/], trim: true},
        phone: {type: String, minlength:5, maxlength:20, trim: true},
    },
    shipperId: {type: String},
    isActive: {type: Boolean, default: true}
}, {
    timestamps: true,
    autoIndex: true,
    toJSON: {
        virtuals: true,
        getters: true,
    },
});

CarrierSchema.pre("remove", async function (next: any) {
    const carrier = this;
    await Pickup.deleteMany({ carrierRef: carrier._id });
    await Facility.deleteMany({ carrierRef: carrier._id });
    next();
});

CarrierSchema.virtual('pickupRef', {
    ref: 'Pickup', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'carrierRef', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: false
});

CarrierSchema.virtual('facilityRef', {
    ref: 'Facility', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'carrierRef', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: false
});

export default mongoose.model<ICarrier>('Carrier', CarrierSchema);
