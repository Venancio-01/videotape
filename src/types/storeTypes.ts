/**
 * Store 类型定义
 */

import type { Video } from "@/db/schema";
import type { StoreMiddleware } from "./middlewareTypes";
import type {
  PlaybackState,
  PlaylistState,
  QueueState,
  SettingsState,
  UIState,
  VideoState,
} from "./stateTypes";

// 基础 Store 接口
export interface BaseStore<T> {
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

// 视频 Store 接口
export interface VideoStore extends BaseStore<VideoState> {
  // 视频管理
  addVideo: (video: Video) => void;
  removeVideo: (videoId: string) => void;
  updateVideo: (videoId: string, updates: Partial<Video>) => void;
  setVideos: (videos: Video[]) => void;

  // 播放控制
  setCurrentVideo: (video: Video | null) => void;
  playVideo: (videoId: string) => void;
  pauseVideo: () => void;
  resumeVideo: () => void;
  stopVideo: () => void;

  // 收藏管理
  toggleFavorite: (videoId: string) => void;
  addToFavorites: (videoId: string) => void;
  removeFromFavorites: (videoId: string) => void;
  setFavorites: (videoIds: string[]) => void;

  // 观看历史
  addToWatchHistory: (history: any) => void;
  updateWatchProgress: (
    videoId: string,
    position: number,
    duration: number,
  ) => void;
  clearWatchHistory: () => void;

  // 搜索和过滤
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<VideoState["currentFilter"]>) => void;
  clearFilters: () => void;

  // 分页
  setPagination: (pagination: Partial<VideoState["pagination"]>) => void;
  loadMoreVideos: () => void;

  // 加载状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// 播放 Store 接口
export interface PlaybackStore extends BaseStore<PlaybackState> {
  // 播放控制
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;

  // 位置控制
  setPosition: (position: number) => void;
  seekTo: (position: number) => void;
  seekForward: (seconds: number) => void;
  seekBackward: (seconds: number) => void;

  // 播放设置
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  toggleLooping: () => void;
  setLooping: (looping: boolean) => void;

  // 缓冲状态
  setBuffering: (buffering: boolean) => void;
  setBufferedPosition: (position: number) => void;
  setDuration: (duration: number) => void;

  // 错误处理
  setError: (error: string | null, code?: string) => void;
  clearError: () => void;

  // 状态重置
  resetPlaybackState: () => void;
}

// 队列 Store 接口
export interface QueueStore extends BaseStore<QueueState> {
  // 队列管理
  addToQueue: (videos: Video | Video[]) => void;
  removeFromQueue: (videoId: string) => void;
  clearQueue: () => void;
  setQueue: (videos: Video[]) => void;

  // 队列导航
  playNext: () => void;
  playPrevious: () => void;
  playAtIndex: (index: number) => void;
  setCurrentQueueIndex: (index: number) => void;

  // 播放模式
  toggleShuffle: () => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeatMode: (mode: "none" | "single" | "all") => void;
  cycleRepeatMode: () => void;

  // 播放列表
  createPlaylist: (playlist: any) => void;
  updatePlaylist: (playlistId: string, updates: Partial<any>) => void;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, videoIds: string[]) => void;
  removeFromPlaylist: (playlistId: string, videoIds: string[]) => void;
  setCurrentPlaylist: (playlist: any | null) => void;

  // 播放历史
  addToHistory: (video: Video) => void;
  removeFromHistory: (videoId: string) => void;
  clearHistory: () => void;

  // 加载状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 设置 Store 接口
export interface SettingsStore extends BaseStore<SettingsState> {
  // 界面设置
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLanguage: (language: string) => void;

  // 播放设置
  setDefaultPlaybackSpeed: (speed: number) => void;
  setDefaultVolume: (volume: number) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setLoopMode: (loopMode: "none" | "single" | "all") => void;
  setShowControls: (showControls: boolean) => void;
  setEnableGestures: (enableGestures: boolean) => void;
  setEnableHaptics: (enableHaptics: boolean) => void;

  // 自动播放播放列表设置
  setCurrentPlaylistId: (playlistId: string | null) => void;
  setAutoPlayPlaylist: (autoPlayPlaylist: boolean) => void;
  setResumeFromPosition: (resumeFromPosition: boolean) => void;
  setLastPlayedVideoId: (videoId: string | null) => void;
  setLastPlayedPosition: (position: number) => void;

  // 批量设置
  updateSettings: (settings: Partial<SettingsState>) => void;
  resetSettings: () => void;
  resetUISettings: () => void;
  resetPlaybackSettings: () => void;
  resetCacheSettings: () => void;
  resetPrivacySettings: () => void;
  resetDeveloperSettings: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => boolean;

  // 加载状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// 播放列表 Store 接口
export interface PlaylistStore extends BaseStore<PlaylistState> {
  // 播放列表管理
  addPlaylist: (playlist: any) => void;
  removePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<any>) => void;
  setPlaylists: (playlists: any[]) => void;
  setCurrentPlaylist: (playlist: any | null) => void;

  // 搜索和过滤
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<PlaylistState["currentFilter"]>) => void;
  clearFilters: () => void;

  // 分页
  setPagination: (pagination: Partial<PlaylistState["pagination"]>) => void;
  loadMorePlaylists: () => void;

  // 加载状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// UI Store 接口
export interface UIStore extends BaseStore<UIState> {
  // 界面状态
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;

  // 模态框管理
  openModal: (type: UIState["activeModal"], data?: any) => void;
  closeModal: () => void;
  setModalData: (data: any) => void;

  // 主题管理
  setTheme: (theme: "light" | "dark" | "system") => void;
  setColorScheme: (scheme: "light" | "dark") => void;

  // 加载状态
  setLoading: (key: string, loading: boolean) => void;
  setMultipleLoading: (states: Record<string, boolean>) => void;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;

  // 错误状态
  setError: (key: string, error: string | null) => void;
  setMultipleErrors: (errors: Record<string, string | null>) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;

  // 通知管理
  addNotification: (
    notification: Omit<UIState["notifications"][0], "id" | "timestamp">,
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  showNotification: (
    type: UIState["notifications"][0]["type"],
    title: string,
    message: string,
    options?: any,
  ) => void;

  // 状态重置
  resetUIState: () => void;
}

// Store 创建配置
export interface StoreConfig<T, A extends BaseStore<T>> {
  initialState: T;
  actions: (set: (state: Partial<T>) => void, get: () => T, store: any) => A;
  middlewares?: StoreMiddleware<T>[];
  name?: string;
  devTools?: boolean;
}

// Store 实例类型
export type StoreInstance<T, A extends BaseStore<T>> = A & {
  // 扩展的 store 实例方法
  getInitialState: () => T;
  getState: () => T & A;
  setState: (partial: Partial<T & A>) => void;
  subscribe: (listener: (state: T & A, prevState: T & A) => void) => () => void;
  destroy: () => void;
};

// Store 工厂函数类型
export type StoreFactory<T, A extends BaseStore<T>> = (
  config: StoreConfig<T, A>,
) => StoreInstance<T, A>;

// Store 注册表
export interface StoreRegistry {
  video?: VideoStore;
  playback?: PlaybackStore;
  queue?: QueueStore;
  settings?: SettingsStore;
  ui?: UIStore;
  playlist?: PlaylistStore;
}

// Store Hook 类型
export type StoreHook<T, A extends BaseStore<T>> = () => A & {
  getState: () => T & A;
  setState: (partial: Partial<T & A>) => void;
  subscribe: (listener: (state: T & A, prevState: T & A) => void) => () => void;
};

// 选择器 Hook 类型
export type SelectorHook<T, A extends BaseStore<T>, U> = () => U;

// Store 提供者 Props
export interface StoreProviderProps {
  children: React.ReactNode;
  stores?: Partial<StoreRegistry>;
}

// Store 上下文类型
export interface StoreContextType {
  stores: StoreRegistry;
  initialized: boolean;
  error: Error | null;
}

// Store 事件类型
export type StoreEventType =
  | "stateChange"
  | "action"
  | "error"
  | "reset"
  | "destroy"
  | "hydrate"
  | "persist"
  | "sync";

export interface StoreEvent {
  type: StoreEventType;
  storeName: string;
  timestamp: number;
  data?: any;
  error?: Error;
}

// Store 监听器类型
export type StoreListener = (event: StoreEvent) => void;

// Store 订阅选项
export interface StoreSubscriptionOptions {
  storeNames?: string[];
  eventTypes?: StoreEventType[];
  filter?: (event: StoreEvent) => boolean;
}
