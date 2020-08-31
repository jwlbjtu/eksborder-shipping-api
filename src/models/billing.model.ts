import mongoose, {Document, Schema, Types} from 'mongoose';

export interface IBilling extends Document {
    shippingRef: object
    accountRef: object;
    userRef: object;
    shippingCost: number;
    billingType: "proportions" | "amount";
    fee: number;
    total: number;
}



const BillingSchema: Schema = new Schema({
    shippingRef: {
        type: Schema.Types.ObjectId,
        ref: "Shipping",
        required: true
    },
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

    shippingCost: {type: Number, required: true, min: 0 },
    billingType: {type: String, required: true, enum: ["proportions", "amount"], default: "amount"},
    fee: {type: Number, required: true, min: 0},
    total: {type: Number, required: true, min: 0},
});


export default mongoose.model<IBilling>('Billing', BillingSchema);