import mongoose, {Document, Schema} from 'mongoose';

export interface ICarrier extends Document {
    accountCode: string, // TODO: change to carrierName
    accountName: string,
    clientId: string,
    clientSecret: string,
    isTest: boolean,
    returnAddress: {
        name?: string,
        companyName: string,
        street1: string,
        street2?: string,
        city: string,
        state: string,
        country: string,
        postalCode: string,
        email: string,
        phone: number
    },
    pickupRef: [],
    facilityRef: [],
    isActive: boolean
}

const CarrierSchema: Schema = new Schema({
    accountCode: {type: String, required: true, unique: true, minlength:2, trim: true},
    accountName: {type: String, required: true, minlength:3, maxlength:250, trim: true},
    clientId: {type: String, required: true, minlength:3, trim: true},
    clientSecret: {type: String, required: true, minlength:3, trim: true},
    isTest: {type: Boolean, default: false},
    returnAddress: {
        name: {type: String, trim: true},
        companyName: {type: String, required: true, trim: true},
        street1: {type: String, required: true, trim: true},
        street2: {type: String, trim: true},
        city: {type: String, required: true, minlength:3, maxlength:120, trim: true},
        state: {type: String, required: true, minlength:2, maxlength:3, trim: true},
        country: {type: String, required: true, minlength:2, maxlength:3, default: "US", trim: true},
        postalCode: {type: String, required: true, minlength:2, maxlength:10, trim: true},
        email: {type: String, lowercase: true, match: [/\S+@\S+\.\S+/], trim: true},
        phone: {type: String, minlength:5, maxlength:20, trim: true},
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
