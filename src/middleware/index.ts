/**
 * 中间件模块 - 导出所有状态管理中间件
 */

// 导出持久化中间件
export * from "./persistMiddleware";

// 导出日志中间件
export * from "./loggerMiddleware";

// 导出开发工具中间件
export * from "./devToolsMiddleware";

import {
  DevToolsConfigs,
  createDevToolsMiddleware,
} from "./devToolsMiddleware";
import { LoggerConfigs, createLoggerMiddleware } from "./loggerMiddleware";
// 组合中间件
import { PersistConfigs, createPersistMiddleware } from "./persistMiddleware";

// 环境检测
const getEnvironment = (): "development" | "production" | "testing" => {
  if (process.env.NODE_ENV === "test") return "testing";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
};

// 创建组合中间件
export const createCombinedMiddleware = <T>(
  storeName: keyof typeof PersistConfigs,
  options?: {
    persist?: boolean;
    logger?: boolean;
    devTools?: boolean;
    persistConfig?: any;
    loggerConfig?: any;
    devToolsConfig?: any;
    performanceConfig?: any;
  },
) => {
  const env = getEnvironment();
  const {
    persist = true,
    logger = env !== "production",
    devTools = env !== "production",
    persistConfig,
    loggerConfig,
    devToolsConfig,
    performanceConfig,
  } = options || {};

  return (stateCreator: any) => {
    let enhancedStateCreator = stateCreator;

    // 应用持久化中间件
    if (persist) {
      const persistMiddleware = createPersistMiddleware<T>({
        ...PersistConfigs[storeName],
        ...persistConfig,
      });
      enhancedStateCreator = persistMiddleware(enhancedStateCreator);
    }

    // 应用日志中间件
    if (logger) {
      const loggerMiddleware = createLoggerMiddleware<T>({
        ...LoggerConfigs[env],
        ...loggerConfig,
      });
      enhancedStateCreator = loggerMiddleware(enhancedStateCreator);
    }

    // 应用开发工具中间件
    if (devTools) {
      const devToolsMiddleware = createDevToolsMiddleware<T>(
        {
          ...DevToolsConfigs[env],
          ...devToolsConfig,
          name: devToolsConfig?.name || `Videotape - ${storeName}`,
        },
        performanceConfig,
      );
      enhancedStateCreator = devToolsMiddleware(enhancedStateCreator);
    }

    return enhancedStateCreator;
  };
};

// 预定义的中间件组合
export const MiddlewareCombinations = {
  // 视频存储中间件
  videoStore: createCombinedMiddleware("videoStore"),

  // 播放存储中间件
  playbackStore: createCombinedMiddleware("playbackStore"),

  // 队列存储中间件
  queueStore: createCombinedMiddleware("queueStore"),

  // 设置存储中间件
  settingsStore: createCombinedMiddleware("settingsStore"),

  // UI 存储中间件
  uiStore: createCombinedMiddleware("uiStore"),

  
  // 开发模式中间件（包含所有功能）
  development: <T>(storeName: keyof typeof PersistConfigs) =>
    createCombinedMiddleware<T>(storeName, {
      persist: true,
      logger: true,
      devTools: true,
      performanceConfig: { enabled: true, sampleRate: 0.05 },
    }),

  // 生产模式中间件（仅持久化）
  production: <T>(storeName: keyof typeof PersistConfigs) =>
    createCombinedMiddleware<T>(storeName, {
      persist: true,
      logger: false,
      devTools: false,
    }),

  // 测试模式中间件（无中间件）
  testing: <T>(storeName: keyof typeof PersistConfigs) =>
    createCombinedMiddleware<T>(storeName, {
      persist: false,
      logger: false,
      devTools: false,
    }),
};

// 导出所有功能
export const Middleware = {
  createCombinedMiddleware,
  MiddlewareCombinations,
  getEnvironment,
  PersistConfigs,
  LoggerConfigs,
  DevToolsConfigs,
};
