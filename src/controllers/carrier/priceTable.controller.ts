import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import util from 'util';
import PriceTableSchema from '../../models/priceTabel.model';
import CarrierSchema from '../../models/carrier.model';
import fs from 'fs';
import CsvParser from 'csv-parse';
import { logger } from '../../lib/logger';
import { ThirdPartyZoneMap } from '../../types/record.types';

export const fetchPriceTableAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Fetch price table account validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const carrierId = req.params.carrierId;
      const accounts = await PriceTableSchema.find({
        carrierRef: carrierId
      });
      res.json(accounts);
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const createPriceTableAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Create price table validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const data = req.body;

      const carrier = await CarrierSchema.findOne({ _id: data.carrierRef });
      if (carrier) {
        const priceTable = new PriceTableSchema(data);
        if (!carrier.priceTable) carrier.priceTable = [];
        carrier.priceTable.push({
          priceRef: priceTable._id,
          condition: priceTable.condition
        });
        await carrier.save();
        await priceTable.save();
        res.json({ message: 'Price Table Account create successfully' });
      } else {
        res.status(400).json({ message: 'Carrier is not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const updatePriceTableAccount = async (
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
      const account = await PriceTableSchema.findOne({ _id: data.id });
      if (account) {
        account.name = data.name;
        account.service = data.service;
        account.region = data.region;
        account.condition = data.condition;
        account.zoneMap = data.zoneMap;
        account.rates = data.rates;

        const carrier = await CarrierSchema.findOne({ _id: data.carrierRef });
        if (carrier && carrier.priceTable) {
          const summary = carrier.priceTable.find(
            (ele) => ele.priceRef === data.id
          );
          if (summary) summary.condition = data.condition;
          await carrier.save();
        }
        await account.save();
        res.json({ message: 'Update Price Table Account Successfully' });
      } else {
        res.status(404).json({ message: 'Price Table Account not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const uploadPriceTablePrice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const priceTableId = data.priceTableId;
    const account = await PriceTableSchema.findOne({
      _id: priceTableId
    });
    if (account && req.file) {
      const dataList: string[][] = [];
      fs.createReadStream(req.file.path)
        .pipe(CsvParser())
        .on('data', function (data) {
          dataList.push(data);
        })
        .on('end', async function () {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                if (req.file)
                  logger.error(`Failed to delete file ${req.file.path}`);
                logger.error(util.inspect(err, true, null));
              } else {
                if (req.file) logger.info(`File ${req.file.path} is deleted`);
              }
            });
          }

          // Generate Price
          const firstRow = dataList[0];
          const priceData: Record<string, string>[] = [];
          for (let i = 1; i < dataList.length; i += 1) {
            const dataArray = dataList[i];
            const tmpData: Record<string, string> = {};
            for (let j = 0; j < dataArray.length; j += 1) {
              tmpData[firstRow[j].toString().trim()] = dataArray[j];
            }
            priceData.push(tmpData);
          }
          account.price = {
            weightUnit: data.weightUnit,
            currency: data.currency,
            data: priceData
          };
          // Generate Zones
          firstRow.shift();
          account.zones = firstRow;
          // Update ZoneMap
          if (!account.zoneMap) account.zoneMap = [];
          const newMap: ThirdPartyZoneMap[] = [];
          for (let i = 0; i < firstRow.length; i += 1) {
            const zone = firstRow[i];
            const zoneData = account.zoneMap.find((ele) => ele.zone === zone);
            if (zoneData) {
              newMap.push(zoneData);
            } else {
              newMap.push({ zone, maps: '' });
            }
          }
          account.zoneMap = newMap;
          await account.save();
          res.json({ message: 'Price uploaded successfully' });
        });
    } else {
      if (req.file) {
        fs.unlink(req.file.path, (err) =>
          logger.error(util.inspect(err, true, null))
        );
      }
      res.status(404).json({ message: 'Thridparty Account not found' });
    }
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) =>
        logger.error(util.inspect(err, true, null))
      );
    }
    logger.error(util.inspect(error, true, null));
    res.status(500).json({ message: (error as any).message });
  }
};

export const deltePriceTableAccount = async (
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
      const id = req.params.id;
      const account = await PriceTableSchema.findOneAndDelete({
        _id: id
      });
      if (account) {
        const carrier = await CarrierSchema.findOne({
          _id: account.carrierRef
        });
        if (carrier && carrier.priceTable) {
          const index = carrier.priceTable.findIndex(
            (ele) => ele.priceRef === account._id
          );
          carrier.priceTable.splice(index, 1);
          await carrier.save();
        }
      }
      res.json({ message: 'Delete price table account' });
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};
