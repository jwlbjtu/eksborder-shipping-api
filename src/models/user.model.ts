import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import * as jwt from "jsonwebtoken";

import { UserRoleList } from "../lib/constants";
import { IUser } from '../types/user.types';

const UserSchema: Schema = new Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true,
        match: [/\S+@\S+\.\S+/],
        index: true,
        trim: true
    },
    firstName: { type: String, required: true, minlength:2, maxlength:100, trim: true },
    lastName: { type: String, required: true, minlength:2, maxlength:100, trim: true },
    userName: {type: String, required: true, unique: true, minlength:2, maxlength:100, trim: true},
    salt: String,
    password: {type: String, required: true, minlength: 8, trim: true},
    role: {type: String, required: true, enum: UserRoleList, default: 'customer'},
    address: {
        address1: {type: String, required: true, trim: true},
        address2: {type: String, trim: true},
        city: {type: String, required: true, minlength:3, maxlength:120, trim: true},
        state: {type: String, required: true, minlength:2, maxlength:3, trim: true},
        country: {type: String, required: true, minlength:2, maxlength:3, default: "US", trim: true},
        postalCode: {type: String, required: true, minlength:2, maxlength:10, trim: true},
    },
    phone: {type: String, minlength:5, maxlength:20, trim: true, unique: true},
    isActive: {type: Boolean, default: true},
    companyName: {type: String, required: true, minlength:2, maxlength:100, trim: true},
    logoImage: {type: Buffer},
    balance: {type: Number, min: 0, default: 0},
    currency: {type: String, default: "USD"},
    apiToken: {type: String},
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true,
    autoIndex: true,
    toJSON: {
        virtuals: true,
        getters: true,
    },
});


UserSchema.pre<IUser>("save", async function save(next) {
    const user = this;

    if(user.isModified("password")) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(user.password, salt);
        user.salt = salt;
        user.password = hashedPass;
    }

    next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.logoImage;
    delete userObject.tokens;
    delete userObject.salt;

    return userObject;
}

UserSchema.methods.generateJWT = function (expTime?: number) {
    // @ts-ignore
    const secret: string = process.env.JWT_SECRET;
    let payload: any = {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        role: this.role
    };

    if(expTime) {
        payload.exp = Math.floor(Date.now() / 1000) + expTime;
    }

    // @ts-ignore
    return jwt.sign(payload, secret);
};

UserSchema.methods.toAuthJSON = async function () {
    const user = this;

    let expTime = 3600;
    const token = this.generateJWT(expTime);

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        token_type: "Bearer",
        token,
        expire_in: expTime
    };
};

UserSchema.methods.apiAuthJSON = async function () {
    const user = this;
    const token = this.generateJWT();

    // Remove exist api token to make sure we always have one api token
    if(user.apiToken) {
        const oldToken = user.apiToken;
        user.tokens = user.tokens.filter((item: {token: string}) => {
            return item.token !== oldToken;
        })
    }

    user.apiToken = token;
    user.tokens = user.tokens.concat({ token });
    await user.save();

    return {
        email: this.email,
        token,
        token_type: "Bearer"
    }
}

UserSchema.virtual('fullName').get(function () {
    // @ts-ignore
    return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('accountRef', {
    ref: 'Account', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'userRef', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: false
});

UserSchema.virtual('shippingRef', {
    ref: 'Shipping', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'userRef', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: false
});

// Export the model and return your IUser interface
export default mongoose.model<IUser>('User', UserSchema);
