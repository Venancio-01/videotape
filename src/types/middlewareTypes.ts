/**
 * 中间件类型定义
 */

import type { zustandStorage } from "@/lib/storage";
import type { StoreApi } from "zustand";

// 基础中间件接口
export type StoreMiddleware<T> = (store: StoreApi<T>) => StoreApi<T>;

// 持久化中间件配置
export interface PersistMiddlewareConfig<T> {
  name: string;
  storage: typeof zustandStorage;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => void;
  version?: number;
  migrate?: (persistedState: any, version: number) => T | Promise<T>;
  merge?: (persistedState: any, currentState: T) => T;
  whitelist?: (keyof T)[];
  blacklist?: (keyof T)[];
  storageOptions?: {
    prefix?: string;
    serialize?: (data: any) => string;
    deserialize?: (data: string) => any;
  };
}

// 日志中间件配置
export interface LoggerMiddlewareConfig {
  enabled: boolean;
  level: "debug" | "info" | "warn" | "error";
  predicate?: (state: any, action: string) => boolean;
  collapse?: boolean;
  diff?: boolean;
  timestamp?: boolean;
  duration?: boolean;
  colors?: {
    title?: (action: string) => string;
    prevState?: (state: any) => string;
    nextState?: (state: any) => string;
    error?: (error: any) => string;
  };
  logger?: {
    log?: (...args: any[]) => void;
    group?: (...args: any[]) => void;
    groupEnd?: () => void;
    groupCollapsed?: (...args: any[]) => void;
  };
}

// 同步中间件配置
export interface SyncMiddlewareConfig {
  enabled: boolean;
  syncInterval: number; // 同步间隔（毫秒）
  debounceMs?: number; // 防抖时间
  maxRetries?: number; // 最大重试次数
  retryDelay?: number; // 重试延迟
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
  onSyncProgress?: (progress: number) => void;
  syncStrategy?: "immediate" | "debounced" | "throttled";
}

// 开发工具中间件配置
export interface DevToolsMiddlewareConfig {
  enabled: boolean;
  name?: string;
  serialize?: {
    replacer?: (key: string, value: any) => any;
    reviver?: (key: string, value: any) => any;
  };
  actionSanitizer?: (action: any) => any;
  stateSanitizer?: (state: any) => any;
  shouldCatchErrors?: boolean;
  shouldRecordChanges?: boolean;
  pause?: boolean;
  features?: {
    pause?: boolean;
    lock?: boolean;
    persist?: boolean;
    export?: boolean;
    import?: boolean;
    jump?: boolean;
    skip?: boolean;
    reorder?: boolean;
    dispatch?: boolean;
    test?: boolean;
  };
  connection?: {
    maxAge?: number;
    latency?: number;
    predicate?: (state: any, action: any) => boolean;
  };
}

// 性能监控中间件配置
export interface PerformanceMiddlewareConfig {
  enabled: boolean;
  sampleRate?: number; // 采样率 (0-1)
  maxSamples?: number; // 最大样本数
  threshold?: number; // 性能阈值（毫秒）
  onPerformanceIssue?: (metrics: PerformanceMetrics) => void;
  reportInterval?: number; // 报告间隔（毫秒）
}

export interface PerformanceMetrics {
  stateUpdates: number;
  averageUpdateTime: number;
  maxUpdateTime: number;
  memoryUsage: number;
  lastUpdate: number;
  samples: UpdateSample[];
}

export interface UpdateSample {
  timestamp: number;
  duration: number;
  action: string;
  stateSize: number;
}

// 错误处理中间件配置
export interface ErrorMiddlewareConfig {
  enabled: boolean;
  onError?: (error: Error, state: any, action: string) => void;
  shouldCatch?: (error: Error) => boolean;
  maxErrors?: number;
  errorExpiry?: number; // 错误过期时间（毫秒）
}

// 缓存中间件配置
export interface CacheMiddlewareConfig {
  enabled: boolean;
  maxSize?: number; // 最大缓存条目数
  ttl?: number; // 缓存时间（毫秒）
  strategy?: "lru" | "fifo" | "lfu";
  serialize?: (data: any) => string;
  deserialize?: (data: string) => any;
  onCacheHit?: (key: string, data: any) => void;
  onCacheMiss?: (key: string) => void;
  onCacheEvict?: (key: string, data: any) => void;
}

// 验证中间件配置
export interface ValidationMiddlewareConfig {
  enabled: boolean;
  schema?: any; // Zod schema or similar
  onValidationError?: (errors: ValidationError[], state: any) => void;
  strict?: boolean; // 是否严格验证
  validateOnSet?: boolean; // 是否在 setState 时验证
  validateOnGet?: boolean; // 是否在 getState 时验证
}

export interface ValidationError {
  path: string;
  message: string;
  value: any;
  expected?: any;
}

// 安全中间件配置
export interface SecurityMiddlewareConfig {
  enabled: boolean;
  encrypt?: boolean;
  encryptFields?: (keyof any)[];
  sanitize?: boolean;
  sanitizeFields?: (keyof any)[];
  maxStateSize?: number; // 最大状态大小（字节）
  onSecurityViolation?: (violation: SecurityViolation) => void;
}

export interface SecurityViolation {
  type: "size_limit" | "invalid_field" | "encryption_error" | "sanitize_error";
  message: string;
  details?: any;
}

// 网络中间件配置
export interface NetworkMiddlewareConfig {
  enabled: boolean;
  onlineCheck?: boolean;
  offlineMode?: boolean;
  onOnline?: () => void;
  onOffline?: () => void;
  syncOnReconnect?: boolean;
  retryOfflineActions?: boolean;
  maxOfflineActions?: number;
}

// 事件中间件配置
export interface EventMiddlewareConfig {
  enabled: boolean;
  events: string[];
  onEvent?: (event: string, data: any, state: any) => void;
  debounceEvents?: boolean;
  debounceTime?: number;
  throttleEvents?: boolean;
  throttleTime?: number;
}

// 中间件组合配置
export interface MiddlewareConfig<T = any> {
  persist?: PersistMiddlewareConfig<T>;
  logger?: LoggerMiddlewareConfig;
  sync?: SyncMiddlewareConfig;
  devTools?: DevToolsMiddlewareConfig;
  performance?: PerformanceMiddlewareConfig;
  error?: ErrorMiddlewareConfig;
  cache?: CacheMiddlewareConfig;
  validation?: ValidationMiddlewareConfig;
  security?: SecurityMiddlewareConfig;
  network?: NetworkMiddlewareConfig;
  events?: EventMiddlewareConfig;
}

// 中间件工厂函数类型
export type MiddlewareFactory<T, C> = (config: C) => StoreMiddleware<T>;

// 中间件注册表
export interface MiddlewareRegistry {
  [key: string]: {
    factory: MiddlewareFactory<any, any>;
    config: any;
    instance?: StoreMiddleware<any>;
  };
}

// 中间件生命周期钩子
export interface MiddlewareLifecycle {
  onMount?: (store: StoreApi<any>) => void;
  onUpdate?: (state: any, prevState: any, action: string) => void;
  onUnmount?: (store: StoreApi<any>) => void;
  onError?: (error: Error, store: StoreApi<any>) => void;
}

// 中间件上下文
export interface MiddlewareContext {
  store: StoreApi<any>;
  config: any;
  lifecycle: MiddlewareLifecycle;
  dependencies: string[];
  metadata: Record<string, any>;
}
