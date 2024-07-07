import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import fs from 'fs';
import crypto from 'crypto';

import User from '../../models/user.model';
import LRes from '../../lib/lresponse.lib';

import { IUser } from '../../types/user.types';
import '../../lib/env';
import {
  defaultPrintFormat,
  DistanceUnit,
  REST_ERROR_CODE,
  USER_ROLES,
  WeightUnit
} from '../../lib/constants';
import { PrintFormatData } from '../../types/client/printformat';
import { PackageUnitsData } from '../../types/client/packageUnits';
import PrintFormatSchema from '../../models/client/printFormat.model';
import PackageUnitsSchema from '../../models/client/packageUnits.model';
import { validationResult } from 'express-validator';
import { logger } from '../../lib/logger';
import { resetPasswordEmail } from '../../lib/utils/email.helper';

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user: IUser = req.body;
    const createdUser = new User(user);
    await createdUser.save();
    // If user is customer create default printFormat and packageUnits
    if (createdUser.role === USER_ROLES.API_USER) {
      // Create Default Print Format
      const printFormatData: PrintFormatData = {
        ...defaultPrintFormat,
        userRef: createdUser._id
      };
      const printFormat = new PrintFormatSchema(printFormatData);
      // Create Default Package Units
      const defaultPackageUnits: PackageUnitsData = {
        weightUnit: WeightUnit.LB,
        distanceUnit: DistanceUnit.IN,
        userRef: createdUser._id
      };
      const packageUnits = new PackageUnitsSchema(defaultPackageUnits);
      await printFormat.save();
      await packageUnits.save();
    }
    LRes.resOk(res, createdUser);
  } catch (error) {
    logger.error(error);
    LRes.resErr(res, 500, error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (
      !req.body.user.hasOwnProperty('email') ||
      !req.body.user.hasOwnProperty('password')
    ) {
      return LRes.resErr(res, 401, {
        message: 'Invalid username or password'
      });
    }
    await passport.authenticate(
      'local',
      { session: true },
      async (err: Error, user: IUser) => {
        if (err) return LRes.resErr(res, 401, err);
        const authJson = await user.toAuthJSON();

        LRes.resOk(res, authJson);
      }
    )(req, res, next);
  } catch (err) {
    LRes.resErr(res, 500, err);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-expect-error: ignore
    req.user.tokens = req.user.tokens.filter((token: { token: string }) => {
      // @ts-expect-error: ignore
      return token.token != req.token;
    });
    // @ts-expect-error: ignore
    await req.user.save();

    req.logout();
    delete req.user;
    // @ts-expect-error: ignore
    delete req.session;

    LRes.resOk(res, { message: 'Logout' });
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const id: string = req.params.id;
  if (!id)
    return res.status(400).json({ title: 'Please provide a valid user id' });

  try {
    const user = await User.findById(id);
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });
    return LRes.resOk(res, user);
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const getUserSelf = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    LRes.resOk(res, user);
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const updateSelfPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user: any = req.user;
  const data = req.body;
  try {
    const isMatch = await user.comparePassword(data.password);
    if (isMatch) {
      user.password = data['new-password'];
      await user.save();
      LRes.resOk(res, user);
    } else {
      LRes.resErr(res, 401, {
        message: 'Wrong password'
      });
    }
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const getUsersByRole = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const role = req.params.role;
    if (!role) {
      return res
        .status(400)
        .json({ title: 'Please provide a valid user role' });
    }
    let query: any = { role: role };
    if (role === 'admins') {
      query = {
        // @ts-expect-error: ignore
        _id: { $ne: req.user.id },
        role: { $in: [USER_ROLES.ADMIN, USER_ROLES.ADMIN_SUPER] }
      };
    }
    const users = await User.find(query);
    LRes.resOk(res, users);
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const updateUserPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data = req.body;
  const id = data.id;
  try {
    const user = await User.findById(id);
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });
    user.password = data['new-password'];
    await user.save();
    LRes.resOk(res, user);
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.body;
    const updateFields = [
      'companyName',
      'address',
      'balance',
      'minBalance',
      'currency',
      'email',
      'firstName',
      'lastName',
      'isActive',
      'countryCode',
      'phone',
      'role',
      'userName',
      'referalName'
    ];

    const id = user.id;
    const updatedUser = await User.findById(id);
    if (!updatedUser) return LRes.resErr(res, 404, { title: 'No user found' });

    Object.keys(user).forEach((key) => {
      if (updateFields.includes(key)) {
        // @ts-expect-error: ignore
        updatedUser[key] = user[key];
      }
    });

    await updatedUser.save();

    // If user is customer create default printFormat and packageUnits
    if (updatedUser.role === USER_ROLES.API_USER) {
      // Create Default Print Format if not exists
      if (!(await PrintFormatSchema.findOne({ userRef: updatedUser._id }))) {
        const printFormatData: PrintFormatData = {
          ...defaultPrintFormat,
          userRef: updatedUser._id
        };
        const printFormat = new PrintFormatSchema(printFormatData);
        await printFormat.save();
      }
      // Create Default Package Units
      if (!(await PackageUnitsSchema.findOne({ userRef: updatedUser._id }))) {
        const defaultPackageUnits: PackageUnitsData = {
          weightUnit: WeightUnit.LB,
          distanceUnit: DistanceUnit.IN,
          userRef: updatedUser._id
        };
        const packageUnits = new PackageUnitsSchema(defaultPackageUnits);
        await packageUnits.save();
      }
    }

    LRes.resOk(res, updatedUser);
  } catch (error) {
    LRes.resErr(res, 404, error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;
  try {
    // TODO: cancatinate delete - delete all related data
    const user = await User.findByIdAndDelete(id);
    if (!user) return LRes.resErr(res, 404, 'No user deleted');
    LRes.resOk(res, user);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const uploadUserImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Admin and super admin can upload image to other users
  // customer can only upload image to themselves
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    const file = req.file;
    if (file) {
      if (!user) {
        fs.unlink(file.path, (error) => console.log(error));
        return LRes.resErr(res, 404, { title: 'No user found' });
      }
      if (user.logoImage)
        fs.unlink(user.logoImage, (error) => console.log(error));
      user.logoImage = file.path;
      await user.save();
      LRes.resOk(res, {
        title: 'File uploaded successful!',
        link: file.path
      });
    } else {
      res.status(500).json({ message: 'No image file' });
    }
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (error) => console.log(error));
    }
    LRes.resErr(res, 500, error);
  }
};

export const sendResetEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ messages: result.array() });
    } else {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 10 * 60 * 1000; // valid for 10mins
        await user.save();
        const url = `${process.env.CLIENT_HOST}/reset/${token}`;
        resetPasswordEmail(user.firstName, user.lastName, user.email, url);
        res.json({ message: 'Email sent.' });
      } else {
        res.status(400).json({ message: REST_ERROR_CODE.EMAIL_NOT_FOUND });
      }
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ messages: result.array() });
    } else {
      const data = req.body;
      const user = await User.findOne({
        resetToken: data.token,
        resetTokenExpiration: { $gt: Date.now() }
      });
      if (user) {
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        user.password = data.password;
        await user.save();
        res.json({ message: 'Password reset successful' });
      } else {
        res.status(400).json({ message: REST_ERROR_CODE.INVALID_TOKEN });
      }
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: (error as Error).message });
  }
};
