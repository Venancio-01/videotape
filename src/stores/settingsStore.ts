/**
 * 设置状态管理 Store
 */

import { StateUtils } from "@/src/utils/stateUtils";
import type { SettingsState } from "@/src/types/stateTypes";
import type { SettingsStore } from "@/src/types/storeTypes";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { MiddlewareCombinations } from "../middleware";

// 初始状态
const initialState: SettingsState = {
  // 界面设置
  theme: "system",
  language: "zh-CN",
  fontSize: "medium",

  // 播放设置
  defaultPlaybackSpeed: 1.0,
  defaultVolume: 1.0,
  defaultQuality: "auto",
  autoPlay: true,
  autoNext: true,

  // 缓存设置
  maxCacheSize: 1024, // MB
  cacheRetentionDays: 30,
  autoClearCache: true,

  // 隐私设置
  analyticsEnabled: false,
  crashReportingEnabled: true,

  // 开发者设置
  debugMode: false,
  logLevel: "info",

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

      setFontSize: (fontSize: "small" | "medium" | "large") =>
        set((state) => ({
          ...state,
          fontSize,
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

      setDefaultQuality: (quality: "auto" | "low" | "medium" | "high") =>
        set((state) => ({
          ...state,
          defaultQuality: quality,
        })),

      setAutoPlay: (autoPlay: boolean) =>
        set((state) => ({
          ...state,
          autoPlay,
        })),

      setAutoNext: (autoNext: boolean) =>
        set((state) => ({
          ...state,
          autoNext,
        })),

      // 缓存设置
      setMaxCacheSize: (size: number) =>
        set((state) => ({
          ...state,
          maxCacheSize: Math.max(100, Math.min(size, 10240)), // 100MB - 10GB
        })),

      setCacheRetentionDays: (days: number) =>
        set((state) => ({
          ...state,
          cacheRetentionDays: Math.max(1, Math.min(days, 365)),
        })),

      setAutoClearCache: (autoClear: boolean) =>
        set((state) => ({
          ...state,
          autoClearCache,
        })),

      // 隐私设置
      setAnalyticsEnabled: (enabled: boolean) =>
        set((state) => ({
          ...state,
          analyticsEnabled: enabled,
        })),

      setCrashReportingEnabled: (enabled: boolean) =>
        set((state) => ({
          ...state,
          crashReportingEnabled: enabled,
        })),

      // 开发者设置
      setDebugMode: (enabled: boolean) =>
        set((state) => ({
          ...state,
          debugMode: enabled,
          logLevel: enabled ? "debug" : "info",
        })),

      setLogLevel: (level: "debug" | "info" | "warn" | "error") =>
        set((state) => ({
          ...state,
          logLevel: level,
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

          if (newState.maxCacheSize !== undefined) {
            newState.maxCacheSize = Math.max(
              100,
              Math.min(newState.maxCacheSize, 10240),
            );
          }

          if (newState.cacheRetentionDays !== undefined) {
            newState.cacheRetentionDays = Math.max(
              1,
              Math.min(newState.cacheRetentionDays, 365),
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
          fontSize: initialState.fontSize,
        })),

      resetPlaybackSettings: () =>
        set((state) => ({
          ...state,
          defaultPlaybackSpeed: initialState.defaultPlaybackSpeed,
          defaultVolume: initialState.defaultVolume,
          defaultQuality: initialState.defaultQuality,
          autoPlay: initialState.autoPlay,
          autoNext: initialState.autoNext,
        })),

      resetCacheSettings: () =>
        set((state) => ({
          ...state,
          maxCacheSize: initialState.maxCacheSize,
          cacheRetentionDays: initialState.cacheRetentionDays,
          autoClearCache: initialState.autoClearCache,
        })),

      resetPrivacySettings: () =>
        set((state) => ({
          ...state,
          analyticsEnabled: initialState.analyticsEnabled,
          crashReportingEnabled: initialState.crashReportingEnabled,
        })),

      resetDeveloperSettings: () =>
        set((state) => ({
          ...state,
          debugMode: initialState.debugMode,
          logLevel: initialState.logLevel,
        })),

      // 导出设置
      exportSettings: () => {
        const state = get();
        const exportData = {
          version: "1.0",
          timestamp: new Date().toISOString(),
          settings: {
            theme: state.theme,
            language: state.language,
            fontSize: state.fontSize,
            defaultPlaybackSpeed: state.defaultPlaybackSpeed,
            defaultVolume: state.defaultVolume,
            defaultQuality: state.defaultQuality,
            autoPlay: state.autoPlay,
            autoNext: state.autoNext,
            maxCacheSize: state.maxCacheSize,
            cacheRetentionDays: state.cacheRetentionDays,
            autoClearCache: state.autoClearCache,
            analyticsEnabled: state.analyticsEnabled,
            crashReportingEnabled: state.crashReportingEnabled,
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
          if (importedSettings.fontSize !== undefined) {
            updates.fontSize = importedSettings.fontSize;
          }

          // 播放设置
          if (importedSettings.defaultPlaybackSpeed !== undefined) {
            updates.defaultPlaybackSpeed =
              importedSettings.defaultPlaybackSpeed;
          }
          if (importedSettings.defaultVolume !== undefined) {
            updates.defaultVolume = importedSettings.defaultVolume;
          }
          if (importedSettings.defaultQuality !== undefined) {
            updates.defaultQuality = importedSettings.defaultQuality;
          }
          if (importedSettings.autoPlay !== undefined) {
            updates.autoPlay = importedSettings.autoPlay;
          }
          if (importedSettings.autoNext !== undefined) {
            updates.autoNext = importedSettings.autoNext;
          }

          // 缓存设置
          if (importedSettings.maxCacheSize !== undefined) {
            updates.maxCacheSize = importedSettings.maxCacheSize;
          }
          if (importedSettings.cacheRetentionDays !== undefined) {
            updates.cacheRetentionDays = importedSettings.cacheRetentionDays;
          }
          if (importedSettings.autoClearCache !== undefined) {
            updates.autoClearCache = importedSettings.autoClearCache;
          }

          // 隐私设置
          if (importedSettings.analyticsEnabled !== undefined) {
            updates.analyticsEnabled = importedSettings.analyticsEnabled;
          }
          if (importedSettings.crashReportingEnabled !== undefined) {
            updates.crashReportingEnabled =
              importedSettings.crashReportingEnabled;
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
  getFontSize: (state: SettingsState) => state.fontSize,

  // 播放设置
  getDefaultPlaybackSpeed: (state: SettingsState) => state.defaultPlaybackSpeed,
  getDefaultVolume: (state: SettingsState) => state.defaultVolume,
  getDefaultQuality: (state: SettingsState) => state.defaultQuality,
  getAutoPlay: (state: SettingsState) => state.autoPlay,
  getAutoNext: (state: SettingsState) => state.autoNext,

  // 缓存设置
  getMaxCacheSize: (state: SettingsState) => state.maxCacheSize,
  getCacheRetentionDays: (state: SettingsState) => state.cacheRetentionDays,
  getAutoClearCache: (state: SettingsState) => state.autoClearCache,

  // 隐私设置
  getAnalyticsEnabled: (state: SettingsState) => state.analyticsEnabled,
  getCrashReportingEnabled: (state: SettingsState) =>
    state.crashReportingEnabled,

  // 开发者设置
  getDebugMode: (state: SettingsState) => state.debugMode,
  getLogLevel: (state: SettingsState) => state.logLevel,

  // 加载状态
  getIsLoading: (state: SettingsState) => state.isLoading,
  getError: (state: SettingsState) => state.error,

  // 复合选择器
  getUISettings: (state: SettingsState) => ({
    theme: state.theme,
    language: state.language,
    fontSize: state.fontSize,
  }),

  getPlaybackSettings: (state: SettingsState) => ({
    defaultPlaybackSpeed: state.defaultPlaybackSpeed,
    defaultVolume: state.defaultVolume,
    defaultQuality: state.defaultQuality,
    autoPlay: state.autoPlay,
    autoNext: state.autoNext,
  }),

  getCacheSettings: (state: SettingsState) => ({
    maxCacheSize: state.maxCacheSize,
    cacheRetentionDays: state.cacheRetentionDays,
    autoClearCache: state.autoClearCache,
  }),

  getPrivacySettings: (state: SettingsState) => ({
    analyticsEnabled: state.analyticsEnabled,
    crashReportingEnabled: state.crashReportingEnabled,
  }),

  getDeveloperSettings: (state: SettingsState) => ({
    debugMode: state.debugMode,
    logLevel: state.logLevel,
  }),

  // 格式化选项
  getThemeOptions: () => [
    { value: "light", label: "浅色模式" },
    { value: "dark", label: "深色模式" },
    { value: "system", label: "跟随系统" },
  ],

  getFontSizeOptions: () => [
    { value: "small", label: "小" },
    { value: "medium", label: "中" },
    { value: "large", label: "大" },
  ],

  getPlaybackSpeedOptions: () => [
    { value: 0.25, label: "0.25x" },
    { value: 0.5, label: "0.5x" },
    { value: 0.75, label: "0.75x" },
    { value: 1.0, label: "1.0x (正常)" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.5x" },
    { value: 1.75, label: "1.75x" },
    { value: 2.0, label: "2.0x" },
  ],

  getQualityOptions: () => [
    { value: "auto", label: "自动" },
    { value: "low", label: "低质量" },
    { value: "medium", label: "中等质量" },
    { value: "high", label: "高质量" },
  ],

  getCacheSizeOptions: () => [
    { value: 100, label: "100 MB" },
    { value: 512, label: "512 MB" },
    { value: 1024, label: "1 GB" },
    { value: 2048, label: "2 GB" },
    { value: 5120, label: "5 GB" },
    { value: 10240, label: "10 GB" },
  ],

  getLogLevelOptions: () => [
    { value: "debug", label: "调试" },
    { value: "info", label: "信息" },
    { value: "warn", label: "警告" },
    { value: "error", label: "错误" },
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

    if (state.maxCacheSize < 100 || state.maxCacheSize > 10240) {
      errors.push("缓存大小必须在 100MB - 10GB 之间");
    }

    if (state.cacheRetentionDays < 1 || state.cacheRetentionDays > 365) {
      errors.push("缓存保留天数必须在 1 - 365 天之间");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // 设置统计
  getSettingsStats: (state: SettingsState) => {
    const totalCacheSize = state.maxCacheSize * 1024 * 1024; // 转换为字节
    const estimatedStorage = {
      cache: totalCacheSize,
      settings: JSON.stringify(state).length,
    };

    return {
      totalSettings: Object.keys(state).length,
      estimatedStorage,
      cacheSizeMB: state.maxCacheSize,
      cacheRetentionDays: state.cacheRetentionDays,
      isDebugMode: state.debugMode,
      analyticsEnabled: state.analyticsEnabled,
    };
  },
};

// 创建记忆化 Hook
export const useSettingsSelector = <T>(
  selector: (state: SettingsState) => T,
): T => {
  return useSettingsStore(StateUtils.createSelector(selector));
};

// 预定义的 Hook
export const useTheme = () => useSettingsSelector(settingsSelectors.getTheme);
export const useLanguage = () =>
  useSettingsSelector(settingsSelectors.getLanguage);
export const useFontSize = () =>
  useSettingsSelector(settingsSelectors.getFontSize);
export const usePlaybackSettings = () =>
  useSettingsSelector(settingsSelectors.getPlaybackSettings);
export const useCacheSettings = () =>
  useSettingsSelector(settingsSelectors.getCacheSettings);
export const usePrivacySettings = () =>
  useSettingsSelector(settingsSelectors.getPrivacySettings);
export const useDeveloperSettings = () =>
  useSettingsSelector(settingsSelectors.getDeveloperSettings);
export const useSettingsValidation = () =>
  useSettingsSelector(settingsSelectors.getSettingsValidation);
export const useSettingsStats = () =>
  useSettingsSelector(settingsSelectors.getSettingsStats);

// 便捷的选项 Hook
export const useThemeOptions = () => settingsSelectors.getThemeOptions();
export const useFontSizeOptions = () => settingsSelectors.getFontSizeOptions();
export const usePlaybackSpeedOptions = () =>
  settingsSelectors.getPlaybackSpeedOptions();
export const useQualityOptions = () => settingsSelectors.getQualityOptions();
export const useCacheSizeOptions = () =>
  settingsSelectors.getCacheSizeOptions();
export const useLogLevelOptions = () => settingsSelectors.getLogLevelOptions();
