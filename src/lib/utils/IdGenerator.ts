import SystemIdSchema from '../../models/SystemId.model';
import { IdMap } from '../../types/IdGenerator';

class IdGenerator {
  private static idMap: Record<string, IdMap> = {};

  public static generateId = async (biz_type: string): Promise<number> => {
    const idObj = IdGenerator.idMap[biz_type];
    if (idObj) {
      const curId = idObj.currentId;
      const maxId = idObj.maxId;
      if (curId === maxId) {
        await IdGenerator.getNewVersion(biz_type);
        const result = await IdGenerator.generateId(biz_type);
        return result;
      } else {
        const newId = idObj.currentId;
        idObj.currentId = newId + 1;
        return newId;
      }
    } else {
      await IdGenerator.getNewVersion(biz_type);
      const result = await IdGenerator.generateId(biz_type);
      return result;
    }
  };

  private static getNewVersion = async (biz_type: string) => {
    const systemId = await SystemIdSchema.findOne({ biz_type });
    if (systemId) {
      systemId.minId = systemId.minId + systemId.step;
      systemId.version = systemId.version + 1;
      await systemId.save();
      IdGenerator.idMap[biz_type] = {
        currentId: systemId.minId + 1,
        maxId: systemId.minId + systemId.step
      };
    } else {
      const newSystemId = {
        biz_type,
        minId: 1000,
        step: 2000,
        version: 1
      };
      const systemIdObj = new SystemIdSchema(newSystemId);
      await systemIdObj.save();
      IdGenerator.idMap[biz_type] = {
        currentId: systemIdObj.minId,
        maxId: systemIdObj.minId + systemIdObj.step
      };
    }
  };
}

export default IdGenerator;
