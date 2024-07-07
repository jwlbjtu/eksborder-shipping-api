import NodeCache from 'node-cache';
const myCache = new NodeCache();

export class Cache {
  public static get(key: string): any {
    return myCache.get(key);
  }
  public static set(key: string, value: any, ttl: number): void {
    myCache.set(key, value, ttl);
  }
  public static del(key: string): void {
    myCache.del(key);
  }
  public static has(key: string): boolean {
    return myCache.has(key);
  }
}
