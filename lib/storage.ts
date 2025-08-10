import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

// 创建主要的 MMKV 实例
export const storage = new MMKV();

// 创建用于特定用途的 MMKV 实例
export const createStorage = (config?: {
  id?: string;
  encryptionKey?: string;
}) => {
  return new MMKV(config);
};

// 基础存储操作
export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  try {
    return value ? JSON.parse(value) || null : null;
  } catch (error) {
    console.error("Error parsing JSON from storage:", error);
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error setting item in storage:", error);
  }
}

export function removeItem(key: string): void {
  try {
    storage.delete(key);
  } catch (error) {
    console.error("Error removing item from storage:", error);
  }
}

// 直接获取和设置原始值
export function getString(key: string): string | undefined {
  return storage.getString(key);
}

export function getNumber(key: string): number | undefined {
  return storage.getNumber(key);
}

export function getBoolean(key: string): boolean | undefined {
  return storage.getBoolean(key);
}

export function getBuffer(key: string): Uint8Array | undefined {
  return storage.getBuffer(key);
}

export function setString(key: string, value: string): void {
  storage.set(key, value);
}

export function setNumber(key: string, value: number): void {
  storage.set(key, value);
}

export function setBoolean(key: string, value: boolean): void {
  storage.set(key, value);
}

export function setBuffer(key: string, value: Uint8Array): void {
  storage.set(key, value);
}

// 存储管理
export function contains(key: string): boolean {
  return storage.contains(key);
}

export function getAllKeys(): string[] {
  return storage.getAllKeys();
}

export function clearAll(): void {
  storage.clearAll();
}

export function clearAllWithPrefix(prefix: string): void {
  const keys = storage.getAllKeys();
  const keysToRemove = keys.filter(key => key.startsWith(prefix));
  keysToRemove.forEach(key => storage.delete(key));
}

// 批量操作
export function multiSet(items: Array<[string, any]>): void {
  items.forEach(([key, value]) => {
    setItem(key, value);
  });
}

export function multiGet(keys: string[]): Array<[string, any | null]> {
  return keys.map(key => [key, getItem(key)]);
}

export function multiRemove(keys: string[]): void {
  keys.forEach(key => removeItem(key));
}

// 存储大小管理
export function getSize(): number {
  return storage.size;
}

export function trim(): void {
  storage.trim();
}

// 加密支持
export function encrypt(key?: string): void {
  storage.recrypt(key);
}

// Zustand 存储适配器
export const zustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return storage.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};


// 事件监听
export function addOnValueChangedListener(callback: (key: string) => void): { remove: () => void } {
  return storage.addOnValueChangedListener(callback);
}

// 存储统计
export function getStorageStats(): {
  keyCount: number;
  totalSize: number;
  keys: Array<{ key: string; size: number }>;
} {
  const keys = getAllKeys();
  const keyDetails = keys.map(key => ({
    key,
    size: JSON.stringify(getItem(key)).length,
  }));
  
  const totalSize = keyDetails.reduce((sum, item) => sum + item.size, 0);
  
  return {
    keyCount: keys.length,
    totalSize,
    keys: keyDetails,
  };
}

// 默认导出
export default {
  storage,
  getItem,
  setItem,
  removeItem,
  getString,
  getNumber,
  getBoolean,
  getBuffer,
  setString,
  setNumber,
  setBoolean,
  setBuffer,
  contains,
  getAllKeys,
  clearAll,
  clearAllWithPrefix,
  multiSet,
  multiGet,
  multiRemove,
  getSize,
  trim,
  encrypt,
  zustandStorage,
  addOnValueChangedListener,
  getStorageStats,
  createStorage,
};
