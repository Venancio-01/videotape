/**
 * 状态管理模块 - 视频播放应用的核心数据管理层
 * 基于 Zustand 构建的高效、轻量级状态管理解决方案
 */

// 导出所有 Store
export * from "./videoStore";
export * from "./playbackStore";
export * from "./queueStore";
export * from "./settingsStore";
export * from "./uiStore";

// 导出所有中间件
export * from "../middleware/persistMiddleware";
export * from "../middleware/loggerMiddleware";
export * from "../middleware/syncMiddleware";
export * from "../middleware/devToolsMiddleware";

// 导出所有 Hooks
export * from "../hooks/useVideoStore";
export * from "../hooks/usePlaybackStore";
export * from "../hooks/useQueueStore";
export * from "../hooks/useSettingsStore";

// 导出工具函数
export * from "../utils/stateUtils";
export * from "../utils/persistUtils";
export * from "../utils/syncUtils";
export * from "../utils/debugUtils";

// 导出类型定义
export * from "../types/stateTypes";
export * from "../types/storeTypes";
export * from "../types/middlewareTypes";
