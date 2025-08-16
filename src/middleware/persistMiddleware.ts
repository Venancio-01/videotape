/**
 * 持久化中间件
 */

import { zustandStorage } from "@/lib/storage";
import { persist } from "zustand/middleware";

// 持久化配置接口
export interface PersistConfig<T> {
  name: string;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (
    state?: T,
  ) => ((state?: T, error?: Error) => void) | undefined;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
  merge?: (persistedState: Partial<T>, currentState: T) => T;
  skipHydration?: boolean;
  serialize?: (state: Partial<T>) => string;
  deserialize?: (str: string) => Partial<T>;
}

// 创建持久化中间件
export const createPersistMiddleware = <T>(config: PersistConfig<T>) => {
  const {
    name,
    partialize,
    onRehydrateStorage,
    version,
    migrate,
    merge,
    skipHydration,
    serialize,
    deserialize,
  } = config;

  const persistOptions: any = {
    name,
    storage: zustandStorage,
    version: version || 0,
    skipHydration,
  };

  // 添加部分持久化
  if (partialize) {
    persistOptions.partialize = partialize;
  }

  // 添加重水合回调
  if (onRehydrateStorage) {
    persistOptions.onRehydrateStorage = onRehydrateStorage;
  }

  // 添加迁移功能
  if (migrate) {
    persistOptions.migrate = migrate;
  }

  // 添加自定义合并
  if (merge) {
    persistOptions.merge = merge;
  }

  // 添加自定义序列化
  if (serialize) {
    persistOptions.serialize = serialize;
  }

  // 添加自定义反序列化
  if (deserialize) {
    persistOptions.deserialize = deserialize;
  }

  return (stateCreator: any) => {
    return persist(stateCreator, persistOptions);
  };
};

// 预定义的持久化配置
export const PersistConfigs = {
  // 视频存储配置
  videoStore: {
    name: "videotape-video-storage",
    version: 1,
    partialize: (state: any) => ({
      favorites: Array.from(state.favorites || []),
      searchQuery: state.searchQuery || "",
      watchHistory: state.watchHistory || [],
      pagination: state.pagination || {
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: true,
      },
    }),
    migrate: (persistedState: any, version: number) => {
      if (version === 0) {
        // 从版本 0 迁移到版本 1
        return {
          ...persistedState,
          favorites: new Set(persistedState.favorites || []),
          pagination: persistedState.pagination || {
            page: 1,
            pageSize: 20,
            total: 0,
            hasMore: true,
          },
        };
      }
      return persistedState;
    },
  },

  // 播放存储配置
  playbackStore: {
    name: "videotape-playback-storage",
    version: 1,
    partialize: (state: any) => ({
      volume: state.volume || 1.0,
      playbackRate: state.playbackRate || 1.0,
      isLooping: state.isLooping || false,
      isMuted: state.isMuted || false,
      repeatMode: state.repeatMode || "none",
      shuffleMode: state.shuffleMode || false,
    }),
  },

  // 队列存储配置
  queueStore: {
    name: "videotape-queue-storage",
    version: 1,
    partialize: (state: any) => ({
      queue: state.queue || [],
      currentQueueIndex: state.currentQueueIndex || -1,
      history: state.history || [],
      playlists: state.playlists || [],
      isShuffleOn: state.isShuffleOn || false,
      repeatMode: state.repeatMode || "none",
    }),
  },

  // 设置存储配置
  settingsStore: {
    name: "videotape-settings-storage",
    version: 1,
    partialize: (state: any) => ({
      theme: state.theme || "system",
      language: state.language || "zh-CN",
      defaultPlaybackSpeed: state.defaultPlaybackSpeed || 1.0,
      defaultVolume: state.defaultVolume || 1.0,
      autoPlay: state.autoPlay !== undefined ? state.autoPlay : true,
      loopMode: state.loopMode || "none",
      showControls:
        state.showControls !== undefined ? state.showControls : true,
      enableGestures:
        state.enableGestures !== undefined ? state.enableGestures : true,
      enableHaptics:
        state.enableHaptics !== undefined ? state.enableHaptics : true,
    }),
  },

  // UI 存储配置
  uiStore: {
    name: "videotape-ui-storage",
    version: 1,
    partialize: (state: any) => ({
      theme: state.theme || "system",
      colorScheme: state.colorScheme || "light",
      isSidebarOpen: state.isSidebarOpen || false,
      screenOrientation: state.screenOrientation || "portrait",
      isOrientationLocked: state.isOrientationLocked || false,
      notifications: state.notifications || [],
    }),
  },
};

// 持久化工具函数
export const PersistUtils = {
  // 清理所有持久化数据
  clearAllPersistedData: async () => {
    const storage = zustandStorage;
    const keys = Object.values(PersistConfigs).map((config) => config.name);

    for (const key of keys) {
      try {
        await storage.removeItem(key);
      } catch (error) {
        console.error(`Failed to clear persisted data for ${key}:`, error);
      }
    }
  },

  // 获取存储使用情况
  getStorageUsage: async () => {
    const storage = zustandStorage;
    const usage: Record<string, number> = {};

    for (const config of Object.values(PersistConfigs)) {
      try {
        const value = await storage.getItem(config.name);
        if (value) {
          usage[config.name] = new Blob([value]).size;
        }
      } catch (error) {
        console.error(`Failed to get storage usage for ${config.name}:`, error);
      }
    }

    return usage;
  },

  // 备份持久化数据
  backupPersistedData: async () => {
    const storage = zustandStorage;
    const backup: Record<string, string> = {};

    for (const config of Object.values(PersistConfigs)) {
      try {
        const value = await storage.getItem(config.name);
        if (value) {
          backup[config.name] = value;
        }
      } catch (error) {
        console.error(`Failed to backup data for ${config.name}:`, error);
      }
    }

    return backup;
  },

  // 恢复持久化数据
  restorePersistedData: async (backup: Record<string, string>) => {
    const storage = zustandStorage;

    for (const [key, value] of Object.entries(backup)) {
      try {
        await storage.setItem(key, value);
      } catch (error) {
        console.error(`Failed to restore data for ${key}:`, error);
      }
    }
  },

  // 导出持久化配置
  exportConfigs: () => {
    return Object.keys(PersistConfigs).reduce(
      (acc, key) => {
        acc[key] = PersistConfigs[key as keyof typeof PersistConfigs];
        return acc;
      },
      {} as Record<string, PersistConfig<any>>,
    );
  },
};
