import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Types } from 'mongoose';
import convert from 'convert-units';
import { IUser } from '../../types/user.types';
import { Item, ItemUpdateData } from '../../types/record.types';
import ShipmentSchema from '../../models/shipping.model';
import ItemSchema from '../../models/item.model';
import CustomItemSchema from '../../models/customItem.model';
import { WeightUnit } from '../../lib/constants';
import { logger } from '../../lib/logger';

export const createOrderItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body as ItemUpdateData;

      const shipping = await ShipmentSchema.findOne({
        _id: data.orderId,
        userRef: user._id
      });
      if (shipping) {
        const itemData: Item = {
          itemTitle: data.itemTitle,
          quantity: data.quantity,
          itemWeight: convert(data.itemWeight)
            .from(data.itemWeightUnit)
            .to(WeightUnit.LB),
          totalWeight: convert(data.totalWeight)
            .from(data.itemWeightUnit)
            .to(WeightUnit.LB),
          itemWeightUnit: WeightUnit.LB,
          itemValue: data.itemValue,
          totalValue: data.totalValue,
          itemValueCurrency: data.itemValueCurrency,
          country: data.country,
          sku: data.sku,
          hsTariffNumber: data.hsTariffNumber,
          shipmentRef: Types.ObjectId(data.orderId)
        };

        let item = new ItemSchema(itemData);
        if (data.isCustom) {
          item = new CustomItemSchema(itemData);
        }
        await item.save();

        const result = await ShipmentSchema.findOne({ _id: shipping._id })
          .populate('items')
          .populate('customItems');
        res.json(result);
      } else {
        res.status(404).json({ message: 'Cannot find shipment for the item' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const updateOrderItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body as ItemUpdateData;

      const shipping = await ShipmentSchema.findOne({
        _id: data.orderId,
        userRef: user._id
      });
      if (shipping) {
        const itemSchemaModel = data.isCustom ? CustomItemSchema : ItemSchema;
        const item = await itemSchemaModel.findOne({
          _id: data.id,
          shipmentRef: data.orderId
        });
        if (item) {
          const newTotalWeight = convert(data.totalWeight)
            .from(data.itemWeightUnit)
            .to(WeightUnit.LB);

          item.itemTitle = data.itemTitle;
          item.quantity = data.quantity;
          item.itemWeight = convert(data.itemWeight)
            .from(data.itemWeightUnit)
            .to(WeightUnit.LB);
          item.totalWeight = newTotalWeight;
          item.itemWeightUnit = WeightUnit.LB;
          item.itemValue = data.itemValue;
          item.totalValue = data.totalValue;
          item.itemValueCurrency = data.itemValueCurrency;
          item.country = data.country;
          item.sku = data.sku;
          item.hsTariffNumber = data.hsTariffNumber;
          await item.save();

          const result = await ShipmentSchema.findOne({ _id: shipping.id })
            .populate('items')
            .populate('customItems');
          res.json(result);
        } else {
          res.status(404).json({ message: 'Item not found' });
        }
      } else {
        res.status(404).json({ message: 'Cannot find Shipment for the item' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const deleteOrderItem = async (
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
      const isCustom = req.params.isCustom === 'true';
      let itemSchemaModel = ItemSchema;
      if (isCustom) itemSchemaModel = CustomItemSchema;
      const deleteItem = await itemSchemaModel.findOne({ _id: id });
      if (deleteItem) {
        const shipping = await ShipmentSchema.findOne({
          _id: deleteItem.shipmentRef,
          userRef: user._id
        });
        if (shipping) {
          await deleteItem.delete();

          if (!isCustom) {
            if (shipping.orderAmount) {
              shipping.orderAmount -= deleteItem.totalValue;
            }
            await shipping.save();
          }

          const result = await ShipmentSchema.findOne({
            _id: deleteItem.shipmentRef
          })
            .populate('items')
            .populate('customItems');
          res.json(result);
        } else {
          res
            .status(404)
            .json({ message: 'Cannot find shipment for the item' });
        }
      } else {
        logger.info(`No item deleted for ${id} of user ${user._id}`);
        res.status(304).json({ message: 'No item deleted' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};
