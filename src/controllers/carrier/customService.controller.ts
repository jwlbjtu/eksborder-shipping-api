import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../../lib/logger';
import util from 'util';
import CustomServiceSchema from '../../models/customService.model';
import CarrierSchema from '../../models/carrier.model';

export const fetchCustomServiceAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Fetch custom service validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const carrierId = req.params.carrierId;
      const services = await CustomServiceSchema.find({
        carrierId: carrierId
      });
      res.json(services);
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const createCustomServiceAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Create custom service validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const data = req.body;
      const carrier = await CarrierSchema.findOne({ _id: data.carrierId });
      if (carrier) {
        const service = new CustomServiceSchema(data);
        await service.save();
        res.json(service);
      } else {
        res.status(400).json({ message: 'Carrier is not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const updateCustomServiceAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Delete price table account validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const data = req.body;
      const service = await CustomServiceSchema.findOne({ _id: data._id });
      if (service) {
        service.description = data.description;
        service.services = data.services;
        service.active = data.active;

        await service.save();
        res.json(service);
      } else {
        res
          .status(404)
          .json({ message: 'Custom Service Account is not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const deleteCustomServiceAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Delete custom service account validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const id = req.params.id;
      const service = await CustomServiceSchema.findOne({ _id: id });
      if (service) {
        await service.remove();
        res.json({ message: 'Custom Service Account delete successfully' });
      } else {
        res
          .status(404)
          .json({ message: 'Custom Service Account is not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};
