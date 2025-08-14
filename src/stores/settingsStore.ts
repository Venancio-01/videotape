/**
 * 设置状态管理 Store
 */

import { MiddlewareCombinations } from "@/middleware";
import type { SettingsState } from "@/types/stateTypes";
import type { SettingsStore } from "@/types/storeTypes";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// 初始状态
const initialState: SettingsState = {
  // 界面设置
  theme: "system",
  language: "zh-CN",

  // 播放设置
  defaultPlaybackSpeed: 1.0,
  defaultVolume: 1.0,
  autoPlay: true,
  loopMode: "none",
  showControls: true,
  enableGestures: true,
  enableHaptics: true,

  // 自动播放播放列表设置
  currentPlaylistId: null,
  autoPlayPlaylist: false,
  resumeFromPosition: true,
  lastPlayedVideoId: null,
  lastPlayedPosition: 0,

  // 加载状态
  isLoading: false,
  error: null,
};

// 创建设置 Store
export const useSettingsStore = create<SettingsStore>()(
  MiddlewareCombinations.settingsStore(
    subscribeWithSelector((set, get) => ({
      // 基础状态
      ...initialState,

      // 界面设置
      setTheme: (theme: "light" | "dark" | "system") =>
        set((state) => ({
          ...state,
          theme,
        })),

      setLanguage: (language: string) =>
        set((state) => ({
          ...state,
          language,
        })),

      // 播放设置
      setDefaultPlaybackSpeed: (speed: number) =>
        set((state) => ({
          ...state,
          defaultPlaybackSpeed: Math.max(0.25, Math.min(speed, 4.0)),
        })),

      setDefaultVolume: (volume: number) =>
        set((state) => ({
          ...state,
          defaultVolume: Math.max(0, Math.min(volume, 1.0)),
        })),

      setAutoPlay: (autoPlay: boolean) =>
        set((state) => ({
          ...state,
          autoPlay,
        })),

      setLoopMode: (loopMode: "none" | "single" | "all") =>
        set((state) => ({
          ...state,
          loopMode,
        })),

      setShowControls: (showControls: boolean) =>
        set((state) => ({
          ...state,
          showControls,
        })),

      setEnableGestures: (enableGestures: boolean) =>
        set((state) => ({
          ...state,
          enableGestures,
        })),

      setEnableHaptics: (enableHaptics: boolean) =>
        set((state) => ({
          ...state,
          enableHaptics,
        })),

      // 自动播放播放列表设置
      setCurrentPlaylistId: (playlistId: string | null) =>
        set((state) => ({
          ...state,
          currentPlaylistId: playlistId,
        })),

      setAutoPlayPlaylist: (autoPlayPlaylist: boolean) =>
        set((state) => ({
          ...state,
          autoPlayPlaylist,
        })),

      setResumeFromPosition: (resumeFromPosition: boolean) =>
        set((state) => ({
          ...state,
          resumeFromPosition,
        })),

      setLastPlayedVideoId: (videoId: string | null) =>
        set((state) => ({
          ...state,
          lastPlayedVideoId: videoId,
        })),

      setLastPlayedPosition: (position: number) =>
        set((state) => ({
          ...state,
          lastPlayedPosition: Math.max(0, position),
        })),

      // 批量更新
      updateSettings: (updates: Partial<SettingsState>) =>
        set((state) => {
          const newState = { ...state, ...updates };

          // 验证和约束数值
          if (newState.defaultPlaybackSpeed !== undefined) {
            newState.defaultPlaybackSpeed = Math.max(
              0.25,
              Math.min(newState.defaultPlaybackSpeed, 4.0),
            );
          }

          if (newState.defaultVolume !== undefined) {
            newState.defaultVolume = Math.max(
              0,
              Math.min(newState.defaultVolume, 1.0),
            );
          }

          return newState;
        }),

      // 重置设置
      resetSettings: () => set(initialState),

      // 重置分类设置
      resetUISettings: () =>
        set((state) => ({
          ...state,
          theme: initialState.theme,
          language: initialState.language,
        })),

      resetPlaybackSettings: () =>
        set((state) => ({
          ...state,
          defaultPlaybackSpeed: initialState.defaultPlaybackSpeed,
          defaultVolume: initialState.defaultVolume,
          autoPlay: initialState.autoPlay,
          loopMode: initialState.loopMode,
          showControls: initialState.showControls,
          enableGestures: initialState.enableGestures,
          enableHaptics: initialState.enableHaptics,
        })),

      resetCacheSettings: () =>
        set((state) => ({
          ...state,
        })),

      resetPrivacySettings: () =>
        set((state) => ({
          ...state,
        })),

      resetDeveloperSettings: () =>
        set((state) => ({
          ...state,
        })),

      // 导出设置
      exportSettings: () => {
        const state = get() as SettingsState;
        const exportData = {
          version: "1.0",
          timestamp: new Date().toISOString(),
          settings: {
            theme: state.theme,
            language: state.language,
            defaultPlaybackSpeed: state.defaultPlaybackSpeed,
            defaultVolume: state.defaultVolume,
            autoPlay: state.autoPlay,
            loopMode: state.loopMode,
            showControls: state.showControls,
            enableGestures: state.enableGestures,
            enableHaptics: state.enableHaptics,
          },
        };

        return JSON.stringify(exportData, null, 2);
      },

      // 导入设置
      importSettings: (settingsJson: string) => {
        try {
          const importData = JSON.parse(settingsJson);

          // 验证版本和格式
          if (!importData.version || !importData.settings) {
            throw new Error("Invalid settings format");
          }

          // 合并设置，只更新存在的字段
          const updates: Partial<SettingsState> = {};
          const importedSettings = importData.settings;

          // 界面设置
          if (importedSettings.theme !== undefined) {
            updates.theme = importedSettings.theme;
          }
          if (importedSettings.language !== undefined) {
            updates.language = importedSettings.language;
          }

          // 播放设置
          if (importedSettings.defaultPlaybackSpeed !== undefined) {
            updates.defaultPlaybackSpeed =
              importedSettings.defaultPlaybackSpeed;
          }
          if (importedSettings.defaultVolume !== undefined) {
            updates.defaultVolume = importedSettings.defaultVolume;
          }
          if (importedSettings.autoPlay !== undefined) {
            updates.autoPlay = importedSettings.autoPlay;
          }
          if (importedSettings.loopMode !== undefined) {
            updates.loopMode = importedSettings.loopMode;
          }
          if (importedSettings.showControls !== undefined) {
            updates.showControls = importedSettings.showControls;
          }
          if (importedSettings.enableGestures !== undefined) {
            updates.enableGestures = importedSettings.enableGestures;
          }
          if (importedSettings.enableHaptics !== undefined) {
            updates.enableHaptics = importedSettings.enableHaptics;
          }

          // 应用更新
          get().updateSettings(updates);
          return true;
        } catch (error) {
          console.error("Failed to import settings:", error);
          get().setError("导入设置失败：格式无效");
          return false;
        }
      },

      // 加载状态
      setLoading: (loading: boolean) =>
        set((state) => ({
          ...state,
          isLoading: loading,
        })),

      setError: (error: string | null) =>
        set((state) => ({
          ...state,
          error,
        })),

      clearError: () =>
        set((state) => ({
          ...state,
          error: null,
        })),

      // 选择器
      select: (selector) => selector(get()),
    })),
  ),
);

// 导出预定义的选择器
export const settingsSelectors = {
  // 界面设置
  getTheme: (state: SettingsState) => state.theme,
  getLanguage: (state: SettingsState) => state.language,

  // 播放设置
  getDefaultPlaybackSpeed: (state: SettingsState) => state.defaultPlaybackSpeed,
  getDefaultVolume: (state: SettingsState) => state.defaultVolume,
  getAutoPlay: (state: SettingsState) => state.autoPlay,
  getLoopMode: (state: SettingsState) => state.loopMode,
  getShowControls: (state: SettingsState) => state.showControls,
  getEnableGestures: (state: SettingsState) => state.enableGestures,
  getEnableHaptics: (state: SettingsState) => state.enableHaptics,

  // 自动播放播放列表设置
  getCurrentPlaylistId: (state: SettingsState) => state.currentPlaylistId,
  getAutoPlayPlaylist: (state: SettingsState) => state.autoPlayPlaylist,
  getResumeFromPosition: (state: SettingsState) => state.resumeFromPosition,
  getLastPlayedVideoId: (state: SettingsState) => state.lastPlayedVideoId,
  getLastPlayedPosition: (state: SettingsState) => state.lastPlayedPosition,

  // 加载状态
  getIsLoading: (state: SettingsState) => state.isLoading,
  getError: (state: SettingsState) => state.error,

  // 复合选择器
  getUISettings: (state: SettingsState) => ({
    theme: state.theme,
    language: state.language,
  }),

  getPlaybackSettings: (state: SettingsState) => ({
    defaultPlaybackSpeed: state.defaultPlaybackSpeed,
    defaultVolume: state.defaultVolume,
    autoPlay: state.autoPlay,
    loopMode: state.loopMode,
    showControls: state.showControls,
    enableGestures: state.enableGestures,
    enableHaptics: state.enableHaptics,
  }),

  getAutoPlayPlaylistSettings: (state: SettingsState) => ({
    currentPlaylistId: state.currentPlaylistId,
    autoPlayPlaylist: state.autoPlayPlaylist,
    resumeFromPosition: state.resumeFromPosition,
    lastPlayedVideoId: state.lastPlayedVideoId,
    lastPlayedPosition: state.lastPlayedPosition,
  }),

  // 格式化选项
  getThemeOptions: () => [
    { value: "light", label: "浅色模式" },
    { value: "dark", label: "深色模式" },
    { value: "system", label: "跟随系统" },
  ],

  // 验证状态
  getSettingsValidation: (state: SettingsState) => {
    const errors: string[] = [];

    if (state.defaultPlaybackSpeed < 0.25 || state.defaultPlaybackSpeed > 4.0) {
      errors.push("播放速度必须在 0.25x - 4.0x 之间");
    }

    if (state.defaultVolume < 0 || state.defaultVolume > 1.0) {
      errors.push("音量必须在 0 - 1.0 之间");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// 创建记忆化 Hook
export const useSettingsSelector = <T>(
  selector: (state: SettingsState) => T,
): T => {
  return useSettingsStore(selector);
};

// 预定义的 Hook
export const useTheme = () => useSettingsSelector(settingsSelectors.getTheme);
export const useLanguage = () =>
  useSettingsSelector(settingsSelectors.getLanguage);
export const usePlaybackSettings = () =>
  useSettingsSelector(settingsSelectors.getPlaybackSettings);
export const useAutoPlayPlaylistSettings = () =>
  useSettingsSelector(settingsSelectors.getAutoPlayPlaylistSettings);
export const useCurrentPlaylistId = () =>
  useSettingsSelector(settingsSelectors.getCurrentPlaylistId);
export const useSettingsValidation = () =>
  useSettingsSelector(settingsSelectors.getSettingsValidation);

// 便捷的选项 Hook
export const useThemeOptions = () => settingsSelectors.getThemeOptions();
