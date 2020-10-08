import mongoose, { mongo } from "mongoose";
import jwt from "jsonwebtoken";
import User from "../../src/models/user.model";
import Carrier from "../../src/models/carrier.model";
import Pickup from "../../src/models/pickup.model";
import Facility from "../../src/models/facility.model";
import Account from "../../src/models/account.model";
import {adminUser, customerUser, createUser} from "./users";
import {dhlCarrier, pbCarrier} from "./carriers";
import {dhlFacility} from "./facilities";
import {dhlPickup} from "./pickup";
import { IAccount } from "../../src/types/user.types";

const testAccountId = mongoose.Types.ObjectId();
// @ts-ignore
export const testAccount : IAccount  = {
    _id: testAccountId,
    accountName: "testAccount",
    billingType: "amount",
    fee: 2,
    note: "Unit test account",
    isTest: true,
    userRef: customerUser._id,
    carrierRef: dhlCarrier._id,
    pickupRef: dhlPickup._id,
    facilityRef: dhlFacility._id
};

const dhlAccountId = mongoose.Types.ObjectId();
// @ts-ignore
export const dhlAccount : IAccount  = {
    _id: dhlAccountId,
    accountName: "dhlAccount",
    billingType: "proportions",
    fee: 2,
    note: "Unit test dhl account",
    isTest: true,
    userRef: customerUser._id,
    carrierRef: dhlCarrier._id,
    pickupRef: dhlPickup._id,
    facilityRef: dhlFacility._id
};

const dhlAccountId2 = mongoose.Types.ObjectId();
// @ts-ignore
export const dhlAccount2 : IAccount = {
    _id: dhlAccountId2,
    accountName: "dhlAccount2",
    billingType: "proportions",
    fee: 2,
    note: "Unit test dhl account 2",
    isTest: true,
    userRef: createUser._id,
    carrierRef: dhlCarrier._id,
    pickupRef: dhlPickup._id,
    facilityRef: dhlFacility._id
};

const pbAccountId = mongoose.Types.ObjectId();
// @ts-ignore
export const pbAccount : IAccount = {
    _id: pbAccountId,
    accountName: "pbAccount",
    billingType: "amount",
    fee: 2,
    note: "Unit test pb account",
    isTest: true,
    userRef: customerUser._id,
    carrierRef: pbCarrier._id
};

export const setupDB = async () => {
    await User.deleteMany({});
    await Carrier.deleteMany({});
    await Facility.deleteMany({});
    await Pickup.deleteMany({});
    await Account.deleteMany({});

    await User.deleteMany({});
    await Carrier.deleteMany({});
    await Facility.deleteMany({});

    // Create Admin User in DB
    const adminPayload = {
        id: adminUser._id,
        fullName: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        role: adminUser.role
    }
    adminUser.tokens = [{
        token: jwt.sign(adminPayload, "test_secret")
    }]
    await new User(adminUser).save();

    // Create Customer User in DB
    const customerPayload = {
        id: customerUser._id,
        fullName: `${customerUser.firstName} ${customerUser.lastName}`,
        email: customerUser.email,
        role: customerUser.role
    }
    customerUser.apiToken = jwt.sign(customerPayload, "test_secret");
    customerUser.tokens = [{
        token: jwt.sign(customerPayload, "test_secret")
    }]
    await new User(customerUser).save();

    await new Carrier(dhlCarrier).save();
    await new Facility(dhlFacility).save();
    await new Pickup(dhlPickup).save();
    await new Account(testAccount).save();
};