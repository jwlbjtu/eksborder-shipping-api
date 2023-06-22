import { Request, Response } from 'express';
import CarrierFactory from '../../lib/carriers/carrier.factory';
import { isShipmentInternational } from '../../lib/carriers/carrier.helper';
import LRes from '../../lib/lresponse.lib';
import { ILabelRequest } from '../../types/shipping.types';
import { IAccount, IUser } from '../../types/user.types';
import {
  validateCarrierAccount,
  validateDimensions,
  validateFacility,
  validateRateService,
  validateService,
  validateWeight
} from '../../lib/validation';
import { logger } from '../../lib/logger';
import IdGenerator from '../../lib/utils/IdGenerator';
import { ShipmentData } from '../../types/record.types';
import { DistanceUnit, ShipmentStatus, WeightUnit } from '../../lib/constants';
import convert from 'convert-units';
import util from 'util';

export const getRateInfo = async (
  req: Request,
  res: Response
): Promise<any> => {
  const body = req.body as ILabelRequest;
  const user = req.user as IUser;
  let carrier: string | undefined = undefined;
  let service: string | undefined = body.service || undefined;
  let facility: string | undefined = body.facility || undefined;
  let carrierAccount: string | undefined = body.carrierAccount || undefined;
  let account: IAccount | undefined | null = undefined;
  const weight = body.packageDetail.weight.value;
  const unitOfMeasure = body.packageDetail.weight.unitOfMeasure;
  const dimension = body.packageDetail.dimension;

  try {
    // * Validate Client Carrier Account
    const checkValues = await validateCarrierAccount(carrierAccount, user);
    carrierAccount = checkValues.carrierAccount;
    account = checkValues.account;
    carrier = account.carrier;
    // * Validate Service Name is Supported
    service = validateRateService(account, service);
    // * Validate Facility Name is Supported
    facility = validateFacility(account, facility);
    // * Validate ParcelType is Supported
    // parcelType = validateParcelType(carrier, service, parcelType);
    // * Validate Weight Unit of Measure is Supported
    validateWeight(weight, unitOfMeasure, carrier);
    validateDimensions(dimension, carrier);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }

  try {
    logger.info('1. Create Shipment');
    const fromAddress = body.fromAddress;
    const toAddress = body.toAddress;
    if (!fromAddress) {
      throw LRes.invalidParamsErr(400, 'fromAddress is required.', carrier);
    }
    const shipmentData: ShipmentData = {
      orderId: `${user.userName
        .substring(0, 2)
        .toUpperCase()}${await IdGenerator.generateId(user.userName)}`,
      accountName: account.accountName,
      carrierAccount: account.accountId,
      carrier: account.carrier,
      service: account.services.find((ele) => ele.name === service)!,
      facility: facility,
      sender: {
        name: fromAddress.name,
        company: fromAddress.companyName,
        street1: fromAddress.street1,
        street2: fromAddress.street2,
        city: fromAddress.city,
        state: fromAddress.state,
        country: fromAddress.country,
        zip: fromAddress.postalCode,
        phone: fromAddress.phone
      },
      toAddress: {
        name: toAddress.name,
        company: toAddress.companyName,
        street1: toAddress.street1,
        street2: toAddress.street2,
        city: toAddress.city,
        state: toAddress.state,
        country: toAddress.country,
        zip: toAddress.postalCode,
        phone: toAddress.phone
      },
      return: {
        name: fromAddress.name,
        company: fromAddress.companyName,
        street1: fromAddress.street1,
        street2: fromAddress.street2,
        city: fromAddress.city,
        state: fromAddress.state,
        country: fromAddress.country,
        zip: fromAddress.postalCode,
        phone: fromAddress.phone
      },
      shipmentOptions: {
        shipmentDate: new Date()
      },
      packageInfo: {
        packageType: 'PKG',
        weight: {
          value: convert(weight)
            .from(unitOfMeasure.toLowerCase() as WeightUnit)
            .to(WeightUnit.LB),
          unitOfMeasure: WeightUnit.LB
        },
        dimentions: {
          length: convert(dimension?.length)
            .from(dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
            .to(DistanceUnit.IN),
          width: convert(dimension?.width)
            .from(dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
            .to(DistanceUnit.IN),
          height: convert(dimension?.height)
            .from(dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
            .to(DistanceUnit.IN),
          unitOfMeasure: DistanceUnit.IN
        }
      },
      morePackages: [],
      status: ShipmentStatus.PENDING,
      manifested: false,
      userRef: user._id
    };

    if (body.additionalPackages && body.additionalPackages.length > 0) {
      shipmentData.morePackages = body.additionalPackages.map((ele) => {
        return {
          packageType: 'PKG',
          weight: {
            value: convert(ele.weight.value)
              .from(ele.weight.unitOfMeasure.toLowerCase() as WeightUnit)
              .to(WeightUnit.LB),
            unitOfMeasure: WeightUnit.LB
          },
          dimentions: {
            length: convert(ele.dimension?.length)
              .from(ele.dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
              .to(DistanceUnit.IN),
            width: convert(ele.dimension?.width)
              .from(ele.dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
              .to(DistanceUnit.IN),
            height: convert(ele.dimension?.height)
              .from(ele.dimension?.unitOfMeasure.toLowerCase() as DistanceUnit)
              .to(DistanceUnit.IN),
            unitOfMeasure: DistanceUnit.IN
          }
        };
      });
    }

    const api = await CarrierFactory.getCarrierAPI(
      account,
      body.test,
      shipmentData.facility
    );

    if (api) {
      await api.init();

      if (api.validateAddress) {
        logger.info('2. Validate Address');
        await api.validateAddress(shipmentData.toAddress, body.test);
      }

      const result = await api.products(
        shipmentData,
        isShipmentInternational(shipmentData)
      );
      if (typeof result === 'string') {
        res.status(400).json({ message: result });
        return;
      } else if (result.errors && result.errors.length > 0) {
        res.status(500).json({ message: result.errors[0] });
        return;
      }
      return LRes.resOk(res, result);
    } else {
      res.status(500).json({ message: 'Failed to create carrier api' });
      return;
    }
  } catch (err) {
    console.log('!!!ERROR!!!' + err);
    console.log(err);
    return LRes.resErr(res, 500, err);
  }
};
