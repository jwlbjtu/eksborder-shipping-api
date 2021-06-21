import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../../lib/logger';
import { IUser } from '../../types/user.types';
import PackageUnitsSchema from '../../models/client/packageUnits.model';

export const updatePackageSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    logger.error(JSON.stringify({ messages: result.array() }));
    res.status(400).json({ messages: result.array() });
  } else {
    const user = req.user as IUser;
    const data = req.body;
    logger.debug(data);
    const packageSettings = await PackageUnitsSchema.findOne({
      _id: data.id,
      userRef: user._id
    });
    if (packageSettings) {
      packageSettings.weightUnit = data.weightUnit;
      packageSettings.distanceUnit = data.distanceUnit;
      await packageSettings.save();
      res.json(packageSettings);
    } else {
      logger.error(`Printformat ${data.id} not found for user ${user._id}`);
      res.status(400).json({ message: `Printformat not found` });
    }
  }
};
