/**
 * 持久化工具函数
 */

import { zustandStorage } from "@/lib/storage";
import { deserializeState, getStateSize, serializeState } from "./stateUtils";

// 持久化配置接口
export interface PersistConfig {
  key: string;
  storage?: typeof zustandStorage;
  serialize?: (state: unknown) => string;
  deserialize?: (serialized: string) => unknown;
  whitelist?: (string | RegExp)[];
  blacklist?: (string | RegExp)[];
  merge?: (persistedState: unknown, currentState: unknown) => unknown;
  version?: number;
  migrate?: (
    persistedState: unknown,
    version: number,
  ) => unknown | Promise<unknown>;
  timeout?: number;
  debug?: boolean;
}

// 默认持久化配置
const DEFAULT_PERSIST_CONFIG: Partial<PersistConfig> = {
  storage: zustandStorage,
  serialize: serializeState,
  deserialize: deserializeState,
  timeout: 5000,
  debug: false,
};

// 创建持久化中间件
export const createPersistMiddleware = <T>(config: PersistConfig) => {
  const finalConfig = { ...DEFAULT_PERSIST_CONFIG, ...config };
  const { key, storage, serialize, deserialize, timeout, debug } = finalConfig;

  let isPersisting = false;
  let persistTimeout: ReturnType<typeof setTimeout> | null = null;

  // 检查字段是否应该被持久化
  const shouldPersist = (path: string): boolean => {
    const { whitelist, blacklist } = finalConfig;

    // 如果有白名单，只保留白名单中的字段
    if (whitelist && whitelist.length > 0) {
      return whitelist.some((pattern) => {
        if (typeof pattern === "string") {
          return path === pattern || path.startsWith(pattern + ".");
        }
        return pattern.test(path);
      });
    }

    // 如果有黑名单，排除黑名单中的字段
    if (blacklist && blacklist.length > 0) {
      return !blacklist.some((pattern) => {
        if (typeof pattern === "string") {
          return path === pattern || path.startsWith(pattern + ".");
        }
        return pattern.test(path);
      });
    }

    // 默认持久化所有字段
    return true;
  };

  // 过滤状态，只保留需要持久化的字段
  const filterState = (state: T): any => {
    const filtered: any = {};

    const filter = (obj: any, result: any, path = "") => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;

        if (shouldPersist(currentPath)) {
          if (
            obj[key] &&
            typeof obj[key] === "object" &&
            !Array.isArray(obj[key])
          ) {
            result[key] = {};
            filter(obj[key], result[key], currentPath);
          } else {
            result[key] = obj[key];
          }
        }
      }
    };

    filter(state, filtered);
    return filtered;
  };

  // 合并持久化状态和当前状态
  const mergeStates = (persistedState: any, currentState: T): T => {
    const { merge } = finalConfig;

    if (merge) {
      return merge(persistedState, currentState);
    }

    // 默认深度合并
    return { ...currentState, ...persistedState };
  };

  // 执行数据迁移
  const migrateState = async (
    persistedState: any,
    version: number,
  ): Promise<any> => {
    const { migrate } = finalConfig;

    if (migrate) {
      try {
        return await migrate(persistedState, version);
      } catch (error) {
        if (debug) {
          console.error("Migration failed:", error);
        }
        return persistedState;
      }
    }

    return persistedState;
  };

  // 保存状态到存储
  const persistState = async (state: T): Promise<void> => {
    if (isPersisting) return;

    isPersisting = true;

    try {
      const filteredState = filterState(state);
      const serialized = serialize!(filteredState);

      await storage!.setItem(key, serialized);

      if (debug) {
        console.log(
          `State persisted for key: ${key}, size: ${getStateSize(filteredState)} bytes`,
        );
      }
    } catch (error) {
      if (debug) {
        console.error("Failed to persist state:", error);
      }
      throw error;
    } finally {
      isPersisting = false;
    }
  };

  // 从存储加载状态
  const loadState = async (): Promise<Partial<T> | null> => {
    try {
      const serialized = await storage!.getItem(key);

      if (serialized === null) {
        return null;
      }

      const persistedState = deserialize!(serialized) as T;

      // 执行版本迁移
      const { version } = finalConfig;
      if (version !== undefined) {
        const storedVersion = await storage!.getItem(`${key}_version`);
        if (
          storedVersion !== null &&
          Number.parseInt(storedVersion as string) !== version
        ) {
          const migratedState = await migrateState(
            persistedState,
            Number.parseInt(storedVersion as string),
          );
          await storage!.setItem(`${key}_version`, version.toString());
          return migratedState as Partial<T>;
        }
      }

      return persistedState as Partial<T>;
    } catch (error) {
      if (debug) {
        console.error("Failed to load persisted state:", error);
      }
      return null;
    }
  };

  // 清除持久化状态
  const clearPersistedState = async (): Promise<void> => {
    try {
      await storage!.removeItem(key);
      await storage!.removeItem(`${key}_version`);

      if (debug) {
        console.log(`Persisted state cleared for key: ${key}`);
      }
    } catch (error) {
      if (debug) {
        console.error("Failed to clear persisted state:", error);
      }
      throw error;
    }
  };

  // 获取存储信息
  const getStorageInfo = async (): Promise<{
    used: number;
    total: number;
    available: number;
  }> => {
    try {
      const keys = (storage as any).getAllKeys?.() || [];
      const totalSize = keys.reduce((sum, key) => {
        const item = storage!.getItem(key);
        return sum + (item ? getStateSize(item) : 0);
      }, 0);

      return {
        used: totalSize,
        total: 10 * 1024 * 1024, // 10MB 默认限制
        available: 10 * 1024 * 1024 - totalSize,
      };
    } catch (error) {
      if (debug) {
        console.error("Failed to get storage info:", error);
      }
      return {
        used: 0,
        total: 10 * 1024 * 1024,
        available: 10 * 1024 * 1024,
      };
    }
  };

  // 清理过期数据
  const cleanupOldItems = async (maxAge: number): Promise<number> => {
    const now = Date.now();
    const keys = (storage as any).getAllKeys?.() || [];
    let cleanedCount = 0;

    for (const storageKey of keys) {
      if (storageKey.startsWith(`${key}_`)) {
        try {
          const item = await storage!.getItem(storageKey);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.timestamp && parsed.timestamp < now - maxAge) {
              await storage!.removeItem(storageKey);
              cleanedCount++;
            }
          }
        } catch (error) {
          // 忽略解析错误
        }
      }
    }

    if (debug) {
      console.log(`Cleaned up ${cleanedCount} old items for key: ${key}`);
    }

    return cleanedCount;
  };

  // 防抖的持久化函数
  const debouncedPersist = (state: T, delay = 1000) => {
    if (persistTimeout) {
      clearTimeout(persistTimeout);
    }

    persistTimeout = setTimeout(() => {
      persistState(state).catch((error) => {
        if (debug) {
          console.error("Debounced persist failed:", error);
        }
      });
    }, delay);
  };

  // 批量操作
  const batchPersist = async (items: Record<string, any>): Promise<void> => {
    const batch: [string, string][] = [];

    for (const [itemKey, value] of Object.entries(items)) {
      const fullKey = `${key}_${itemKey}`;
      batch.push([fullKey, serialize!(value)]);
    }

    try {
      batch.forEach(([key, value]) => storage!.setItem(key, value));

      if (debug) {
        console.log(`Batch persisted ${batch.length} items for key: ${key}`);
      }
    } catch (error) {
      if (debug) {
        console.error("Batch persist failed:", error);
      }
      throw error;
    }
  };

  const batchLoad = async (keys: string[]): Promise<Record<string, any>> => {
    const fullKeys = keys.map((key) => `${key}_${key}`);

    try {
      const results = await Promise.all(
        fullKeys.map(async (key) => [key, await storage!.getItem(key)]),
      );
      const result: Record<string, any> = {};

      for (let i = 0; i < fullKeys.length; i++) {
        const fullKey = fullKeys[i];
        const serialized = results[i][1];

        if (serialized !== null) {
          result[keys[i]] = deserialize!(serialized);
        }
      }

      return result;
    } catch (error) {
      if (debug) {
        console.error("Batch load failed:", error);
      }
      return {};
    }
  };

  return {
    persistState,
    loadState,
    clearPersistedState,
    getStorageInfo,
    cleanupOldItems,
    debouncedPersist,
    batchPersist,
    batchLoad,
    filterState,
    shouldPersist,
  };
};

// 创建自动持久化 Hook
export const createAutoPersist = <T>(
  getState: () => T,
  persist: (state: T) => Promise<void>,
  config: {
    debounceMs?: number;
    throttleMs?: number;
    condition?: (state: T) => boolean;
  } = {},
) => {
  const { debounceMs = 1000, throttleMs = 2000, condition } = config;

  let lastPersistTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const shouldPersist = (state: T): boolean => {
    if (condition) {
      return condition(state);
    }
    return true;
  };

  const autoPersist = async (state: T): Promise<void> => {
    if (!shouldPersist(state)) return;

    const now = Date.now();

    // 节流检查
    if (now - lastPersistTime < throttleMs) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(
        () => {
          autoPersist(state);
        },
        throttleMs - (now - lastPersistTime),
      );

      return;
    }

    // 防抖检查
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      try {
        await persist(state);
        lastPersistTime = Date.now();
      } catch (error) {
        console.error("Auto persist failed:", error);
      }
    }, debounceMs);
  };

  return autoPersist;
};

// 导出所有持久化工具
export const PersistUtils = {
  createPersistMiddleware,
  createAutoPersist,
};
