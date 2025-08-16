/**
 * 开发工具中间件 - 集成 Redux DevTools 和其他开发工具
 */

import type { StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

// 开发工具配置接口
export interface DevToolsConfig {
  enabled: boolean;
  name?: string;
  serialize?: {
    options?: {
      date?: boolean;
      function?: boolean;
      regex?: boolean;
      symbol?: boolean;
      undefined?: boolean;
      error?: boolean;
      bigint?: boolean;
      map?: boolean;
      set?: boolean;
    };
    replacer?: (key: string, value: any) => any;
    reviver?: (key: string, value: any) => any;
  };
  actionSanitizer?: (action: any) => any;
  stateSanitizer?: (state: any) => any;
  shouldHotReload?: boolean;
  anonymousActionType?: string;
}

// 默认配置
const defaultConfig: DevToolsConfig = {
  enabled: true,
  name: "Videotape App",
  serialize: {
    options: {
      date: true,
      function: false,
      regex: true,
      symbol: true,
      undefined: true,
      error: true,
      bigint: true,
      map: true,
      set: true,
    },
  },
  shouldHotReload: false,
  anonymousActionType: "anonymous",
};

// 性能监控配置
export interface PerformanceConfig {
  enabled: boolean;
  maxStateUpdates: number;
  maxRenderTime: number;
  sampleRate: number;
}

// 创建开发工具中间件
export const createDevToolsMiddleware = <T>(
  config: Partial<DevToolsConfig> = {},
  performanceConfig?: Partial<PerformanceConfig>,
) => {
  const mergedConfig = { ...defaultConfig, ...config };

  if (!mergedConfig.enabled) {
    return (stateCreator: StateCreator<T, [], []>) => stateCreator;
  }

  // 性能监控
  let performanceMonitor: any = null;
  if (performanceConfig?.enabled) {
    performanceMonitor = createPerformanceMonitor(performanceConfig);
  }

  return (stateCreator: StateCreator<T, [], []>): StateCreator<T, [], []> => {
    const wrappedStateCreator = devtools(stateCreator, mergedConfig);

    return (set, get, store) => {
      const result = wrappedStateCreator(set, get, store);

      // 如果启用了性能监控，包装 setState
      if (performanceMonitor) {
        const originalSetState = result.setState;
        result.setState = (...args: any[]) => {
          const start = performance.now();
          const setResult = originalSetState(...args);
          const duration = performance.now() - start;

          performanceMonitor.recordStateUpdate(duration, get());

          return setResult;
        };

        // 添加性能监控方法
        result.getPerformanceStats = () => performanceMonitor.getStats();
        result.resetPerformanceStats = () => performanceMonitor.reset();
      }

      return result;
    };
  };
};

// 性能监控器
const createPerformanceMonitor = (config: Partial<PerformanceConfig> = {}) => {
  const {
    enabled = true,
    maxStateUpdates = 1000,
    maxRenderTime = 16.67, // 60fps
    sampleRate = 0.1, // 10% 采样率
  } = { ...defaultConfig, ...config };

  if (!enabled) {
    return {
      recordStateUpdate: () => {},
      getStats: () => ({}),
      reset: () => {},
    };
  }

  const stateUpdates: Array<{
    timestamp: number;
    duration: number;
    state: any;
  }> = [];

  let totalUpdates = 0;
  let slowUpdates = 0;
  let totalTime = 0;

  const recordStateUpdate = (duration: number, state: any) => {
    totalUpdates++;

    // 随机采样
    if (Math.random() > sampleRate) {
      return;
    }

    totalTime += duration;

    if (duration > maxRenderTime) {
      slowUpdates++;
    }

    stateUpdates.push({
      timestamp: Date.now(),
      duration,
      state: JSON.parse(JSON.stringify(state)), // 深拷贝
    });

    // 限制记录数量
    if (stateUpdates.length > maxStateUpdates) {
      stateUpdates.shift();
    }
  };

  const getStats = () => {
    const avgUpdateTime = totalUpdates > 0 ? totalTime / totalUpdates : 0;
    const slowUpdateRate =
      totalUpdates > 0 ? (slowUpdates / totalUpdates) * 100 : 0;

    // 计算最近 100 次更新的平均时间
    const recentUpdates = stateUpdates.slice(-100);
    const recentAvgTime =
      recentUpdates.length > 0
        ? recentUpdates.reduce((sum, update) => sum + update.duration, 0) /
          recentUpdates.length
        : 0;

    return {
      totalUpdates,
      slowUpdates,
      slowUpdateRate: `${slowUpdateRate.toFixed(2)}%`,
      avgUpdateTime: `${avgUpdateTime.toFixed(2)}ms`,
      recentAvgTime: `${recentAvgTime.toFixed(2)}ms`,
      maxRecordedTime: Math.max(...stateUpdates.map((u) => u.duration), 0),
      minRecordedTime: Math.min(
        ...stateUpdates.map((u) => u.duration),
        Number.POSITIVE_INFINITY,
      ),
      sampleRate: `${(sampleRate * 100).toFixed(1)}%`,
    };
  };

  const reset = () => {
    stateUpdates.length = 0;
    totalUpdates = 0;
    slowUpdates = 0;
    totalTime = 0;
  };

  return {
    recordStateUpdate,
    getStats,
    reset,
  };
};

// 状态序列化器
export const createStateSerializer = (options: DevToolsConfig["serialize"]) => {
  const defaultOptions = {
    date: true,
    function: false,
    regex: true,
    symbol: true,
    undefined: true,
    error: true,
    bigint: true,
    map: true,
    set: true,
  };

  const serializeOptions = { ...defaultOptions, ...options?.options };

  return {
    serialize: (state: any) => {
      try {
        return JSON.stringify(state, (key, value) => {
          // 处理特殊类型
          if (value instanceof Date) {
            return { __type: "Date", value: value.toISOString() };
          }
          if (value instanceof Set) {
            return { __type: "Set", value: Array.from(value) };
          }
          if (value instanceof Map) {
            return { __type: "Map", value: Array.from(value.entries()) };
          }
          if (value instanceof RegExp) {
            return { __type: "RegExp", value: value.source };
          }
          if (typeof value === "bigint") {
            return { __type: "BigInt", value: value.toString() };
          }
          if (typeof value === "function") {
            return serializeOptions.function ? value.toString() : undefined;
          }
          if (value === undefined) {
            return serializeOptions.undefined ? undefined : null;
          }
          if (value instanceof Error) {
            return serializeOptions.error
              ? {
                  __type: "Error",
                  value: {
                    message: value.message,
                    stack: value.stack,
                    name: value.name,
                  },
                }
              : undefined;
          }
          return value;
        });
      } catch (error) {
        console.error("Failed to serialize state:", error);
        return "{}";
      }
    },

    deserialize: (serialized: string) => {
      try {
        return JSON.parse(serialized, (key, value) => {
          if (value && typeof value === "object" && value.__type) {
            switch (value.__type) {
              case "Date":
                return new Date(value.value);
              case "Set":
                return new Set(value.value);
              case "Map":
                return new Map(value.value);
              case "RegExp":
                return new RegExp(value.value);
              case "BigInt":
                return BigInt(value.value);
              case "Error": {
                const error = new Error(value.value.message);
                error.stack = value.value.stack;
                error.name = value.value.name;
                return error;
              }
              default:
                return value;
            }
          }
          return value;
        });
      } catch (error) {
        console.error("Failed to deserialize state:", error);
        return null;
      }
    },
  };
};

// 动作清理器
export const createActionSanitizer = () => {
  return (action: any) => {
    if (typeof action === "function") {
      return "function";
    }
    if (typeof action === "object" && action !== null) {
      // 移除可能包含的大对象
      const sanitized = { ...action };
      if (sanitized.prevState) sanitized.prevState = "[Object]";
      if (sanitized.nextState) sanitized.nextState = "[Object]";
      return sanitized;
    }
    return action;
  };
};

// 状态清理器
export const createStateSanitizer = () => {
  const sensitiveKeys = ["password", "token", "secret", "key"];

  return (state: any) => {
    if (typeof state !== "object" || state === null) {
      return state;
    }

    const sanitized = Array.isArray(state) ? [...state] : { ...state };

    const sanitize = (obj: any) => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === "object") {
          sanitize(obj[key]);
        } else if (
          sensitiveKeys.some((sensitive) =>
            key.toLowerCase().includes(sensitive),
          )
        ) {
          obj[key] = "[REDACTED]";
        }
      }
    };

    sanitize(sanitized);
    return sanitized;
  };
};

// 预定义的开发工具配置
export const DevToolsConfigs = {
  // 开发环境
  development: {
    enabled: true,
    name: "Videotape (Dev)",
    serialize: {
      options: {
        function: true,
        undefined: true,
        error: true,
      },
    },
  },

  // 生产环境
  production: {
    enabled: false,
  },

  // 测试环境
  testing: {
    enabled: false,
  },

  // 调试模式
  debug: {
    enabled: true,
    name: "Videotape (Debug)",
    shouldHotReload: true,
  },
};

// 导出所有开发工具相关功能
export const DevToolsMiddleware = {
  createDevToolsMiddleware,
  createStateSerializer,
  createActionSanitizer,
  createStateSanitizer,
  DevToolsConfigs,
  createPerformanceMonitor,
};
