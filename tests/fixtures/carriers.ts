import jwt from "jsonwebtoken";
import User from "../../src/models/user.model";
import Carrier from "../../src/models/carrier.model";
import mongoose from "mongoose";
import { ICarrier } from "../../src/types/record.types";
import { adminUser } from "./users";

const dhlCarrierId = mongoose.Types.ObjectId();
// @ts-ignore
export const dhlCarrier: ICarrier = {
    _id: dhlCarrierId,
    carrierName: "DHL eCommerce",
    accountName: "DHL eCommerce Test Account",
    clientId: "RaEafduuLOTpFKXQ4M0LPtcwpiaWNu2m",
    clientSecret: "kgEG3LTXRa2dVJXo",
    returnAddress: {
        company: "Eksborder Inc",
        street1: "59 Apsley Street",
        street2: "Suite 11A",
        city: "Hudson",
        state: "MA",
        country: "US",
        postalCode: "01749"
    },
    isTest: true
};

const pbCarrierId = mongoose.Types.ObjectId();
// @ts-ignore
export const pbCarrier: ICarrier = {
    _id: pbCarrierId,
    carrierName: "Pitney Bowes",
    accountName: "Pitney Bowes Test Account",
    clientId: "NaGclZXRH8pRCM2WzE4wTZpUgKNrMcO7",
    clientSecret: "eaSZ3eYDtz7V32R2",
    shipperId: "3001087260",
    returnAddress: {
        company: "Eksborder Inc",
        street1: "59 Apsley Street",
        street2: "Suite 11A",
        city: "Hudson",
        state: "MA",
        country: "US",
        postalCode: "01749"
    },
    isTest: true
};

export const setupDB = async () => {
    await User.deleteMany({});
    await Carrier.deleteMany({});

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

    await new Carrier(dhlCarrier).save();
}