import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserRoleList, USER_ROLES } from '../lib/constants';
import Account from '../models/account.model';
import Billing from '../models/billing.model';
import Shipping from '../models/shipping.model';
import Manifest from '../models/manifest.model';
import Log from '../models/log.model';
import {
  ClientInfo,
  IUser,
  UserData,
  ClientAccount
} from '../types/user.types';
import _ from 'lodash';

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
      match: [/\S+@\S+\.\S+/],
      index: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      minlength: 2,
      maxlength: 100,
      trim: true
    },
    salt: String,
    password: { type: String, required: true, minlength: 8, trim: true },
    role: {
      type: String,
      required: true,
      enum: UserRoleList,
      default: USER_ROLES.API_USER,
      index: true
    },
    address: {
      type: {
        street1: { type: String, required: true, trim: true },
        street2: { type: String, trim: true },
        city: {
          type: String,
          required: true,
          maxlength: 120,
          trim: true
        },
        state: {
          type: String,
          required: true,
          maxlength: 3,
          trim: true
        },
        country: {
          type: String,
          required: true,
          maxlength: 3,
          default: 'US',
          trim: true
        },
        postalCode: {
          type: String,
          required: true,
          maxlength: 10,
          trim: true
        }
      }
    },
    countryCode: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      minlength: 5,
      maxlength: 20,
      trim: true,
      unique: true
    },
    isActive: { type: Boolean, default: true },
    companyName: {
      type: String,
      maxlength: 100,
      trim: true
    },
    logoImage: { type: String },
    balance: { type: Number, min: 0, default: 0, required: true },
    minBalance: { type: Number, min: 0, default: 0, required: true },
    currency: { type: String, default: 'USD' },
    referalName: { type: String },
    apiToken: { type: String },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    resetToken: { type: String },
    resetTokenExpiration: { type: Number },
    uploading: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    autoIndex: true,
    toJSON: {
      virtuals: true,
      getters: true
    }
  }
);

UserSchema.pre<IUser>('save', async function save(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt();
    const hashedPass = await bcrypt.hash(this.password, salt);
    this.salt = salt;
    this.password = hashedPass;
  }

  next();
});

UserSchema.pre('remove', async function (next) {
  await Account.deleteMany({ userRef: this._id });
  await Billing.deleteMany({ userRef: this._id });
  await Shipping.deleteMany({ userRef: this._id });
  await Manifest.deleteMany({ userRef: this._id });
  await Log.deleteMany({ userRef: this._id });
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  userObject.id = this._id;

  userObject.password = '';
  delete userObject.tokens;
  userObject.salt = '';

  return userObject;
};

UserSchema.methods.generateJWT = function (expTime?: number) {
  // @ts-expect-error: ignore
  const secret: string = process.env.JWT_SECRET;
  const payload: any = {
    id: this.id,
    fullName: this.fullName,
    role: this.role
  };

  if (expTime) {
    payload.exp = Math.floor(Date.now() / 1000) + expTime;
  }

  return jwt.sign(payload, secret);
};

UserSchema.methods.toAuthJSON = async function () {
  const expTime = 3600;
  const token = this.generateJWT(expTime);

  this.tokens = this.tokens ? this.tokens.concat({ token }) : [{ token }];
  await this.save();

  const result: UserData = {
    id: this.id,
    fullName: this.fullName,
    firstName: this.firstName,
    lastName: this.lastName,
    userName: this.userName,
    role: this.role,
    email: this.email,
    countryCode: this.countryCode,
    phone: this.phone,
    companyName: this.companyName,
    logoImage: this.logoImage,
    balance: this.balance,
    currency: this.currency,
    isActive: this.isActive,
    token_type: 'Bearer',
    token,
    tokenExpire: Date.now() + 60 * 60 * 1000
  };
  return result;
};

UserSchema.methods.toClientInfo = async function () {
  const expTime = 3600;
  const token = this.generateJWT(expTime);

  this.tokens = this.tokens ? this.tokens.concat({ token }) : [{ token }];
  await this.save();

  const result: ClientInfo = {
    id: this.id,
    fullName: this.fullName,
    firstName: this.firstName,
    lastName: this.lastName,
    userName: this.userName,
    role: this.role,
    email: this.email,
    countryCode: this.countryCode,
    phone: this.phone,
    companyName: this.companyName,
    logoImage: this.logoImage,
    balance: this.balance,
    currency: this.currency,
    isActive: this.isActive,
    token_type: 'Bearer',
    token,
    tokenExpire: Date.now() + 60 * 60 * 1000,
    printFormat: this.printFormat,
    packageUnits: this.packageUnits,
    clientAddresses: this.addresses,
    clientAccounts: this.accountRef?.map((ele) => {
      const accountData: ClientAccount = {
        id: ele.id,
        accountName: ele.accountName,
        accountId: ele.accountId,
        carrier: ele.carrier,
        connectedAccount: ele.connectedAccount,
        services: ele.services,
        facilities: ele.facilities,
        carrierRef: ele.carrierRef,
        userRef: ele.userRef,
        note: ele.note,
        isActive: ele.isActive
      };
      return accountData;
    })
  };
  return result;
};

UserSchema.methods.apiAuthJSON = async function () {
  const token = this.generateJWT();

  // Remove exist api token to make sure we always have one api token
  if (this.apiToken && this.tokens) {
    const oldToken = this.apiToken;
    this.tokens = this.tokens.filter((item: { token: string }) => {
      return item.token !== oldToken;
    });
  }

  this.apiToken = token;
  this.tokens = this.tokens ? this.tokens.concat({ token }) : [{ token }];
  await this.save();

  return {
    email: this.email,
    token,
    token_type: 'Bearer'
  };
};

UserSchema.virtual('fullName').get(function () {
  // @ts-expect-error: ignore
  return `${this.lastName}${this.firstName}`;
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

UserSchema.virtual('printFormat', {
  ref: 'PrintFormat', // The model to use
  localField: '_id', // Find people where `localField`
  foreignField: 'userRef', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: true
});

UserSchema.virtual('packageUnits', {
  ref: 'PackageUnits', // The model to use
  localField: '_id', // Find people where `localField`
  foreignField: 'userRef', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: true
});

UserSchema.virtual('addresses', {
  ref: 'Address', // The model to use
  localField: '_id', // Find people where `localField`
  foreignField: 'userRef', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: false
});

// Export the model and return your IUser interface
export default mongoose.model<IUser>('User', UserSchema);
