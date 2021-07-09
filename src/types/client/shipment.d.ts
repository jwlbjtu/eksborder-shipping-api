import { CustomDeclaration } from '../record.types';
import { IAddress } from '../shipping.types';

export interface CreateShipmentData {
  sender: IAddress;
  toAddress: IAddress;
  customDeclaration?: CustomDeclaration;
}
