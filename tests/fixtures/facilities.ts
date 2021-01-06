import jwt from 'jsonwebtoken';
import User from '../../src/models/user.model';
import Carrier from '../../src/models/carrier.model';
import Facility from '../../src/models/facility.model';
import mongoose from 'mongoose';
import { IFacility } from '../../src/types/record.types';
import { adminUser } from './users';
import { dhlCarrier } from './carriers';

const id = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const testFacility: IFacility = {
  _id: id,
  facilityNumber: 'USRDU1',
  description: 'DHL Test Facility',
  carrierRef: dhlCarrier._id
};

const dhlId = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const dhlFacility: IFacility = {
  _id: dhlId,
  facilityNumber: 'USRDU2',
  description: 'DHL Test Facility 2',
  carrierRef: dhlCarrier._id
};

export const setupDB = async () => {
  await User.deleteMany({});
  await Carrier.deleteMany({});
  await Facility.deleteMany({});

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
  await new Facility(testFacility).save();
};
