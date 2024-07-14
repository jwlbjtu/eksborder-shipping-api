import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import util from 'util';
import ThirdPartyAccountSchema from '../../models/thirdparty.model';
import CarrierSchema from '../../models/carrier.model';
import fs from 'fs';
import CsvParser from 'csv-parse';
import { logger } from '../../lib/logger';
import { ThirdPartyZoneMap } from '../../types/record.types';

export const fetchThirdpartyAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Fetch thridparty account validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const carrierId = req.params.carrierId;
      const accounts = await ThirdPartyAccountSchema.find({
        carrierRef: carrierId
      });
      res.json(accounts);
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const createThirdPartyAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Create thirdparty validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const data = req.body;

      const carrier = await CarrierSchema.findOne({ _id: data.carrierRef });
      if (carrier) {
        const thirdparty = new ThirdPartyAccountSchema(data);
        if (!carrier.thirdparties) carrier.thirdparties = [];
        carrier.thirdparties.push({
          thirdpartyRef: thirdparty._id,
          condition: thirdparty.condition
        });
        await carrier.save();
        await thirdparty.save();
        res.json({ message: 'Thirdparty Account create successfully' });
      } else {
        res.status(400).json({ message: 'Carrier is not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const updateThirdPartyAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Delete thirdparty account validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const data = req.body;
      const account = await ThirdPartyAccountSchema.findOne({ _id: data.id });
      if (account) {
        account.name = data.name;
        account.accountNum = data.accountNum;
        account.countryCode = data.countryCode;
        account.zipCode = data.zipCode;
        account.service = data.service;
        account.region = data.region;
        account.zoneMode = data.zoneMode;
        account.condition = data.condition;
        account.zoneMap = data.zoneMap;
        account.rates = data.rates;

        const carrier = await CarrierSchema.findOne({ _id: data.carrierRef });
        if (carrier && carrier.thirdparties) {
          const summary = carrier.thirdparties.find(
            (ele) => ele.thirdpartyRef === data.id
          );
          if (summary) summary.condition = data.condition;
          await carrier.save();
        }
        await account.save();
        res.json({ message: 'Update Thirdparty Account Successfully' });
      } else {
        res.status(404).json({ message: 'Thirdparty Account not found' });
      }
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};

export const uploadThirdpartyPrice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const thirdpartyId = data.thirdpartyId;
    const account = await ThirdPartyAccountSchema.findOne({
      _id: thirdpartyId
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

export const uploadThirdpartyPriceZoneMap = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const thirdpartyId = data.thirdpartyId;
    const account = await ThirdPartyAccountSchema.findOne({
      _id: thirdpartyId
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
                if (req.file) {
                  logger.error(`Failed to delete file ${req.file.path}`);
                  logger.error(util.inspect(err, true, null));
                }
              } else {
                if (req.file) {
                  logger.info(`File ${req.file.path} is deleted`);
                }
              }
            });
          }

          // Gernate ZoneMap
          const zoneMap: ThirdPartyZoneMap[] = [];
          for (let i = 0; i < dataList.length; i += 1) {
            const dataArray = dataList[i];
            const zone = dataArray[0].trim();
            const data = dataArray[1].trim();
            if (zoneMap.findIndex((ele) => ele.zone === zone) === -1) {
              zoneMap.push({ zone, maps: data });
            } else {
              const index = zoneMap.findIndex((ele) => ele.zone === zone);
              zoneMap[index].maps = `${zoneMap[index].maps},${data}`;
            }
          }
          account.zoneMap = zoneMap.sort((a, b) => (a.zone > b.zone ? 1 : -1));
          await account.save();
          res.json({ message: 'Zone map uploaded successfully' });
        });
    }
  } catch (error) {
    logger.error(util.inspect(error, true, null));
    res.status(500).json({ message: (error as any).message });
  }
};

export const delteThridPartyAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error('Delete thirdparty account validation error');
      logger.error(util.inspect(result.array(), true, null));
      res.status(400).json({ messages: result.array() });
    } else {
      const id = req.params.id;
      const account = await ThirdPartyAccountSchema.findOneAndDelete({
        _id: id
      });
      if (account) {
        const carrier = await CarrierSchema.findOne({
          _id: account.carrierRef
        });
        if (carrier && carrier.thirdparties) {
          const index = carrier.thirdparties.findIndex(
            (ele) => ele.thirdpartyRef === account._id
          );
          carrier.thirdparties.splice(index, 1);
          await carrier.save();
        }
      }
      res.json({ message: 'Delete thridparty account' });
    }
  } catch (error) {
    logger.error((error as any).message);
    res.status(500).json({ message: (error as any).message });
  }
};
