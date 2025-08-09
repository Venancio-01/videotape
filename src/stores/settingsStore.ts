import { create } from 'zustand';
import { AppSettings } from '@/types';
import { configService } from '@/storage/config-service';

/**
 * 设置状态管理 - 使用新的配置服务
 */
interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;

  // 主题相关
  setTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;

  // 播放器设置
  setVolume: (volume: number) => Promise<void>;
  setPlaybackSpeed: (speed: number) => Promise<void>;
  setQuality: (quality: 'auto' | 'low' | 'medium' | 'high') => Promise<void>;
  setAutoPlay: (autoPlay: boolean) => Promise<void>;
  setLoop: (loop: boolean) => Promise<void>;
  setShuffle: (shuffle: boolean) => Promise<void>;
  setDataSaver: (dataSaver: boolean) => Promise<void>;
  setBackgroundPlay: (backgroundPlay: boolean) => Promise<void>;
}

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'auto',
  autoPlay: false,
  loop: false,
  shuffle: false,
  volume: 1.0,
  playbackSpeed: 1.0,
  quality: 'auto',
  dataSaver: false,
  backgroundPlay: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  error: null,

  // 从配置服务加载设置
  refreshSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = configService.getConfig();
      const appSettings: AppSettings = {
        theme: config.ui.theme,
        autoPlay: config.player.autoPlay,
        loop: config.player.loop,
        shuffle: config.player.shuffle,
        volume: config.player.volume,
        playbackSpeed: config.player.playbackSpeed,
        quality: config.player.defaultQuality,
        dataSaver: config.network.dataSaver,
        backgroundPlay: false, // 这个字段在新架构中可能需要调整
      };
      set({ settings: appSettings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载设置失败',
        isLoading: false,
      });
    }
  },

  // 更新设置
  updateSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      // 更新配置服务
      await configService.updatePlayerSettings({
        volume: updates.volume,
        playbackSpeed: updates.playbackSpeed,
        defaultQuality: updates.quality,
        autoPlay: updates.autoPlay,
        loop: updates.loop,
        shuffle: updates.shuffle,
      });

      await configService.updateUISettings({
        theme: updates.theme,
      });

      await configService.updateNetworkSettings({
        dataSaver: updates.dataSaver,
      });

      // 更新本地状态
      set((state) => ({
        settings: { ...state.settings, ...updates },
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新设置失败',
        isLoading: false,
      });
    }
  },

  // 重置设置
  resetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      await configService.resetConfig();
      set({ settings: defaultSettings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '重置设置失败',
        isLoading: false,
      });
    }
  },

  // 主题设置
  setTheme: async (theme) => {
    await get().updateSettings({ theme });
  },

  // 播放器设置
  setVolume: async (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    await get().updateSettings({ volume: clampedVolume });
  },

  setPlaybackSpeed: async (speed) => {
    const clampedSpeed = Math.max(0.25, Math.min(3, speed));
    await get().updateSettings({ playbackSpeed: clampedSpeed });
  },

  setQuality: async (quality) => {
    await get().updateSettings({ quality });
  },

  setAutoPlay: async (autoPlay) => {
    await get().updateSettings({ autoPlay });
  },

  setLoop: async (loop) => {
    await get().updateSettings({ loop });
  },

  setShuffle: async (shuffle) => {
    await get().updateSettings({ shuffle });
  },

  setDataSaver: async (dataSaver) => {
    await get().updateSettings({ dataSaver });
  },

  setBackgroundPlay: async (backgroundPlay) => {
    await get().updateSettings({ backgroundPlay });
  },
}));
