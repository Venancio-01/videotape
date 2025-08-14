/**
 * 状态类型定义
 */

import type { Playlist, Settings, Video, WatchHistory } from "@/db/schema";

// 视频状态类型
export interface VideoState {
  // 视频数据
  videos: Video[];
  currentVideo: Video | null;

  // 播放状态
  playbackState: {
    isPlaying: boolean;
    isPaused: boolean;
    isLoading: boolean;
    isBuffering: boolean;
    position: number;
    duration: number;
    bufferedPosition: number;
    volume: number;
    playbackRate: number;
    isLooping: boolean;
    isMuted: boolean;
    error: string | null;
    errorCode: string | null;
  };

  // 收藏管理
  favorites: Set<string>;

  // 搜索和过滤
  searchQuery: string;
  currentFilter: VideoFilter;

  // 观看历史
  watchHistory: WatchHistory[];

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // 分页
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// 视频过滤器类型
export interface VideoFilter {
  duration?: { min: number; max: number };
  size?: { min: number; max: number };
  isFavorite?: boolean;
  isWatched?: boolean;
  sortBy?:
    | "created_at"
    | "title"
    | "duration"
    | "size"
    | "play_count";
  sortOrder?: "asc" | "desc";
}

// 播放状态类型
export interface PlaybackState {
  // 基础状态
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;

  // 位置信息
  position: number;
  duration: number;
  bufferedPosition: number;

  // 播放设置
  volume: number;
  playbackRate: number;
  isLooping: boolean;
  isMuted: boolean;

  // 播放队列
  queue: Video[];
  currentQueueIndex: number;
  repeatMode: "none" | "single" | "all";
  shuffleMode: boolean;

  // 错误状态
  error: string | null;
  errorCode: string | null;
}

// 队列状态类型
export interface QueueState {
  // 播放队列
  queue: Video[];
  currentQueueIndex: number;

  // 播放历史
  history: Video[];

  // 播放列表
  playlists: Playlist[];
  currentPlaylist: Playlist | null;

  // 队列操作
  isShuffleOn: boolean;
  repeatMode: "none" | "single" | "all";

  // 队列状态
  isLoading: boolean;
  error: string | null;
}

// 设置状态类型
export interface SettingsState {
  // 界面设置
  theme: "light" | "dark" | "system";
  language: string;

  // 播放设置
  defaultPlaybackSpeed: number;
  defaultVolume: number;
  autoPlay: boolean;
  loopMode: "none" | "single" | "all";
  showControls: boolean;
  enableGestures: boolean;
  enableHaptics: boolean;

  // 加载状态
  isLoading: boolean;
  error: string | null;
}

// UI 状态类型
export interface UIState {
  // 界面状态
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  isSettingsOpen: boolean;

  // 模态框状态
  activeModal: null | "settings" | "playlist" | "share" | "delete";
  modalData: any;

  // 主题状态
  theme: "light" | "dark" | "system";
  colorScheme: "light" | "dark";

  // 加载状态
  loadingStates: Record<string, boolean>;

  // 错误状态
  errors: Record<string, string | null>;

  // 通知状态
  notifications: Notification[];
}

// 通知类型
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  timestamp: number;
}

// 播放列表状态类型
export interface PlaylistState {
  // 播放列表数据
  playlists: Playlist[];
  currentPlaylist: Playlist | null;

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // 搜索和过滤
  searchQuery: string;
  currentFilter: PlaylistFilter;

  // 分页
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// 播放列表过滤器类型
export interface PlaylistFilter {
  isPublic?: boolean;
  isDefault?: boolean;
  tags?: string[];
  sortBy?: "name" | "createdAt" | "videoCount" | "playCount" | "lastPlayedAt";
  sortOrder?: "asc" | "desc";
}

// 应用全局状态
export interface AppState {
  video: VideoState;
  playback: PlaybackState;
  queue: QueueState;
  settings: SettingsState;
  ui: UIState;
  playlist: PlaylistState;
}

// Store 操作类型
export interface StoreActions<T> {
  // 状态访问
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

  // 状态订阅
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;

  // 状态选择器
  select: <U>(selector: (state: T) => U) => U;

  // 状态重置
  reset: () => void;

  // 状态销毁
  destroy: () => void;
}

// 异步操作状态
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 分页状态
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// 搜索状态
export interface SearchState {
  query: string;
  results: any[];
  loading: boolean;
  error: string | null;
  suggestions: string[];
}

// 缓存状态
export interface CacheState {
  size: number;
  maxSize: number;
  items: CacheItem[];
  lastCleanup: number;
}

export interface CacheItem {
  key: string;
  value: any;
  timestamp: number;
  size: number;
  accessCount: number;
}

// 同步状态
export interface SyncState {
  isSyncing: boolean;
  lastSync: number;
  pendingChanges: number;
  error: string | null;
}

// 调试状态
export interface DebugState {
  enabled: boolean;
  logs: DebugLog[];
  performance: PerformanceMetrics;
}

export interface DebugLog {
  id: string;
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: any;
}

export interface PerformanceMetrics {
  stateUpdates: number;
  renderTime: number;
  memoryUsage: number;
  lastUpdate: number;
}
