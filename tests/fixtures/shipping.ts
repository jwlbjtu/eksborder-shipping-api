import jwt from 'jsonwebtoken';
import User from '../../src/models/user.model';
import Carrier from '../../src/models/carrier.model';
import Account from '../../src/models/account.model';
import Manifest from '../../src/models/manifest.model';

import { adminUser, customerUser, createUser } from './users';
import { dhlCarrier } from './carriers';
import { dhlAccount, dhlAccount2 } from './account';
import { IAdminProductRequest } from '../../src/types/admin.types';

// product request - DHL eCommerce all products
export const allDHLeCommerceProductRequest: IAdminProductRequest = {
  carrier: 'DHL eCommerce',
  pickup: '5351244',
  distributionCenter: 'USRDU1',
  toAddress: {
    name: 'John Doe',
    company: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  },
  rate: {
    calculate: true,
    currency: 'USD'
  },
  estimatedDeliveryDate: {
    calculate: true
  }
};
// product request - DHL eCommerce GND
export const allDHLeCommerceGNDRequest: IAdminProductRequest = {
  carrier: 'DHL eCommerce',
  service: 'GND',
  pickup: '5351244',
  distributionCenter: 'USRDU1',
  toAddress: {
    name: 'John Doe',
    company: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  },
  rate: {
    calculate: true,
    currency: 'USD'
  },
  estimatedDeliveryDate: {
    calculate: true
  }
};
// product request - DHL eCommerce FLAT
export const allDHLeCommerceFLATRequest: IAdminProductRequest = {
  carrier: 'DHL eCommerce',
  service: 'FLAT',
  pickup: '5351244',
  distributionCenter: 'USRDU1',
  toAddress: {
    name: 'John Doe',
    company: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  },
  rate: {
    calculate: true,
    currency: 'USD'
  },
  estimatedDeliveryDate: {
    calculate: true
  }
};
// product request - PB USPS all products
export const allPBProductsRequest: IAdminProductRequest = {
  carrier: 'Pitney Bowes',
  provider: 'USPS',
  toAddress: {
    name: 'John Doe',
    company: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  },
  rate: {
    calculate: true,
    currency: 'USD'
  },
  estimatedDeliveryDate: {
    calculate: true
  }
};
// product request - PB USPS PM PKG
export const allPBPMProductsRequest: IAdminProductRequest = {
  carrier: 'Pitney Bowes',
  provider: 'USPS',
  service: 'PM',
  toAddress: {
    name: 'John Doe',
    company: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    parcelType: 'PKG',
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  },
  rate: {
    calculate: true,
    currency: 'USD'
  },
  estimatedDeliveryDate: {
    calculate: true
  }
};
// label request - DHL ecommerce GND
export const dhlEcommerceGNDLabel = {
  carrier: 'DHL eCommerce',
  carrierAccount: 'iklciklsjfidpcl',
  service: 'GND',
  facility: 'USRDU1',
  toAddress: {
    name: 'John Doe',
    companyName: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    }
  }
};
// label request - DHL ecommerce FLAT
export const dhlEcommerceFlatLabel = {
  carrier: 'DHL eCommerce',
  carrierAccount: 'iklciklsjfidpcl',
  service: 'FLAT',
  facility: 'USRDU1',
  toAddress: {
    name: 'John Doe',
    companyName: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    }
  }
};
// label request - PB USPS FCM FLAT
export const pbUspsFcmFlatLabelRequest = {
  carrier: 'Pitney Bowes',
  carrierAccount: 'pbAccount',
  provider: 'USPS',
  service: 'FCM',
  toAddress: {
    name: 'John Doe',
    companyName: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    parcelType: 'FLAT',
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  }
};
// label request - PB USPS FCM PKG
export const pbUspsFcmPkgLabelRequest = {
  carrier: 'Pitney Bowes',
  carrierAccount: 'pbAccount',
  provider: 'USPS',
  service: 'FCM',
  toAddress: {
    name: 'John Doe',
    companyName: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    parcelType: 'PKG',
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  }
};
// label request - PB USPS PM FLAT
export const pbUspsPmFlatLabelRequest = {
  carrier: 'Pitney Bowes',
  carrierAccount: 'pbAccount',
  provider: 'USPS',
  service: 'PM',
  toAddress: {
    name: 'John Doe',
    companyName: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    parcelType: 'LFRB',
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  }
};
// label request - PB USPS PM PKG
export const pbUspsPmPkgLabelRequest = {
  carrier: 'Pitney Bowes',
  carrierAccount: 'pbAccount',
  provider: 'USPS',
  service: 'PM',
  toAddress: {
    name: 'John Doe',
    companyName: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    parcelType: 'PKG',
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    },
    billingReference1: 'test bill ref 2'
  }
};

export const insufficientBalanceRequest = {
  carrier: 'DHL eCommerce',
  carrierAccount: 'iklcioelkxkjidpcl2',
  service: 'GND',
  distributionCenter: 'USRDU1',
  toAddress: {
    name: 'John Doe',
    companyName: 'Doe Inc.',
    street1: '5923 Peachtree Industrial Blvd',
    street2: 'Suite 100',
    city: 'Norcross',
    state: 'GA',
    country: 'US',
    postalCode: '30024',
    email: '2@y.com',
    phone: '44423440348'
  },
  packageDetail: {
    packageDescription: 'test package desc',
    weight: {
      value: 10,
      unitOfMeasure: 'OZ'
    }
  }
};

// DHL Manifest Request
export const dhlManifestRequest = {
  carrier: 'DHL eCommerce',
  carrierAccount: 'iklciklsjfidpcl',
  manifests: [
    {
      trackingIds: []
    }
  ]
};
// PB Manifest Request
export const pbManifestRequest = {
  carrier: 'Pitney Bowes',
  provider: 'USPS',
  carrierAccount: 'pbAccount',
  manifests: [
    {
      trackingIds: []
    }
  ]
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
  customerUser.balance = 1000;
  await new User(customerUser).save();

  // third user (no balance)
  const thirdPayload = {
    id: createUser._id,
    fullName: `${createUser.firstName} ${createUser.lastName}`,
    email: createUser.email,
    role: createUser.role
  };
  createUser.apiToken = jwt.sign(thirdPayload, 'test_secret');
  createUser.tokens = [
    {
      token: jwt.sign(thirdPayload, 'test_secret')
    }
  ];
  await new User(createUser).save();

  await Carrier.deleteMany({});
  // dhlCarrier
  await new Carrier(dhlCarrier).save();

  await Account.deleteMany({});

  await new Account(dhlAccount).save();
  // dhlAccount for third user
  await new Account(dhlAccount2).save();

  await Manifest.deleteMany({});
};
