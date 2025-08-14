/**
 * 状态管理工具函数
 */

import type { EqualityChecker, StateSelector } from "zustand";

// 深度比较函数
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (typeof a === "object" && a !== null && b !== null) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
};

// 浅度比较函数
export const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;

  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key) || a[key] !== b[key]) {
      return false;
    }
  }

  return true;
};

// 创建记忆化选择器
export const createSelector = <T, U>(
  selector: StateSelector<T, U>,
  equalityFn: EqualityChecker<U> = shallowEqual,
): StateSelector<T, U> => {
  let lastState: T | undefined;
  let lastResult: U | undefined;

  return (state: T): U => {
    if (lastState === undefined || !equalityFn(lastState, state)) {
      lastState = state;
      lastResult = selector(lastState);
    }
    return lastResult!;
  };
};

// 创建深度记忆化选择器
export const createDeepSelector = <T, U>(
  selector: StateSelector<T, U>,
): StateSelector<T, U> => {
  return createSelector(selector, deepEqual);
};

// 防抖函数
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): T => {
  let timeout: ReturnType<typeof setTimeout>;

  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

// 节流函数
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): T => {
  let inThrottle: boolean;

  return ((...args: unknown[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

// 状态路径获取器
export const getStateValue = (state: any, path: string): any => {
  return path.split(".").reduce((obj, key) => obj?.[key], state);
};

// 状态路径设置器
export const setStateValue = (state: any, path: string, value: any): any => {
  const keys = path.split(".");
  const lastKey = keys.pop()!;

  const target = keys.reduce((obj, key) => {
    if (obj[key] === undefined) {
      obj[key] = {};
    }
    return obj[key];
  }, state);

  target[lastKey] = value;
  return state;
};

// 状态路径删除器
export const deleteStateValue = (state: any, path: string): any => {
  const keys = path.split(".");
  const lastKey = keys.pop()!;

  const target = keys.reduce((obj, key) => obj[key], state);

  if (target && typeof target === "object") {
    delete target[lastKey];
  }

  return state;
};

// 对象冻结（深度不可变）
export const deepFreeze = <T>(object: T): T => {
  const propNames = Object.getOwnPropertyNames(object);

  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
};

// 对象合并（深度合并）
export const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T => {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, any>,
        source[key] as Record<string, any>,
      );
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
};

// 状态差异计算
export const computeStateDiff = (prevState: any, currentState: any): any => {
  const diff: any = {};

  const compare = (prev: any, curr: any, path = "") => {
    if (prev === curr) return;

    if (
      typeof prev !== "object" ||
      prev === null ||
      typeof curr !== "object" ||
      curr === null
    ) {
      setStateValue(diff, path, curr);
      return;
    }

    const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;

      if (!(key in prev)) {
        setStateValue(diff, currentPath, curr[key]);
      } else if (!(key in curr)) {
        setStateValue(diff, currentPath, undefined);
      } else {
        compare(prev[key], curr[key], currentPath);
      }
    }
  };

  compare(prevState, currentState);
  return diff;
};

// 状态验证器
export const validateState = (
  state: any,
  schema: any,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const validate = (obj: any, schemaObj: any, path = "") => {
    if (typeof schemaObj !== "object" || schemaObj === null) return;

    for (const key in schemaObj) {
      const currentPath = path ? `${path}.${key}` : key;

      if (!(key in obj)) {
        errors.push(`Missing required field: ${currentPath}`);
        continue;
      }

      const expectedType = schemaObj[key];
      const actualValue = obj[key];

      if (expectedType === "string" && typeof actualValue !== "string") {
        errors.push(
          `Expected string at ${currentPath}, got ${typeof actualValue}`,
        );
      } else if (expectedType === "number" && typeof actualValue !== "number") {
        errors.push(
          `Expected number at ${currentPath}, got ${typeof actualValue}`,
        );
      } else if (
        expectedType === "boolean" &&
        typeof actualValue !== "boolean"
      ) {
        errors.push(
          `Expected boolean at ${currentPath}, got ${typeof actualValue}`,
        );
      } else if (expectedType === "array" && !Array.isArray(actualValue)) {
        errors.push(
          `Expected array at ${currentPath}, got ${typeof actualValue}`,
        );
      } else if (expectedType === "object" && typeof actualValue !== "object") {
        errors.push(
          `Expected object at ${currentPath}, got ${typeof actualValue}`,
        );
      } else if (typeof expectedType === "object" && actualValue !== null) {
        validate(actualValue, expectedType, currentPath);
      }
    }
  };

  validate(state, schema);
  return { isValid: errors.length === 0, errors };
};

// 状态序列化器
export const serializeState = (state: any): string => {
  try {
    return JSON.stringify(state, (key, value) => {
      if (value instanceof Set) {
        return { __type: "Set", value: Array.from(value) };
      }
      if (value instanceof Map) {
        return { __type: "Map", value: Array.from(value.entries()) };
      }
      if (value instanceof Date) {
        return { __type: "Date", value: value.toISOString() };
      }
      if (typeof value === "function") {
        return undefined;
      }
      return value;
    });
  } catch (error) {
    throw new Error(`Failed to serialize state: ${error}`);
  }
};

// 状态反序列化器
export const deserializeState = <T>(serialized: string): T => {
  try {
    return JSON.parse(serialized, (key, value) => {
      if (value && typeof value === "object" && value.__type) {
        switch (value.__type) {
          case "Set":
            return new Set(value.value);
          case "Map":
            return new Map(value.value);
          case "Date":
            return new Date(value.value);
          default:
            return value;
        }
      }
      return value;
    });
  } catch (error) {
    throw new Error(`Failed to deserialize state: ${error}`);
  }
};

// 状态大小计算
export const getStateSize = (state: any): number => {
  return new Blob([serializeState(state)]).size;
};

// 状态清理器
export const cleanupState = <T>(state: T, maxAge?: number): T => {
  const now = Date.now();

  const clean = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj
        .map((item) => clean(item))
        .filter((item) => {
          if (maxAge && item.timestamp && item.timestamp < now - maxAge) {
            return false;
          }
          return true;
        });
    } else if (obj && typeof obj === "object") {
      const result: any = {};
      for (const key in obj) {
        if (maxAge && key === "timestamp" && obj[key] < now - maxAge) {
          continue;
        }
        result[key] = clean(obj[key]);
      }
      return result;
    }
    return obj;
  };

  return clean(state);
};

// 性能监控工具
export const createPerformanceMonitor = () => {
  const metrics = new Map<string, number[]>();

  const recordMetric = (name: string, duration: number) => {
    if (!metrics.has(name)) {
      metrics.set(name, []);
    }
    metrics.get(name)!.push(duration);

    // 保持最近100个样本
    const samples = metrics.get(name)!;
    if (samples.length > 100) {
      samples.shift();
    }
  };

  const getAverage = (name: string): number => {
    const samples = metrics.get(name);
    if (!samples || samples.length === 0) return 0;
    return samples.reduce((sum, val) => sum + val, 0) / samples.length;
  };

  const getMax = (name: string): number => {
    const samples = metrics.get(name);
    if (!samples || samples.length === 0) return 0;
    return Math.max(...samples);
  };

  const getMin = (name: string): number => {
    const samples = metrics.get(name);
    if (!samples || samples.length === 0) return 0;
    return Math.min(...samples);
  };

  const getStats = (name: string) => {
    const samples = metrics.get(name);
    if (!samples || samples.length === 0) return null;

    return {
      count: samples.length,
      average: getAverage(name),
      max: getMax(name),
      min: getMin(name),
      latest: samples[samples.length - 1],
    };
  };

  return {
    recordMetric,
    getAverage,
    getMax,
    getMin,
    getStats,
    getAllMetrics: () => Object.fromEntries(metrics),
    clear: () => metrics.clear(),
  };
};

// 导出所有工具函数
export const StateUtils = {
  deepEqual,
  shallowEqual,
  createSelector,
  createDeepSelector,
  debounce,
  throttle,
  getStateValue,
  setStateValue,
  deleteStateValue,
  deepFreeze,
  deepMerge,
  computeStateDiff,
  validateState,
  serializeState,
  deserializeState,
  getStateSize,
  cleanupState,
  createPerformanceMonitor,
};
