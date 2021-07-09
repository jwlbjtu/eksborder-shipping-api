import { Request, Response } from 'express';
import LRes from '../../lib/lresponse.lib';
import User from '../../models/user.model';

export const generateApiToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });
    const authJson = await user.apiAuthJSON();
    LRes.resOk(res, authJson);
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};

export const deleteApiToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user) return LRes.resErr(res, 404, { title: 'No user found' });

    if (user.apiToken) {
      const oldToken = user.apiToken;
      // @ts-expect-error: ignore
      user.tokens = user.tokens.filter((item: { token: string }) => {
        return item.token !== oldToken;
      });
    }
    user.apiToken = undefined;
    await user.save();
    LRes.resOk(res, { message: 'API token is revoked' });
  } catch (error) {
    LRes.resErr(res, 500, error);
  }
};
