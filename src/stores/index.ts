/**
 * 状态管理模块 - 视频播放应用的核心数据管理层
 * 基于 Zustand 构建的高效、轻量级状态管理解决方案
 */

// === 核心状态管理 Store ===
export * from "./mediaStore"; // 统一媒体内容管理（视频 + 播放列表）
export * from "./playbackStore"; // 播放控制和状态管理
export * from "./uiStore"; // UI 状态管理（界面、主题、屏幕方向）

// === 选择性导出以避免冲突 ===
export {
  useVideoStore,
  useVideoSelector,
  useAllVideos,
  useCurrentVideo as useVideoCurrentVideo,
  useFavoriteVideos as useVideoFavoriteVideos,
  useFilteredVideos as useVideoFilteredVideos,
  useVideoStats,
  videoSelectors,
} from "./videoStore";
