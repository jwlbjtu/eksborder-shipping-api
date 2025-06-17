import stream from 'stream';
import {
  INCOTERM,
  TYPE_OF_CONTENT,
  NON_DELIVERY_HANDLING,
  ShipmentStatus,
  DistanceUnit,
  WeightUnit
} from '../constants';

import util from 'util';
import { IAddress } from '../../types/shipping.types';
import { IUser } from '../../types/user.types';
import ShipmentSchema from '../../models/shipping.model';
import { logger } from '../logger';
import { ShipmentData } from '../../types/record.types';
import IdGenerator from './IdGenerator';
import ClientCarrierSchema from '../../models/account.model';

class TransformDataToShipment extends stream.Transform {
  private map: Record<string, number> = {};
  private defaultSender: IAddress;
  private defaultReturn: IAddress;
  private user: IUser;
  private count = 0;

  constructor(
    options = {},
    map: Record<string, number>,
    defaultSender: IAddress,
    defaultReturn: IAddress,
    user: IUser
  ) {
    super({ ...options, objectMode: true });
    this.map = map;
    this.defaultSender = defaultSender;
    this.defaultReturn = defaultReturn;
    this.user = user;
  }

  _transform(chunk: string[], encoding: any, callback: any): void {
    if (this.count === 0) {
      this.count += 1;
      this.push(undefined);
      callback();
    } else {
      this.createShipmentFromCsvData(
        this.map,
        chunk,
        this.defaultSender,
        this.defaultReturn,
        this.user
      ).then((shipmentData) => {
        const shipment = new ShipmentSchema(shipmentData);
        shipment
          .save()
          .then((response) => {
            this.push(response);
            callback();
          })
          .catch((err) => {
            logger.error(util.inspect(err, true, null));
            this.push(undefined);
            callback();
          });
      });
    }
  }

  createShipmentFromCsvData = async (
    map: Record<string, number>,
    data: string[],
    defaultSender: IAddress,
    defaultReturn: IAddress,
    user: IUser
  ): Promise<ShipmentData> => {
    const result: ShipmentData = {
      orderId: `${user.userName
        .substring(0, 2)
        .toUpperCase()}${await IdGenerator.generateId(user.userName)}`,
      sender: {
        name: defaultSender.name,
        company: defaultSender.company,
        email: defaultSender.email,
        phone: defaultSender.phone,
        street1: defaultSender.street1,
        street2: defaultSender.street2,
        city: defaultSender.city,
        state: defaultSender.state,
        zip: defaultSender.zip,
        country: defaultSender.country
      },
      toAddress: {
        name: data[map.recipientName],
        company: map.company !== undefined ? data[map.company] : undefined,
        email: map.email !== undefined ? data[map.email] : undefined,
        phone: map.phone !== undefined ? data[map.phone] : undefined,
        street1: data[map.street1],
        street2: map.street2 !== undefined ? data[map.street2] : undefined,
        city: data[map.city],
        state: map.state !== undefined ? data[map.state] : undefined,
        zip: map.zip !== undefined ? data[map.zip] : '',
        country: data[map.country]
      },
      packageList: [],
      return: {
        name: defaultReturn.name,
        company: defaultReturn.company,
        email: defaultReturn.email,
        phone: defaultReturn.phone,
        street1: defaultReturn.street1,
        street2: defaultReturn.street2,
        city: defaultReturn.city,
        state: defaultReturn.state,
        zip: defaultReturn.zip,
        country: defaultReturn.country
      },
      shipmentOptions: {
        shipmentDate: new Date()
      },
      status: ShipmentStatus.PENDING,
      manifested: false,
      userRef: user._id
    };

    // Check if order is international
    if (result.sender!.country !== result.toAddress.country) {
      result.customDeclaration = {
        typeOfContent: TYPE_OF_CONTENT.MERCHANDISE,
        incoterm: INCOTERM.DDU.value,
        nonDeliveryHandling: NON_DELIVERY_HANDLING.RETURN,
        signingPerson: result.sender!.name!
      };
    }

    // Client Account Information
    if (data[map.accountId]) {
      const clientCarrier = await ClientCarrierSchema.findOne({
        accountId: data[map.accountId],
        userRef: user._id
      });
      if (clientCarrier) {
        result.accountName = clientCarrier.accountName;
        result.carrierAccount = clientCarrier.accountId;
        result.carrier = clientCarrier.carrier;
        result.facility = data[map.facility];
        if (data[map.service]) {
          const service = [clientCarrier.service].find(
            (ele) => ele.name === data[map.service]
          );
          if (service) {
            result.service = service;
          }
        }
      }
    }

    // PackageInfo
    if (data[map.packageType]) {
      result.packageList = [
        {
          packageType: data[map.packageType],
          dimensions: {
            length: data[map.length] ? parseFloat(data[map.length]) : 0,
            width: data[map.width] ? parseFloat(data[map.width]) : 0,
            height: data[map.height] ? parseFloat(data[map.height]) : 0,
            unitOfMeasure: data[map.dimentionUnit]
              ? (data[map.dimentionUnit].toLowerCase() as DistanceUnit)
              : DistanceUnit.IN
          },
          weight: {
            value: data[map.weight] ? parseFloat(data[map.weight]) : 0,
            unitOfMeasure: data[map.weightUnit]
              ? (data[map.weightUnit].toLowerCase() as WeightUnit)
              : WeightUnit.LB
          }
        }
      ];
    }
    return result;
  };
}

export default TransformDataToShipment;
