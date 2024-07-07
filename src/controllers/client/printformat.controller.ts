import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../../lib/logger';
import { IUser } from '../../types/user.types';
import PrintFormatSchema from '../../models/client/printFormat.model';

export const updatePrintFormat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      logger.error({ messages: result.array() });
      res.status(400).json({ messages: result.array() });
    } else {
      const user = req.user as IUser;
      const data = req.body;
      const printFormat = await PrintFormatSchema.findOne({
        _id: data.id,
        userRef: user._id
      });
      if (printFormat) {
        printFormat.labelFormat = data.labelSettings;
        printFormat.packSlipFormat = data.packSlipSettings;
        await printFormat.save();
        res.json(printFormat);
      } else {
        logger.error(`Printformat ${data.id} not found for user ${user._id}`);
        res.status(400).json({ message: `Printformat not found` });
      }
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: (error as any).message });
  }
};
