import Loggind from '../models/log.model';
import { ILog } from '../types/record.types';

export const saveLog = async (
  call: string,
  req: any,
  res: any,
  account: any,
  user: any,
  isErr = false
) => {
  // @ts-expect-error: ignore
  const logData: ILog = {
    request: req,
    response: res,
    callType: call,
    isError: isErr,
    accountRef: account,
    userRef: user
  };

  if (
    isErr == true ||
    (res.hasOwnProperty('status') && typeof res.status != 'string')
  ) {
    logData.response = {
      status: res.status,
      statusText: res.statusText,
      data: res.data,
      messages: res.data.title
    };
    logData.isError = true;
  }

  const logging = new Loggind(logData);

  try {
    return await logging.save();
  } catch (error) {
    return error;
  }
};
