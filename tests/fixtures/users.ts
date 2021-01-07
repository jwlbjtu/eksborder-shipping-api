import { IUser } from '../../src/types/user.types';
import User from '../../src/models/user.model';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { USER_ROLES } from '../../src/lib/constants';

const adminUserId = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const adminUser: IUser = {
  _id: adminUserId,
  firstName: 'Admin_First',
  lastName: 'Admin_Last',
  userName: 'AdminUser',
  password: 'AdminPass',
  countryCode: '1',
  phone: '6171113333',
  companyName: 'Test Inc',
  role: USER_ROLES.ADMIN_SUPER,
  email: 'admin@test.com',
  minBalance: 0,
  address: {
    street1: '590 Rich St',
    street2: 'Suit 2',
    city: 'Hudson',
    state: 'MA',
    country: 'US',
    postalCode: '02138'
  }
};

const customerUserId = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const customerUser: IUser = {
  _id: customerUserId,
  firstName: 'Customer_First',
  lastName: 'Customer_Last',
  userName: 'CustomerUser',
  password: 'CustomerPass',
  role: USER_ROLES.API_USER,
  email: 'customer@test.com',
  countryCode: '1',
  minBalance: 0,
  phone: '6171112233',
  companyName: 'Customer Test Inc',
  address: {
    street1: '731 Lexington Ave',
    city: 'New York',
    state: 'NY',
    country: 'US',
    postalCode: '011101'
  }
};

const createUserId = mongoose.Types.ObjectId();
// @ts-expect-error: ignore
export const createUser: IUser = {
  _id: createUserId,
  firstName: 'Create_First',
  lastName: 'Create_Last',
  userName: 'Create_User',
  password: 'CreatePass',
  role: USER_ROLES.API_USER,
  email: 'create@test.com',
  countryCode: '1',
  minBalance: 0,
  phone: '6171112222',
  companyName: 'Created Test Inc',
  address: {
    street1: '919 53rd Ave',
    city: 'New York',
    state: 'NY',
    country: 'US',
    postalCode: '011101'
  }
};

export const setupDB = async (): Promise<void> => {
  await User.deleteMany({});

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
};

export const setupDBAPI = async (): Promise<void> => {
  await User.deleteMany({});

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

  // Create third User in DB
  await new User(createUser).save();
};
