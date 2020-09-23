import { Document } from "mongoose";

export interface IUserLogin extends Document {
    email: string;
    password: string;
    isActive: boolean;
}

export interface IUser extends Document {
    id: object,
    token: any,
    salt: string,
    email: string,
    firstName: string,
    lastName: string;
    userName: string;
    password: string;
    role: "admin_super" | "admin" |  "customer";
    address?: {
        address1: string,
        address2?: string,
        city: string,
        state: string,
        country: string,
        postalCode: string,
    };
    phone: string,
    isActive: boolean,
    companyName: string,
    logoImage?: Buffer,
    balance: number,
    currency: string,
    accountRef: {},
    apiToken?: string
}

export interface IAccount extends Document {
    id: object,
    accountName: string;
    carrierRef: object;
    pickupRef?: object;
    userRef: object;
    facilityRef?: object;
    billingType: "proportions" | "amount";
    fee: number;
    apiId?: string;
    note?: string;
    isTest: boolean;
    isActive: boolean;
}