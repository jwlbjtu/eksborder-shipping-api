import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../src/models/user.model';
import Carrier from '../../src/models/carrier.model';
import Account from '../../src/models/account.model';
import { adminUser, customerUser, createUser } from './users';
import { dhlCarrier } from './carriers';
import { IAccount } from '../../src/types/user.types';

const testAccountId = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const testAccount: IAccount = {
  _id: testAccountId,
  accountName: 'testAccount',
  accountId: 'jkfkdialjfdiw',
  carrier: 'DHL eCommerce',
  connectedAccount: 'Test-DHL-eCommerce',
  services: ['GND'],
  facilities: ['USRDU1'],
  fee: 2,
  feeBase: 'order',
  billingType: 'amount',
  note: 'Unit test account',
  userRef: customerUser._id,
  carrierRef: dhlCarrier._id,
  isActive: true
};

const dhlAccountId = mongoose.Types.ObjectId();
// @ts-expect-error:ignore
export const dhlAccount: IAccount = {
  _id: dhlAccountId,
  accountName: 'dhlAccount',
  accountId: 'iklciklsjfidpcl',
  carrier: 'DHL eCommerce',
  connectedAccount: 'Test-DHL-eCommerce',
  services: ['GND', 'FLAT'],
  facilities: ['USRDU1'],
  fee: 2,
  feeBase: 'order',
  billingType: 'proportions',
  note: 'Unit test dhl account',
  userRef: customerUser._id,
  carrierRef: dhlCarrier._id,
  isActive: true
};

const dhlAccountId2 = mongoose.Types.ObjectId();
// @ts-expect-error:ignore
export const dhlAccount2: IAccount = {
  _id: dhlAccountId2,
  accountName: 'dhlAccount2',
  accountId: 'iklcioelkxkjidpcl2',
  carrier: 'DHL eCommerce',
  connectedAccount: 'Test-DHL-eCommerce',
  services: ['GND'],
  facilities: ['USRDU1'],
  fee: 2,
  feeBase: 'order',
  billingType: 'proportions',
  note: 'Unit test dhl account 2',
  userRef: createUser._id,
  carrierRef: dhlCarrier._id,
  isActive: true
};

export const setupDB = async (): Promise<void> => {
  await User.deleteMany({});
  await Carrier.deleteMany({});
  await Account.deleteMany({});

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

  // Create Customer User in DB
  const customerPayload = {
    id: customerUser._id,
    fullName: `${customerUser.firstName} ${customerUser.lastName}`,
    email: customerUser.email,
    role: customerUser.role
  };
  customerUser.apiToken = jwt.sign(customerPayload, 'test_secret');
  customerUser.tokens = [
    {
      token: jwt.sign(customerPayload, 'test_secret')
    }
  ];

  await new User(customerUser).save();
  await new Carrier(dhlCarrier).save();
  await new Account(testAccount).save();
};
