import jwt from 'jsonwebtoken';
import User from '../../src/models/user.model';
import Carrier from '../../src/models/carrier.model';
import mongoose from 'mongoose';
import { ICarrier } from '../../src/types/record.types';
import { adminUser } from './users';

const dhlCarrierId2 = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const dhlCarrier2: ICarrier = {
  _id: dhlCarrierId2,
  carrierName: 'DHL eCommerce 2',
  accountName: 'Test-DHL-eCommerce2',
  description: 'Test DHL eCommerce2',
  clientId: 'RaEafduuLOTpFKXQ4M0LPtcwpiaWNu2m',
  clientSecret: 'kgEG3LTXRa2dVJXo',
  facilities: [{ pickup: '5351244', facility: 'USRDU1' }],
  services: [
    { key: 'FLAT', name: 'DHL Smartmail Flats' },
    { key: 'EXP', name: 'DHL Parcel Expedited' },
    { key: 'GND', name: 'DHL Parcel Ground' }
  ],
  returnAddress: {
    company: 'Eksborder Inc',
    street1: '59 Apsley Street',
    street2: 'Suite 11A',
    city: 'Hudson',
    state: 'MA',
    country: 'US',
    postalCode: '01749'
  },
  isActive: true
};

const dhlCarrierId = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const dhlCarrier: ICarrier = {
  _id: dhlCarrierId,
  carrierName: 'DHL eCommerce',
  accountName: 'Test-DHL-eCommerce',
  description: 'Test DHL eCommerce',
  clientId: 'RaEafduuLOTpFKXQ4M0LPtcwpiaWNu2m',
  clientSecret: 'kgEG3LTXRa2dVJXo',
  facilities: [{ pickup: '5351244', facility: 'USRDU1' }],
  services: [
    { key: 'FLAT', name: 'DHL Smartmail Flats' },
    { key: 'EXP', name: 'DHL Parcel Expedited' },
    { key: 'GND', name: 'DHL Parcel Ground' }
  ],
  returnAddress: {
    company: 'Eksborder Inc',
    street1: '59 Apsley Street',
    street2: 'Suite 11A',
    city: 'Hudson',
    state: 'MA',
    country: 'US',
    postalCode: '01749'
  },
  isActive: true
};

export const setupDB = async (): Promise<void> => {
  await User.deleteMany({});
  await Carrier.deleteMany({});

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
};
