import { IDHLeCommerceAddress } from '../../../types/carriers/dhl_ecommerce';
import { IAddress } from '../../../types/shipping.types';

const convertToDHLAddress = (address: IAddress): IDHLeCommerceAddress => {
  return {
    name: address.name,
    companyName: address.company,
    address1: address.street1,
    address2: address.street2,
    city: address.city,
    state: address.state,
    country: address.country,
    postalCode: address.zip!,
    email: address.email,
    phone: address.phone
  };
};

export default convertToDHLAddress;
