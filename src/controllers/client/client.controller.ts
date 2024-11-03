import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import passport from 'passport';
import { logger } from '../../lib/logger';
import LRes from '../../lib/lresponse.lib';
import User from '../../models/user.model';
import { IUser, ClientUpdateData } from '../../types/user.types';

export const clientLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return LRes.resErr(res, 401, {
        message: 'Invalid username or password'
      });
    } else {
      await passport.authenticate(
        'client_local',
        { session: true },
        async (err: Error, user: IUser) => {
          if (err) return res.status(401).json(err);
          const client = await User.findOne({ _id: user._id })
            .populate('printFormat')
            .populate('packageUnits')
            .populate('accountRef')
            .populate('addresses');
          if (client) {
            const result = await client.toClientInfo();
            res.json(result);
          } else {
            logger.error('Client user not found');
            return res.status(401).json({
              message: 'Invalid username or password'
            });
          }
        }
      )(req, res, next);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const updateClientUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const data: ClientUpdateData = req.body;
    const updateFields = [
      'companyName',
      'firstName',
      'lastName',
      'countryCode',
      'phone'
    ];

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid password.' });
    } else {
      const updatedUser = await User.findById(user._id);
      if (!updatedUser)
        return LRes.resErr(res, 404, { title: 'No user found' });

      Object.keys(data).forEach((key) => {
        if (updateFields.includes(key)) {
          // @ts-expect-error: ignore
          updatedUser[key] = data[key];
        }
      });

      if (
        data.newPassword &&
        data.confirmPassword &&
        data.newPassword === data.confirmPassword
      ) {
        updatedUser.password = data.newPassword;
      }

      await updatedUser.save();

      LRes.resOk(res, {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        companyName: updatedUser.companyName,
        countryCode: updatedUser.countryCode,
        phone: updatedUser.phone
      });
    }
  } catch (error) {
    LRes.resErr(res, 404, error);
  }
};

export const refreshClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user: IUser = req.user as IUser;
    res.json({ balance: user.balance, deposit: user.deposit });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: (error as any).message });
  }
};
