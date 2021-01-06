import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import fs from 'fs';

import User from '../../models/user.model';
import LRes from '../../lib/lresponse.lib';

import { IUser, IUserLogin } from '../../types/user.types';
import '../../lib/env';
import { USER_ROLES } from '../../lib/constants';

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user: IUser = req.body;
    // TODO: later need to add limits about fields can be created, others should be default
    const createdUser = new User(user);
    await createdUser.save();
    LRes.resOk(res, createdUser);
  } catch (error) {
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
      async (err: Error, user: IUserLogin) => {
        if (err) return LRes.resErr(res, 401, err);

        // @ts-expect-error: ignore
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
  const user = req.user;
  const data = req.body;
  try {
    // @ts-expect-error: ignore
    const isMatch = await user.comparePassword(data.password);
    if (isMatch) {
      // @ts-expect-error: ignore
      user.password = data['new-password'];
      // @ts-expect-error: ignore
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
      'userName'
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
    if (!user) {
      fs.unlink(req.file.path, (error) => console.log(error));
      return LRes.resErr(res, 404, { title: 'No user found' });
    }
    if (user.logoImage)
      fs.unlink(user.logoImage, (error) => console.log(error));
    user.logoImage = req.file.path;
    await user.save();
    LRes.resOk(res, {
      title: 'File uploaded successful!',
      link: req.file.path
    });
  } catch (error) {
    fs.unlink(req.file.path, (error) => console.log(error));
    LRes.resErr(res, 500, error);
  }
};
