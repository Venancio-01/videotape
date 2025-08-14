/**
 * 日志中间件 - 为状态管理提供详细的日志记录
 */

import type { StateCreator } from "zustand";

// 日志级别
export type LogLevel = "debug" | "info" | "warn" | "error";

// 日志条目接口
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  action: string;
  prevState: any;
  nextState: any;
  duration?: number;
  metadata?: Record<string, any>;
}

// 日志配置接口
export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  predicate?: (state: any, action: string) => boolean;
  maxEntries?: number;
  collapse?: boolean;
  timestampFormat?: "iso" | "ms" | "relative";
  colors?: boolean;
  consoleMethods?: Record<LogLevel, keyof Console>;
}

// 默认配置
const defaultConfig: LoggerConfig = {
  enabled: true,
  level: "info",
  maxEntries: 1000,
  collapse: true,
  timestampFormat: "iso",
  colors: true,
  consoleMethods: {
    debug: "debug",
    info: "log",
    warn: "warn",
    error: "error",
  },
};

// 日志级别权重
const levelWeights: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 格式化时间戳
const formatTimestamp = (
  timestamp: number,
  format: LoggerConfig["timestampFormat"],
): string => {
  const date = new Date(timestamp);

  switch (format) {
    case "iso":
      return date.toISOString();
    case "ms":
      return timestamp.toString();
    case "relative": {
      const now = Date.now();
      const diff = now - timestamp;
      if (diff < 1000) return `${diff}ms ago`;
      if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
      return `${Math.round(diff / 60000)}m ago`;
    }
    default:
      return date.toISOString();
  }
};

// 格式化状态
const formatState = (state: any, colors: boolean): string => {
  if (typeof state !== "object" || state === null) {
    return JSON.stringify(state);
  }

  try {
    const formatted = JSON.stringify(state, null, 2);
    if (colors) {
      // 简单的颜色化（在实际应用中可以使用更复杂的颜色库）
      return formatted
        .replace(/"([^"]+)":/g, '"\x1b[34m$1\x1b[0m":')
        .replace(/: (".*?")([,}])/g, ": \x1b[32m$1\x1b[0m$2")
        .replace(/: (\d+([,.]\d+)?)([,}])/g, ": \x1b[33m$1\x1b[0m$3")
        .replace(/: (true|false)([,}])/g, ": \x1b[36m$1\x1b[0m$2");
    }
    return formatted;
  } catch (error) {
    return `[Unserializable: ${error}]`;
  }
};

// 日志管理器类
class LoggerManager {
  private logs: LogEntry[] = [];
  private config: LoggerConfig;
  private subscribers: Set<(log: LogEntry) => void> = new Set();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // 添加日志条目
  addLog(entry: Omit<LogEntry, "timestamp">): void {
    if (!this.config.enabled) return;

    const log: LogEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    this.logs.push(log);

    // 限制日志条目数量
    if (this.config.maxEntries && this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // 通知订阅者
    for (const subscriber of this.subscribers) {
      subscriber(log);
    }

    // 输出到控制台
    this.outputToConsole(log);
  }

  // 输出到控制台
  private outputToConsole(log: LogEntry): void {
    const { level, action, prevState, nextState, duration, metadata } = log;
    const { colors, consoleMethods, collapse, timestampFormat } = this.config;

    // 检查日志级别
    if (levelWeights[level] < levelWeights[this.config.level]) {
      return;
    }

    const method = consoleMethods![level];
    const timestamp = formatTimestamp(log.timestamp, timestampFormat);

    // 构建日志消息
    const message = [
      `%c[${timestamp}] %c${level.toUpperCase()} %c${action}`,
      "color: #666; font-size: 12px;",
      this.getLevelColor(level),
      "color: inherit; font-weight: bold;",
    ];

    // 构建日志数据
    const data: any[] = [];

    if (collapse) {
      data.push({
        action,
        prevState: formatState(prevState, colors),
        nextState: formatState(nextState, colors),
        duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        metadata,
      });
    } else {
      data.push("Action:", action);
      data.push("Previous State:", prevState);
      data.push("Next State:", nextState);
      if (duration) data.push(`Duration: ${duration.toFixed(2)}ms`);
      if (metadata) data.push("Metadata:", metadata);
    }

    // 输出到控制台
    console[method](...message, ...data);
  }

  // 获取日志级别颜色
  private getLevelColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: "#9E9E9E",
      info: "#2196F3",
      warn: "#FFC107",
      error: "#F44336",
    };
    return `color: ${colors[level]}; font-weight: bold;`;
  }

  // 订阅日志
  subscribe(callback: (log: LogEntry) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // 获取所有日志
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 按级别过滤日志
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  // 按动作过滤日志
  getLogsByAction(action: string): LogEntry[] {
    return this.logs.filter((log) => log.action === action);
  }

  // 清空日志
  clearLogs(): void {
    this.logs = [];
  }

  // 导出日志
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 导入日志
  importLogs(logsJson: string): void {
    try {
      const importedLogs = JSON.parse(logsJson);
      if (Array.isArray(importedLogs)) {
        this.logs = importedLogs.map((log) => ({
          ...log,
          timestamp: new Date(log.timestamp).getTime(),
        }));
      }
    } catch (error) {
      console.error("Failed to import logs:", error);
    }
  }

  // 获取统计信息
  getStats(): {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    averageDuration: number;
    recentActions: string[];
  } {
    const logsByLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;
    const actionCounts = new Map<string, number>();

    for (const log of this.logs) {
      logsByLevel[log.level]++;

      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }

      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    }

    const recentActions = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action]) => action);

    return {
      totalLogs: this.logs.length,
      logsByLevel,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      recentActions,
    };
  }

  // 更新配置
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 创建日志中间件
export const createLoggerMiddleware = <T>(
  config: Partial<LoggerConfig> = {},
) => {
  const logger = new LoggerManager(config);

  return (stateCreator: StateCreator<T, [], []>): StateCreator<T, [], []> => {
    return (set, get, store) => {
      const wrappedSet: typeof set = (...args) => {
        const start = performance.now();
        const prevState = get();

        // 执行原始 set
        const result = set(...args);
        const nextState = get();
        const duration = performance.now() - start;

        // 提取动作名称
        let action = "unknown";
        if (typeof args[0] === "function") {
          action = "function update";
        } else if (typeof args[0] === "object") {
          action = "object update";
        } else if (typeof args[0] === "string") {
          action = args[0];
        }

        // 检查是否应该记录此状态更新
        const shouldLog =
          !config.predicate || config.predicate(prevState, action);

        if (shouldLog) {
          logger.addLog({
            level: "info",
            action,
            prevState,
            nextState,
            duration,
          });
        }

        return result;
      };

      // 创建 store
      const storeResult = stateCreator(wrappedSet, get, store);

      // 添加日志功能到 store
      const storeWithLogger = {
        ...storeResult,
        // 添加日志相关方法
        getLogger: () => logger,
        getLogs: () => logger.getLogs(),
        clearLogs: () => logger.clearLogs(),
        exportLogs: () => logger.exportLogs(),
        importLogs: (logsJson: string) => logger.importLogs(logsJson),
        getLoggerStats: () => logger.getStats(),
        subscribeToLogs: (callback: (log: LogEntry) => void) =>
          logger.subscribe(callback),
        updateLoggerConfig: (newConfig: Partial<LoggerConfig>) =>
          logger.updateConfig(newConfig),
      };

      return storeWithLogger;
    };
  };
};

// 预定义的日志配置
export const LoggerConfigs = {
  // 开发环境配置
  development: {
    enabled: true,
    level: "debug" as LogLevel,
    colors: true,
    collapse: true,
  },

  // 生产环境配置
  production: {
    enabled: true,
    level: "warn" as LogLevel,
    colors: false,
    collapse: true,
  },

  // 测试环境配置
  testing: {
    enabled: false,
    level: "error" as LogLevel,
  },

  // 调试配置
  debug: {
    enabled: true,
    level: "debug" as LogLevel,
    maxEntries: 5000,
    collapse: false,
  },
};

// 导出所有日志相关功能
export const LoggerMiddleware = {
  createLoggerMiddleware,
  LoggerConfigs,
  LoggerManager,
  defaultConfig,
};
