import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppSettings } from '../app/types';

/**
 * 设置状态管理
 */
interface SettingsState {
  settings: AppSettings;
  
  // 操作方法
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // 主题相关
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: string) => void;
  
  // 播放器设置
  setVolume: (volume: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setQuality: (quality: 'auto' | 'low' | 'medium' | 'high') => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setLoop: (loop: boolean) => void;
  setShuffle: (shuffle: boolean) => void;
  setDataSaver: (dataSaver: boolean) => void;
  setBackgroundPlay: (backgroundPlay: boolean) => void;
}

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'zh-CN',
  autoPlay: false,
  loop: false,
  shuffle: false,
  volume: 1.0,
  playbackSpeed: 1.0,
  quality: 'auto',
  dataSaver: false,
  backgroundPlay: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      // 更新设置
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      // 重置设置
      resetSettings: () => set({ settings: defaultSettings }),

      // 主题设置
      setTheme: (theme) => set((state) => ({
        settings: { ...state.settings, theme }
      })),

      setLanguage: (language) => set((state) => ({
        settings: { ...state.settings, language }
      })),

      // 播放器设置
      setVolume: (volume) => set((state) => ({
        settings: { ...state.settings, volume: Math.max(0, Math.min(1, volume)) }
      })),

      setPlaybackSpeed: (speed) => set((state) => ({
        settings: { ...state.settings, playbackSpeed: Math.max(0.25, Math.min(3, speed)) }
      })),

      setQuality: (quality) => set((state) => ({
        settings: { ...state.settings, quality }
      })),

      setAutoPlay: (autoPlay) => set((state) => ({
        settings: { ...state.settings, autoPlay }
      })),

      setLoop: (loop) => set((state) => ({
        settings: { ...state.settings, loop }
      })),

      setShuffle: (shuffle) => set((state) => ({
        settings: { ...state.settings, shuffle }
      })),

      setDataSaver: (dataSaver) => set((state) => ({
        settings: { ...state.settings, dataSaver }
      })),

      setBackgroundPlay: (backgroundPlay) => set((state) => ({
        settings: { ...state.settings, backgroundPlay }
      })),
    }),
    {
      name: 'videotape-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // 迁移旧版本的数据
          return {
            settings: {
              ...defaultSettings,
              ...persistedState.settings,
            },
          };
        }
        return persistedState;
      },
    }
  )
);