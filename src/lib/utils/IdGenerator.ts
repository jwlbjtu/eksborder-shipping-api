import SystemIdSchema from '../../models/SystemId.model';
// import { IdMap } from '../../types/IdGenerator';
import AsyncLock from 'async-lock';
import { Cache } from '../cache';

const lock = new AsyncLock();

class IdGenerator {
  // private static idMap: Record<string, IdMap> = {};

  public static generateId = async (biz_type: string) => {
    const key = `id:${biz_type}`;
    const result = await new Promise<number>((resolve, reject) => {
      lock.acquire(
        key,
        async (done) => {
          try {
            const exist = Cache.has(key);
            if (!exist) {
              const result = await IdGenerator.getNewVersion(biz_type);
              done(null, result);
            } else {
              const idObj = Cache.get(key);
              const curId = idObj.currentId;
              const maxId = idObj.maxId;
              if (curId === maxId) {
                const result = await IdGenerator.getNewVersion(biz_type);
                done(null, result);
              } else {
                const newId = idObj.currentId;
                idObj.currentId = newId + 1;
                Cache.set(key, idObj, 0);
                done(null, newId);
              }
            }
          } catch (error) {
            done(error as Error, null);
          }
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result as number);
        }
      );
    });
    return result;
  };

  // public static generateId = async (biz_type: string): Promise<number> => {
  //   const idObj = IdGenerator.idMap[biz_type];
  //   if (idObj) {
  //     const curId = idObj.currentId;
  //     const maxId = idObj.maxId;
  //     if (curId === maxId) {
  //       await IdGenerator.getNewVersion(biz_type);
  //       const result = await IdGenerator.generateId(biz_type);
  //       return result;
  //     } else {
  //       const newId = idObj.currentId;
  //       idObj.currentId = newId + 1;
  //       return newId;
  //     }
  //   } else {
  //     await IdGenerator.getNewVersion(biz_type);
  //     const result = await IdGenerator.generateId(biz_type);
  //     return result;
  //   }
  // };

  private static getNewVersion = async (biz_type: string): Promise<number> => {
    const key = `id:${biz_type}`;
    const systemId = await SystemIdSchema.findOne({ biz_type });
    if (systemId) {
      systemId.minId = systemId.minId + systemId.step;
      systemId.version = systemId.version + 1;
      await systemId.save();
      Cache.set(
        key,
        {
          currentId: systemId.minId + 1,
          maxId: systemId.minId + systemId.step
        },
        0
      );
      return systemId.minId;
    } else {
      const newSystemId = {
        biz_type,
        minId: 1000,
        step: 2000,
        version: 1
      };
      const systemIdObj = new SystemIdSchema(newSystemId);
      await systemIdObj.save();
      Cache.set(
        key,
        {
          currentId: systemIdObj.minId,
          maxId: systemIdObj.minId + systemIdObj.step
        },
        0
      );
      return systemIdObj.minId;
    }
  };
}

export default IdGenerator;
