import jwt from 'jsonwebtoken';
import User from '../../src/models/user.model';
import Carrier from '../../src/models/carrier.model';
import Pickup from '../../src/models/pickup.model';
import mongoose from 'mongoose';
import { IPickup } from '../../src/types/record.types';
import { adminUser } from './users';
import { dhlCarrier } from './carriers';

const id = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const testPickup: IPickup = {
  _id: id,
  pickupAccount: '5351244',
  description: 'DHL Test Pickup',
  carrierRef: dhlCarrier._id
};

const dhlId = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const dhlPickup: IPickup = {
  _id: dhlId,
  pickupAccount: '5351245',
  description: 'DHL Test Pickup 2',
  carrierRef: dhlCarrier._id
};

export const setupDB = async () => {
  await User.deleteMany({});
  await Carrier.deleteMany({});
  await Pickup.deleteMany({});

  // Create Admin User in DB
  const adminPayload = {
    id: adminUser._id,
    fullName: `${adminUser.firstName} ${adminUser.lastName}`,
    email: adminUser.email,
    role: adminUser.role
  };
  adminUser.tokens = [
    {
      token: jwt.sign(adminPayload, 'test_secret')
    }
  ];
  await new User(adminUser).save();

  await new Carrier(dhlCarrier).save();
  await new Pickup(testPickup).save();
};
