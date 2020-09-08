import mongoose, { Schema } from 'mongoose';
import ObjectId from "mongodb";
import { IFacility } from '../types/record.types';

const FacilitySchema: Schema = new Schema({
    facilityNumber: {type: String, required: true, unique: true, minlength:2, maxlength:100, trim: true},
    description: {type: String, trim: true},
    carrierRef: {
        type: Schema.Types.ObjectId,
        ref: "Carrier",
        required: true
    },
    isActive: {type: Boolean, default: true}
}, {
    timestamps: true,
    autoIndex: true,
    toJSON: {
        virtuals: true,
        getters: true,
    },
});


FacilitySchema.pre<IFacility>("save", function save(next) {
    const facility = this;

    if (typeof facility.carrierRef ==="string") {
        // @ts-ignore
        facility.carrierRef = ObjectId(facility.carrierRef);
    }
    next();
});


export default mongoose.model<IFacility>('Facility', FacilitySchema);
