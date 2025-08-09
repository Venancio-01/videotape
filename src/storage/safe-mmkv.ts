/**
 * 安全的 MMKV 存储包装器
 * 处理开发环境和远程调试场景下的 MMKV 初始化问题
 */

import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';

/**
 * 存储接口定义
 */
export interface StorageInterface {
  set(key: string, value: any): void;
  get<T>(key: string, defaultValue?: T): T | undefined;
  delete(key: string): void;
  clear(): void;
  getAllKeys(): string[];
  contains(key: string): boolean;
}

/**
 * 内存存储实现（用于开发环境回退）
 */
class InMemoryStorage implements StorageInterface {
  private storage = new Map<string, any>();

  set(key: string, value: any): void {
    this.storage.set(key, value);
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.storage.has(key) ? this.storage.get(key) : defaultValue;
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  contains(key: string): boolean {
    return this.storage.has(key);
  }
}

/**
 * 检测 MMKV 是否可用
 */
function isMMKVAvailable(): boolean {
  try {
    // 检查是否在开发环境中使用远程调试
    if (__DEV__) {
      // 检查是否在 Chrome 远程调试中
      // 在 Chrome 远程调试中，global.nativeCallSyncHook 不可用
      if (typeof global !== 'undefined' && !(global as any).nativeCallSyncHook) {
        return false;
      }
    }

    // 尝试创建 MMKV 实例来测试是否可用
    const testStorage = new MMKV({ id: 'test-mmkv-availability' });
    testStorage.set('test', 'test');
    const value = testStorage.getString('test');
    testStorage.delete('test');

    return value === 'test';
  } catch (error) {
    console.warn('MMKV 不可用，将使用内存存储:', error);
    return false;
  }
}

/**
 * MMKV 存储包装器
 */
class MMKVStorageWrapper implements StorageInterface {
  private storage: MMKV;
  private prefix: string;

  constructor(id: string, prefix: string = '') {
    this.prefix = prefix;
    this.storage = new MMKV({ id });
  }

  private getKey(key: string): string {
    return this.prefix + key;
  }

  set(key: string, value: any): void {
    try {
      const storageKey = this.getKey(key);
      if (typeof value === 'string') {
        this.storage.set(storageKey, value);
      } else if (typeof value === 'number') {
        this.storage.set(storageKey, value);
      } else if (typeof value === 'boolean') {
        this.storage.set(storageKey, value);
      } else {
        this.storage.set(storageKey, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`MMKV set 失败 (${key}):`, error);
      throw error;
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const storageKey = this.getKey(key);
      const value = this.storage.getString(storageKey);

      if (value === null || value === undefined) {
        return defaultValue;
      }

      try {
        return JSON.parse(value);
      } catch {
        // 如果不是 JSON，返回原始值
        return value as T;
      }
    } catch (error) {
      console.error(`MMKV get 失败 (${key}):`, error);
      return defaultValue;
    }
  }

  delete(key: string): void {
    try {
      const storageKey = this.getKey(key);
      this.storage.delete(storageKey);
    } catch (error) {
      console.error(`MMKV delete 失败 (${key}):`, error);
      throw error;
    }
  }

  clear(): void {
    try {
      const allKeys = this.storage.getAllKeys();
      const prefixedKeys = allKeys.filter((key) => key.startsWith(this.prefix));

      prefixedKeys.forEach((key) => {
        this.storage.delete(key);
      });
    } catch (error) {
      console.error('MMKV clear 失败:', error);
      throw error;
    }
  }

  getAllKeys(): string[] {
    try {
      const allKeys = this.storage.getAllKeys();
      return allKeys
        .filter((key) => key.startsWith(this.prefix))
        .map((key) => key.substring(this.prefix.length));
    } catch (error) {
      console.error('MMKV getAllKeys 失败:', error);
      return [];
    }
  }

  contains(key: string): boolean {
    try {
      const storageKey = this.getKey(key);
      return this.storage.contains(storageKey);
    } catch (error) {
      console.error(`MMKV contains 失败 (${key}):`, error);
      return false;
    }
  }

  // 特定类型的便捷方法
  getString(key: string, defaultValue?: string): string | undefined {
    try {
      const storageKey = this.getKey(key);
      return this.storage.getString(storageKey) ?? defaultValue;
    } catch (error) {
      console.error(`MMKV getString 失败 (${key}):`, error);
      return defaultValue;
    }
  }

  getNumber(key: string, defaultValue: number = 0): number {
    try {
      const storageKey = this.getKey(key);
      return this.storage.getNumber(storageKey) ?? defaultValue;
    } catch (error) {
      console.error(`MMKV getNumber 失败 (${key}):`, error);
      return defaultValue;
    }
  }

  getBoolean(key: string, defaultValue: boolean = false): boolean {
    try {
      const storageKey = this.getKey(key);
      return this.storage.getBoolean(storageKey) ?? defaultValue;
    } catch (error) {
      console.error(`MMKV getBoolean 失败 (${key}):`, error);
      return defaultValue;
    }
  }

  setString(key: string, value: string): void {
    try {
      const storageKey = this.getKey(key);
      this.storage.set(storageKey, value);
    } catch (error) {
      console.error(`MMKV setString 失败 (${key}):`, error);
      throw error;
    }
  }

  setNumber(key: string, value: number): void {
    try {
      const storageKey = this.getKey(key);
      this.storage.set(storageKey, value);
    } catch (error) {
      console.error(`MMKV setNumber 失败 (${key}):`, error);
      throw error;
    }
  }

  setBoolean(key: string, value: boolean): void {
    try {
      const storageKey = this.getKey(key);
      this.storage.set(storageKey, value);
    } catch (error) {
      console.error(`MMKV setBoolean 失败 (${key}):`, error);
      throw error;
    }
  }
}

/**
 * 创建安全的存储实例
 * 自动检测环境并选择合适的存储方式
 */
export function createSafeStorage(id: string, prefix: string = ''): StorageInterface {
  if (isMMKVAvailable()) {
    console.log(`使用 MMKV 存储实例: ${id}`);
    return new MMKVStorageWrapper(id, prefix);
  } else {
    console.log(`使用内存存储实例: ${id} (MMKV 不可用)`);
    return new InMemoryStorage();
  }
}

/**
 * 存储工厂类
 */
export class StorageFactory {
  private static instances = new Map<string, StorageInterface>();

  static getInstance(id: string, prefix: string = ''): StorageInterface {
    const key = `${id}:${prefix}`;

    if (!this.instances.has(key)) {
      const instance = createSafeStorage(id, prefix);
      this.instances.set(key, instance);
    }

    return this.instances.get(key)!;
  }

  static clearAllInstances(): void {
    this.instances.forEach((instance) => instance.clear());
    this.instances.clear();
  }
}

/**
 * 开发环境检测工具
 */
export class EnvironmentDetector {
  static isDevelopment(): boolean {
    return __DEV__;
  }

  static isRemoteDebugging(): boolean {
    if (!__DEV__) return false;

    // 检查是否在 Chrome 远程调试中
    return typeof global !== 'undefined' && !(global as any).nativeCallSyncHook;
  }

  static isNative(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  static getEnvironmentInfo(): {
    isDevelopment: boolean;
    isRemoteDebugging: boolean;
    isNative: boolean;
    platform: string;
    mmkvAvailable: boolean;
  } {
    return {
      isDevelopment: this.isDevelopment(),
      isRemoteDebugging: this.isRemoteDebugging(),
      isNative: this.isNative(),
      platform: Platform.OS,
      mmkvAvailable: isMMKVAvailable(),
    };
  }
}

// 导出环境信息
export const environmentInfo = EnvironmentDetector.getEnvironmentInfo();
console.log('环境信息:', environmentInfo);

// 默认存储实例
export const defaultStorage = StorageFactory.getInstance('videotape-default', 'videotape_');

export default StorageFactory;
