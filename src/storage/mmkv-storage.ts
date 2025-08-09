/**
 * MMKV 配置存储服务
 * 用于高性能的键值对存储，主要存储用户设置、缓存等配置数据
 * 现在使用安全的 MMKV 包装器来处理开发环境和远程调试场景
 */

import { StorageFactory, StorageInterface } from './safe-mmkv';

/**
 * 存储键前缀
 */
const STORAGE_PREFIX = 'videotape_';

/**
 * 安全的存储实例
 * 自动检测环境并选择合适的存储方式
 */
const storage = StorageFactory.getInstance('videotape-storage', STORAGE_PREFIX);

/**
 * 缓存接口
 */
export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl?: number; // 过期时间（毫秒）
}

/**
 * MMKV 存储服务类
 */
export class MMKVStorage {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(
    options: {
      maxSize?: number;
      defaultTTL?: number; // 默认缓存时间（毫秒）
    } = {}
  ) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 24 * 60 * 60 * 1000; // 24小时
  }

  /**
   * 生成存储键
   */
  private generateKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * 清理过期的缓存
   */
  private cleanupExpired(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 确保缓存大小限制
   */
  private ensureSizeLimit(): void {
    if (this.cache.size <= this.maxSize) return;

    // 按照最近最少使用（LRU）策略删除
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    const deleteCount = this.cache.size - this.maxSize;
    for (let i = 0; i < deleteCount; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * 存储字符串值
   */
  async setString(key: string, value: string): Promise<void> {
    try {
      const storageKey = this.generateKey(key);
      storage.set(storageKey.substring(STORAGE_PREFIX.length), value);

      // 更新内存缓存
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
      });

      this.ensureSizeLimit();
    } catch (error) {
      console.error(`MMKV setString failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取字符串值
   */
  async getString(key: string): Promise<string | null> {
    try {
      // 先检查内存缓存
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        return cached.value;
      }

      // 从持久化存储读取
      const storageKey = this.generateKey(key);
      const value = storage.get<string>(storageKey.substring(STORAGE_PREFIX.length));

      if (value !== null) {
        // 更新内存缓存
        this.cache.set(key, {
          value,
          timestamp: Date.now(),
          ttl: this.defaultTTL,
        });
        this.ensureSizeLimit();
      }

      return value ?? null;
    } catch (error) {
      console.error(`MMKV getString failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 存储数字值
   */
  async setNumber(key: string, value: number): Promise<void> {
    try {
      const storageKey = this.generateKey(key);
      storage.set(storageKey.substring(STORAGE_PREFIX.length), value);

      // 更新内存缓存
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
      });

      this.ensureSizeLimit();
    } catch (error) {
      console.error(`MMKV setNumber failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取数字值
   */
  async getNumber(key: string, defaultValue: number = 0): Promise<number> {
    try {
      // 先检查内存缓存
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        return cached.value;
      }

      // 从持久化存储读取
      const storageKey = this.generateKey(key);
      const value = storage.get<number>(storageKey.substring(STORAGE_PREFIX.length), defaultValue);

      if (value !== undefined) {
        // 更新内存缓存
        this.cache.set(key, {
          value,
          timestamp: Date.now(),
          ttl: this.defaultTTL,
        });
        this.ensureSizeLimit();
        return value ?? defaultValue;
      }

      return defaultValue;
    } catch (error) {
      console.error(`MMKV getNumber failed for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * 存储布尔值
   */
  async setBoolean(key: string, value: boolean): Promise<void> {
    try {
      const storageKey = this.generateKey(key);
      storage.set(storageKey.substring(STORAGE_PREFIX.length), value);

      // 更新内存缓存
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
      });

      this.ensureSizeLimit();
    } catch (error) {
      console.error(`MMKV setBoolean failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取布尔值
   */
  async getBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
    try {
      // 先检查内存缓存
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        return cached.value;
      }

      // 从持久化存储读取
      const storageKey = this.generateKey(key);
      const value = storage.get<boolean>(storageKey.substring(STORAGE_PREFIX.length), defaultValue);

      if (value !== undefined) {
        // 更新内存缓存
        this.cache.set(key, {
          value,
          timestamp: Date.now(),
          ttl: this.defaultTTL,
        });
        this.ensureSizeLimit();
        return value ?? defaultValue;
      }

      return defaultValue;
    } catch (error) {
      console.error(`MMKV getBoolean failed for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * 存储对象
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setString(key, jsonValue);
    } catch (error) {
      console.error(`MMKV setObject failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取对象
   */
  async getObject<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const value = await this.getString(key);
      return value ? JSON.parse(value) : defaultValue || null;
    } catch (error) {
      console.error(`MMKV getObject failed for key ${key}:`, error);
      return defaultValue || null;
    }
  }

  /**
   * 存储 Buffer 值
   */
  async setBuffer(key: string, value: Uint8Array): Promise<void> {
    try {
      const storageKey = this.generateKey(key);
      storage.set(storageKey, value);

      // 更新内存缓存
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
      });

      this.ensureSizeLimit();
    } catch (error) {
      console.error(`MMKV setBuffer failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取 Buffer 值
   */
  async getBuffer(key: string): Promise<Uint8Array | null> {
    try {
      // 先检查内存缓存
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        return cached.value;
      }

      // 从持久化存储读取
      const storageKey = this.generateKey(key);
      const value = storage.get<string>(storageKey);

      if (value !== undefined) {
        const uint8Array = new Uint8Array(value.split('').map((char) => char.charCodeAt(0)));
        // 更新内存缓存
        this.cache.set(key, {
          value: uint8Array,
          timestamp: Date.now(),
          ttl: this.defaultTTL,
        });
        this.ensureSizeLimit();
        return uint8Array;
      }

      return null;
    } catch (error) {
      console.error(`MMKV getBuffer failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 存储带 TTL 的值
   */
  async setWithTTL<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      const storageKey = this.generateKey(key);
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl,
      };

      storage.set(storageKey, JSON.stringify(entry));

      // 更新内存缓存
      this.cache.set(key, entry);
      this.ensureSizeLimit();
    } catch (error) {
      console.error(`MMKV setWithTTL failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取带 TTL 的值
   */
  async getWithTTL<T>(key: string): Promise<T | null> {
    try {
      // 先检查内存缓存
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        return cached.value;
      }

      // 从持久化存储读取
      const storageKey = this.generateKey(key);
      const value = storage.get<string>(storageKey) || null;

      if (value !== null) {
        const entry: CacheEntry<T> = JSON.parse(value);

        if (!this.isExpired(entry)) {
          // 更新内存缓存
          this.cache.set(key, entry);
          this.ensureSizeLimit();
          return entry.value;
        } else {
          // 过期则删除
          await this.remove(key);
        }
      }

      return null;
    } catch (error) {
      console.error(`MMKV getWithTTL failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 删除键
   */
  async remove(key: string): Promise<void> {
    try {
      const storageKey = this.generateKey(key);
      storage.delete(storageKey.substring(STORAGE_PREFIX.length));
      this.cache.delete(key);
    } catch (error) {
      console.error(`MMKV remove failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.getString(key);
      return value !== null;
    } catch (error) {
      console.error(`MMKV has failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    try {
      storage.clear();
      this.cache.clear();
    } catch (error) {
      console.error('MMKV clear failed:', error);
      throw error;
    }
  }

  /**
   * 获取所有键
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return storage.getAllKeys();
    } catch (error) {
      console.error('MMKV getAllKeys failed:', error);
      return [];
    }
  }

  /**
   * 批量设置
   */
  async multiSet(items: { key: string; value: any }[]): Promise<void> {
    try {
      items.forEach((item) => {
        const storageKey = this.generateKey(item.key);
        const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        storage.set(storageKey, value);

        // 更新内存缓存
        this.cache.set(item.key, {
          value: item.value,
          timestamp: Date.now(),
          ttl: this.defaultTTL,
        });
      });

      this.ensureSizeLimit();
    } catch (error) {
      console.error('MMKV multiSet failed:', error);
      throw error;
    }
  }

  /**
   * 批量获取
   */
  async multiGet<T = any>(keys: string[]): Promise<{ key: string; value: T | null }[]> {
    try {
      return keys.map((key) => {
        const storageKey = this.generateKey(key);
        const value = storage.get<string>(storageKey) || '';

        if (value !== null) {
          try {
            const parsedValue = JSON.parse(value);

            // 更新内存缓存
            this.cache.set(key, {
              value: parsedValue,
              timestamp: Date.now(),
              ttl: this.defaultTTL,
            });

            return { key, value: parsedValue };
          } catch {
            return { key, value: value as T };
          }
        }

        return { key, value: null };
      });
    } catch (error) {
      console.error('MMKV multiGet failed:', error);
      return keys.map((key) => ({ key, value: null }));
    }
  }

  /**
   * 批量删除
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      const storageKeys = keys.map((key) => this.generateKey(key));
      storageKeys.forEach((storageKey) => storage.delete(storageKey));

      keys.forEach((key) => this.cache.delete(key));
    } catch (error) {
      console.error('MMKV multiRemove failed:', error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryCacheSize: number;
    estimatedSize: number;
  }> {
    try {
      const allKeys = await this.getAllKeys();
      const memoryCacheSize = this.cache.size;

      // 估算存储大小（简单估算）
      let estimatedSize = 0;
      for (const key of allKeys) {
        const value = await this.getString(key);
        if (value) {
          estimatedSize += key.length + value.length;
        }
      }

      return {
        totalKeys: allKeys.length,
        memoryCacheSize,
        estimatedSize,
      };
    } catch (error) {
      console.error('MMKV getStats failed:', error);
      return {
        totalKeys: 0,
        memoryCacheSize: 0,
        estimatedSize: 0,
      };
    }
  }

  /**
   * 清理过期数据
   */
  async cleanup(): Promise<void> {
    try {
      this.cleanupExpired();

      // 清理持久化存储中的过期数据
      const allKeys = await this.getAllKeys();
      const keysToDelete: string[] = [];

      for (const key of allKeys) {
        const storageKey = this.generateKey(key);
        const value = storage.get<string>(storageKey) || '';

        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);
            if (this.isExpired(entry)) {
              keysToDelete.push(key);
            }
          } catch {
            // 如果解析失败，也删除
            keysToDelete.push(key);
          }
        }
      }

      if (keysToDelete.length > 0) {
        await this.multiRemove(keysToDelete);
      }
    } catch (error) {
      console.error('MMKV cleanup failed:', error);
    }
  }

  /**
   * 导出数据
   */
  async export(): Promise<Record<string, any>> {
    try {
      const allKeys = await this.getAllKeys();
      const result: Record<string, any> = {};

      for (const key of allKeys) {
        const value = await this.getObject(key);
        if (value !== null) {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      console.error('MMKV export failed:', error);
      return {};
    }
  }

  /**
   * 导入数据
   */
  async import(data: Record<string, any>): Promise<void> {
    try {
      const items = Object.entries(data).map(([key, value]) => ({
        key,
        value,
      }));

      await this.multiSet(items);
    } catch (error) {
      console.error('MMKV import failed:', error);
      throw error;
    }
  }

  /**
   * 获取 MMKV 实例（用于高级操作）
   */
  getStorageInstance(): StorageInterface {
    return storage;
  }

  /**
   * 获取存储大小（字节）
   */
  async getStorageSize(): Promise<number> {
    try {
      return (storage as any).size || 0;
    } catch (error) {
      console.error('MMKV getStorageSize failed:', error);
      return 0;
    }
  }

  /**
   * 检查键是否存在（同步版本）
   */
  contains(key: string): boolean {
    try {
      const storageKey = this.generateKey(key);
      return storage.contains(storageKey.substring(STORAGE_PREFIX.length));
    } catch (error) {
      console.error(`MMKV contains failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 同步删除键
   */
  deleteSync(key: string): void {
    try {
      const storageKey = this.generateKey(key);
      storage.delete(storageKey.substring(STORAGE_PREFIX.length));
      this.cache.delete(key);
    } catch (error) {
      console.error(`MMKV deleteSync failed for key ${key}:`, error);
    }
  }

  /**
   * 同步清空所有数据
   */
  clearSync(): void {
    try {
      storage.clear();
      this.cache.clear();
    } catch (error) {
      console.error('MMKV clearSync failed:', error);
    }
  }
}

// 默认实例
export const mmkvStorage = new MMKVStorage({
  maxSize: 1000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24小时
});

// 应用配置键
export const CONFIG_KEYS = {
  // 用户设置
  THEME: 'theme',
  VOLUME: 'volume',
  PLAYBACK_SPEED: 'playback_speed',
  QUALITY: 'quality',

  // 缓存设置
  CACHE_SIZE: 'cache_size',
  LAST_CLEANUP: 'last_cleanup',

  // UI 状态
  LAST_SCREEN: 'last_screen',
  SPLITTER_POSITION: 'splitter_position',

  // 播放器状态
  LAST_PLAYED_VIDEO: 'last_played_video',
  PLAYBACK_POSITION: 'playback_position',

  // 网络设置
  DATA_SAVER: 'data_saver',
  WIFI_ONLY: 'wifi_only',

  // 统计数据
  TOTAL_PLAY_TIME: 'total_play_time',
  SESSION_COUNT: 'session_count',

  // 实验性功能
  BETA_FEATURES: 'beta_features',
} as const;

export default MMKVStorage;
