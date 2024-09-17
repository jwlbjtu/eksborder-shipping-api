import AsyncLock from 'async-lock';
import User from '../../models/user.model';
import { Cache } from '../cache';
import { roundToTwoDecimal } from './helpers';
import { logger } from '../logger';

const lock = new AsyncLock();

export const getUserBalance = async (userId: string) => {
  const key = `user:${userId}:balance`;
  const result = await new Promise<any>((resolve, reject) => {
    lock.acquire(
      key,
      async (done) => {
        try {
          const exist = Cache.has(key);
          if (!exist) {
            const user = await User.findById(userId);
            if (!user) {
              throw new Error('User not found');
            }
            const balance = user.balance;
            const deposit = user.deposit;
            Cache.set(key, { balance, deposit }, 0);
            done(null, { balance, deposit });
          } else {
            const cache = Cache.get(key);
            done(null, cache);
          }
        } catch (error) {
          done(error as Error, null);
        }
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result);
      }
    );
  });
  return result;
};

export const chargeUserBalance = async (userId: string, amount: number) => {
  const key = `user:${userId}:balance`;
  let result: any = {};
  await lock.acquire(key, async () => {
    const exist = Cache.has(key);
    if (exist) {
      logger.info(`User balance cache exist for user: ${userId}`);
      // Update cache value
      const balanceObj = Cache.get(key);
      logger.info(`User balance cache value: ${balanceObj.balance}`);
      logger.info(`Charging label fee: ${amount}`);
      logger.info(`Balance result is : ${balanceObj.balance - amount}`);
      balanceObj.balance = roundToTwoDecimal(balanceObj.balance - amount);
      logger.info(`User new balance cache value: ${balanceObj.balance}`);
      logger.info(`Is user balance smaller than 0: ${balanceObj.balance < 0}`);
      if (balanceObj.balance < 0) {
        throw new Error('账户余额不足');
      }
      logger.info('Set user balance to cache ');
      Cache.set(key, balanceObj, 0);
      // Update database value
      await User.findByIdAndUpdate(userId, {
        balance: balanceObj.balance
      });
      result = balanceObj;
    } else {
      // Get user balance from database
      logger.info(`User balance cache not exist for user: ${userId}`);
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      user.balance = roundToTwoDecimal(user.balance - amount);
      if (user.balance < 0) {
        throw new Error('账户余额不足');
      }
      await user.save();
      Cache.set(key, { balance: user.balance }, 0);
      result = { balance: user.balance };
    }
  });
  logger.info(JSON.stringify(result));
  logger.info(`Finish charge user balance for user: ${userId}`);
  return result;
};

// export const chargeUserBalance = async (userId: string, amount: number) => {
//   const key = `user:${userId}:balance`;
//   logger.info('Checking user balance and charge fee for user: ', userId);
//   const result = await new Promise<any>((resolve, reject) => {
//     logger.info('Qcuiring async lock for user: ', userId);
//     lock.acquire(
//       key,
//       async (done) => {
//         try {
//           const exist = Cache.has(key);
//           if (exist) {
//             logger.info('User balance cache exist for user: ', userId);
//             // Update cache value
//             const balanceObj = Cache.get(key);
//             balanceObj.balance = roundToTwoDecimal(balanceObj.balance - amount);
//             if (balanceObj.balance < 0) {
//               throw new Error('账户余额不足');
//             }
//             Cache.set(key, balanceObj, 0);
//             // Update database value
//             await User.findByIdAndUpdate(userId, {
//               balance: balanceObj.balance
//             });
//             done(null, balanceObj);
//           } else {
//             // Get user balance from database
//             logger.info('User balance cache not exist for user: ', userId);
//             const user = await User.findById(userId);
//             if (!user) {
//               throw new Error('User not found');
//             }
//             user.balance = roundToTwoDecimal(user.balance - amount);
//             if (user.balance < 0) {
//               throw new Error('账户余额不足');
//             }
//             await user.save();
//             Cache.set(key, { balance: user.balance }, 0);
//             done(null, { balance: user.balance });
//           }
//         } catch (error) {
//           done(error as Error, null);
//         }
//       },
//       (error, result) => {
//         if (error) reject(error);
//         resolve(result);
//       }
//     );
//   });
//   logger.info('Finish charge user balance for user: ', userId);
//   return result;
// };

export const updateUserBalanceAndDeposit = async (
  userId: string,
  balance: number,
  deposit: number
) => {
  const key = `user:${userId}:balance`;
  const result = await new Promise<any>((resolve, reject) => {
    lock.acquire(
      key,
      async (done) => {
        try {
          const exist = Cache.has(key);
          if (exist) {
            // Update cache value
            const balanceObj = Cache.get(key);
            balanceObj.balance = roundToTwoDecimal(
              balanceObj.balance + balance
            );
            balanceObj.deposit = roundToTwoDecimal(
              balanceObj.deposit + deposit
            );
            Cache.set(key, balanceObj, 0);
            // Update database value
            await User.findByIdAndUpdate(userId, {
              balance: balanceObj.balance,
              deposit: balanceObj.deposit
            });
            done(null, balanceObj);
          } else {
            // Get user balance and deposite from database
            const user = await User.findById(userId);
            if (!user) {
              throw new Error('User not found');
            }
            user.balance = roundToTwoDecimal(user.balance + balance);
            user.deposit = roundToTwoDecimal(user.deposit + deposit);
            await user.save();
            Cache.set(key, { balance: user.balance, deposit: user.deposit }, 0);
            done(null, { balance: user.balance, deposit: user.deposit });
          }
        } catch (error) {
          done(error as Error, null);
        }
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result);
      }
    );
  });
  return result;
};

export interface IUserBalance {
  balance: number;
  deposit: number;
}
