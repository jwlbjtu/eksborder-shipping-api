import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import * as jwt from "jsonwebtoken";

const addressSchema: Schema = new Schema({
    city: String,
    country: String,
    street: String,
});

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
    password: string;
    role: string;
    address?: {
        street: string,
        city: string,
        country: String,
    };
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
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    hash: String,
    salt: String,
    password: {
        type: String,
        // get: (): undefined => undefined,
    },
    role: {type: String, defaultValue: 'user'},
    address: addressSchema,
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
        this.salt = salt;
        bcrypt.hash(this.password, salt, (err: Error, hash) => {
            if (err) { return next(err); }
            user.password = hash;
            user.save();
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
        parentUserRef: this.parentUserRef,
        singingType: this.singingType
    }, secret);
};

UserSchema.methods.toAuthJSON = function () {
    return {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        token: this.generateJWT(),
    };
};

UserSchema.virtual('fullName').get(function () {
    // @ts-ignore
    return `${this.firstName} ${this.lastName}`;
});


// Export the model and return your IUser interface
export default mongoose.model<IUser>('User', UserSchema);
