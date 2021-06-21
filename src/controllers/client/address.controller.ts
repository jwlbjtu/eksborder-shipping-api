import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { IUser } from '../../types/user.types';
import AddressSchema from '../../models/client/address.model';
import { logger } from '../../lib/logger';
import {
  ClientAddress,
  ClientAddressCreateData
} from '../../types/client/address';

export const getAddressesForUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const addresses = await AddressSchema.find({ userRef: user._id });
    res.json(addresses);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const createAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body as ClientAddressCreateData;
      if (data.isDefaultSender) {
        const defaultSender = await AddressSchema.findOne({
          userRef: user._id,
          isDefaultSender: true
        });
        if (defaultSender) {
          defaultSender.isDefaultSender = false;
          await defaultSender.save();
        }
      }
      const address = new AddressSchema({ ...data, userRef: user._id });
      await address.save();
      res.json(address);
    }
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body as ClientAddress;
      const address = await AddressSchema.findOne({
        _id: data.id,
        userRef: user._id
      });
      if (address) {
        if (data.isDefaultSender && !address.isDefaultSender) {
          const defaultSender = await AddressSchema.findOne({
            userRef: user._id,
            isDefaultSender: true
          });
          if (defaultSender) {
            defaultSender.isDefaultSender = false;
            await defaultSender.save();
          }
        }
        address.name = data.name;
        address.company = data.company;
        address.email = data.email;
        address.phone = data.phone;
        address.country = data.country;
        address.street1 = data.street1;
        address.street2 = data.street2;
        address.city = data.city;
        address.state = data.state;
        address.zip = data.zip;
        address.isDefaultSender = data.isDefaultSender || false;
        address.isDefaultReturn = data.isDefaultReturn || false;
        await address.save();
        res.json(address);
      } else {
        res.status(400).json({ message: 'Address not found' });
      }
    }
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const deleteAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const id = req.params.id;
      await AddressSchema.findOneAndDelete({ _id: id, userRef: user._id });
      res.json({ message: 'Successfully delted' });
    }
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
};
