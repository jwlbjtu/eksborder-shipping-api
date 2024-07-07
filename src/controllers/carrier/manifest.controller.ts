import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../../lib/logger';
import util from 'util';
import { IUser } from '../../types/user.types';
import ClientCarrierSchema from '../../models/account.model';
import ShipmentSchema from '../../models/shipping.model';
import ManifestSchema from '../../models/manifest.model';
import CarrierFactory from '../../lib/carriers/carrier.factory';
import { CARRIERS, ShipmentStatus } from '../../lib/constants';

export const getManifestShipmentsForUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error(`Get manifest shipment validation error`);
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const date = req.query.date as string;
      const carrierAccount = req.query.carrierAccount as string;
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);

      const shipments = await ShipmentSchema.find({
        userRef: user._id,
        carrierAccount: carrierAccount,
        'shipmentOptions.shipmentDate': {
          $gte: startDate,
          $lt: endDate
        },
        status: ShipmentStatus.FULFILLED,
        manifested: false,
        'service.key': { $ne: 'FLAT' }
      });
      res.json(shipments);
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const getManifests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error(`Get manifest validation error`);
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const date = req.query.date as string;
      const carrierRef = req.query.carrierRef as string;
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);

      const manifests = await ManifestSchema.find({
        userRef: user._id,
        carrierRef: carrierRef,
        timestamp: {
          $gte: startDate,
          $lt: endDate
        }
      });
      res.json(manifests);
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const createManifests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error(`Create manifest validation error`);
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body;
      const shipmentIds = data.shipmentIds as string[];
      const carrierAccount = data.carrierAccount as string;

      const shipments = await ShipmentSchema.find({
        userRef: user._id,
        carrierAccount: carrierAccount,
        _id: { $in: shipmentIds },
        manifested: false
      });

      if (!shipments || shipments.length === 0) {
        throw new Error('No shipments found');
      }

      const clientAccount = await ClientCarrierSchema.findOne({
        accountId: carrierAccount
      });

      if (clientAccount) {
        const api = CarrierFactory.getCarrierAPI(
          clientAccount,
          false,
          clientAccount.carrier === CARRIERS.DHL_ECOMMERCE
            ? clientAccount.facility!
            : undefined
        );
        if (api && api.createManifest) {
          await api.init();
          const results = await api.createManifest(shipments, user);
          results.forEach((ele) => (ele.userRef = user._id));
          const mSave = results.map((ele) => {
            const manifest = new ManifestSchema(ele);
            return manifest.save();
          });

          await Promise.all(mSave);
          await ShipmentSchema.updateMany(
            { _id: { $in: shipmentIds } },
            { $set: { manifested: true } }
          );
          res.json({ message: 'Create manifest successfully.' });
        } else {
          throw new Error('No carrier api found');
        }
      } else {
        throw new Error('No carrier account found');
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const refreshManifest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error(`Get manifest validation error`);
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const manifestId = req.query.manifestId as string;
      const manifest = await ManifestSchema.findOne({
        _id: manifestId,
        userRef: user._id
      });
      if (manifest) {
        if (manifest.status === 'COMPLETED') {
          res.json(manifest);
          return;
        }
        const clientAccount = await ClientCarrierSchema.findOne({
          _id: manifest.carrierRef
        });
        if (clientAccount) {
          const api = CarrierFactory.getCarrierAPI(
            clientAccount,
            false,
            clientAccount.carrier === CARRIERS.DHL_ECOMMERCE
              ? clientAccount.facility!
              : undefined
          );
          if (api && api.getManifest) {
            await api.init();
            const result = await api.getManifest(manifest);
            manifest.carrier = result.carrier;
            manifest.carrierRef = result.carrierRef;
            manifest.timestamp = result.timestamp;
            manifest.requestId = result.requestId;
            manifest.link = result.link;
            manifest.status = result.status;
            manifest.userRef = result.userRef;
            manifest.manifests = result.manifests;
            manifest.manifestErrors = result.manifestErrors;
            await manifest.save();
            res.json(manifest);
          } else {
            throw new Error('No carrier api found');
          }
        } else {
          throw new Error('No carrier account found');
        }
      } else {
        logger.error(`Mainfest not found for ${manifestId}`);
        res.json({ message: 'Manifest not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const getTrackingInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error(`Get tracking validation error`);
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const shipmentId = req.query.shipmentId as string;
      const shipment = await ShipmentSchema.findOne({
        userRef: user._id,
        _id: shipmentId
      });
      if (shipment && shipment.trackingId) {
        const clientCarrier = await ClientCarrierSchema.findOne({
          accountId: shipment.carrierAccount,
          userRef: user._id
        });
        if (clientCarrier) {
          const api = CarrierFactory.getCarrierAPI(
            clientCarrier,
            false,
            shipment.facility
          );
          if (api && api.getTrackingInfo) {
            await api.init();
            const result = await api.getTrackingInfo(shipment.trackingId);
            if (result.length > 0) {
              shipment.trackingStatus = result[0].event;
              await shipment.save();
            }

            res.json({
              tracking: {
                events: result,
                carrier: shipment.carrier,
                tracking: shipment.trackingId
              },
              shipment
            });
          } else {
            logger.error(`API not found for ${shipmentId}`);
            throw new Error('API not found');
          }
        } else {
          logger.error(
            `Client Account not found for ${shipment.carrierAccount}`
          );
          throw new Error('Client Account not found');
        }
      } else {
        logger.error(`Shipment not found for ${shipmentId}`);
        throw new Error('Shipment not found');
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};
