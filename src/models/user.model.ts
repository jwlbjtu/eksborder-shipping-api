import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import * as jwt from "jsonwebtoken";


export interface IUserLogin extends Document {
    email: string;
    password: string;
}

export interface IUser extends Document {
    token: any;
    salt: string;
    email: string;
    firstName: string;
    lastName: string;
    userName: string
    password: string;
    role: string;
    // pickupAccount: string,
    // facilityNumber: string,
    address?: {
        address1: string,
        address2?: string,
        city: string,
        state: string,
        country: string,
        postalCode: string,
    };
    phone: string;
    isActive: boolean;
    companyName: string,
    balance: number
}

const UserSchema: Schema = new Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: [true],
        match: [/\S+@\S+\.\S+/],
        index: true,
        trim: true
    },
    firstName: { type: String, required: true, minlength:2, maxlength:100, trim: true },
    lastName: { type: String, required: true, minlength:2, maxlength:100, trim: true },
    userName: {type: String, required: true, unique: true, minlength:2, maxlength:100, trim: true},
    hash: String,
    salt: String,
    password: {
        type: String,
        // get: (): undefined => undefined,
    },
    role: {type: String, default: 'user'},
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
    balance: {type: Number, min: 0}
    // pickupAccount: {type: String, required: true},
    // facilityNumber : {type: String, required: true}
}, {
    timestamps: true,
    autoIndex: true,
    toJSON: {
        virtuals: true,
        getters: true,
    },
});


UserSchema.pre<IUser>("save", function save(next) {
    const user = this;

    bcrypt.genSalt(10, (err, salt) => {
        if (err) { return next(err); }
        user.salt = salt;
        bcrypt.hash(this.password, salt, (err: Error, hash) => {
            if (err) { return next(err); }
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword =  function (candidatePassword: string, callback: any) {
    bcrypt.compare(candidatePassword, this.password, (err: Error, isMatch: boolean) => {
        callback(err, isMatch);
    });

};


UserSchema.methods.generateJWT = function () {
    let today = new Date();
    let exp = new Date(today);
    // @ts-ignore
    const secret: string = process.env.JWT_SECRET;

    // @ts-ignore
    return jwt.sign({
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        // pickupAccount: this.pickupAccount,
        // facilityNumber: this.facilityNumber
    }, secret);
};

UserSchema.methods.toAuthJSON = function () {
    return {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        // pickupAccount: this.pickupAccount,
        // facilityNumber: this.facilityNumber,
        token: this.generateJWT(),
    };
};

UserSchema.virtual('fullName').get(function () {
    // @ts-ignore
    return `${this.firstName} ${this.lastName}`;
});


// Export the model and return your IUser interface
export default mongoose.model<IUser>('User', UserSchema);
