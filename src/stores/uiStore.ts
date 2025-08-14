/**
 * UI 状态管理 Store
 */

import { MiddlewareCombinations } from "@/middleware";
import type { Notification, UIState } from "@/types/stateTypes";
import type { UIStore } from "@/types/storeTypes";
import { StateUtils } from "@/utils/stateUtils";
import React from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// 初始状态
const initialState: UIState = {
  // 界面状态
  isSidebarOpen: false,
  isSearchOpen: false,
  isSettingsOpen: false,

  // 模态框状态
  activeModal: null,
  modalData: null,

  // 主题状态
  theme: "system",
  colorScheme: "light",

  // 加载状态
  loadingStates: {},

  // 错误状态
  errors: {},

  // 通知状态
  notifications: [],
};

// 创建 UI Store
export const useUIStore = create<UIStore>()(
  MiddlewareCombinations.uiStore(
    subscribeWithSelector((set, get) => ({
      // 基础状态
      ...initialState,

      // 界面状态管理
      setSidebarOpen: (open: boolean) =>
        set((state) => ({
          ...state,
          isSidebarOpen: open,
        })),

      toggleSidebar: () =>
        set((state) => ({
          ...state,
          isSidebarOpen: !state.isSidebarOpen,
        })),

      setSearchOpen: (open: boolean) =>
        set((state) => ({
          ...state,
          isSearchOpen: open,
        })),

      toggleSearch: () =>
        set((state) => ({
          ...state,
          isSearchOpen: !state.isSearchOpen,
        })),

      setSettingsOpen: (open: boolean) =>
        set((state) => ({
          ...state,
          isSettingsOpen: open,
        })),

      toggleSettings: () =>
        set((state) => ({
          ...state,
          isSettingsOpen: !state.isSettingsOpen,
        })),

      // 模态框管理
      openModal: (modalType, data = null) =>
        set((state) => ({
          ...state,
          activeModal: modalType,
          modalData: data,
        })),

      closeModal: () =>
        set((state) => ({
          ...state,
          activeModal: null,
          modalData: null,
        })),

      setModalData: (data) =>
        set((state) => ({
          ...state,
          modalData: data,
        })),

      // 主题管理
      setTheme: (theme: "light" | "dark" | "system") =>
        set((state) => {
          const colorScheme =
            theme === "system"
              ? typeof window !== "undefined" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
              : theme;

          return {
            ...state,
            theme,
            colorScheme,
          };
        }),

      setColorScheme: (colorScheme: "light" | "dark") =>
        set((state) => ({
          ...state,
          colorScheme,
        })),

      updateColorScheme: () =>
        set((state) => {
          if (state.theme === "system") {
            const newColorScheme =
              typeof window !== "undefined" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            return {
              ...state,
              colorScheme: newColorScheme,
            };
          }
          return state;
        }),

      // 加载状态管理
      setLoading: (key: string, loading: boolean) =>
        set((state) => ({
          ...state,
          loadingStates: {
            ...state.loadingStates,
            [key]: loading,
          },
        })),

      setMultipleLoading: (loadingStates: Record<string, boolean>) =>
        set((state) => ({
          ...state,
          loadingStates: {
            ...state.loadingStates,
            ...loadingStates,
          },
        })),

      clearLoading: (key: string) =>
        set((state) => {
          const newLoadingStates = { ...state.loadingStates };
          delete newLoadingStates[key];
          return {
            ...state,
            loadingStates: newLoadingStates,
          };
        }),

      clearAllLoading: () =>
        set((state) => ({
          ...state,
          loadingStates: {},
        })),

      // 错误状态管理
      setError: (key: string, error: string | null) =>
        set((state) => ({
          ...state,
          errors: {
            ...state.errors,
            [key]: error,
          },
        })),

      setMultipleErrors: (errors: Record<string, string | null>) =>
        set((state) => ({
          ...state,
          errors: {
            ...state.errors,
            ...errors,
          },
        })),

      clearError: (key: string) =>
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[key];
          return {
            ...state,
            errors: newErrors,
          };
        }),

      clearAllErrors: () =>
        set((state) => ({
          ...state,
          errors: {},
        })),

      // 通知管理
      addNotification: (notification: Omit<Notification, "id" | "timestamp">) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          };

          return {
            ...state,
            notifications: [...state.notifications, newNotification],
          };
        }),

      removeNotification: (id: string) =>
        set((state) => ({
          ...state,
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      updateNotification: (id: string, updates: Partial<Notification>) =>
        set((state) => ({
          ...state,
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, ...updates } : n,
          ),
        })),

      clearNotifications: () =>
        set((state) => ({
          ...state,
          notifications: [],
        })),

      removeExpiredNotifications: () =>
        set((state) => {
          const now = Date.now();
          const activeNotifications = state.notifications.filter((n) => {
            if (n.duration === undefined) return true;
            return now - n.timestamp < n.duration;
          });

          return {
            ...state,
            notifications: activeNotifications,
          };
        }),

      // 便捷通知方法
      showSuccess: (title: string, message: string, duration = 3000) =>
        set((state) => {
          const notification: Notification = {
            id: `success_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "success",
            title,
            message,
            duration,
            timestamp: Date.now(),
          };

          return {
            ...state,
            notifications: [...state.notifications, notification],
          };
        }),

      showError: (title: string, message: string, duration = 5000) =>
        set((state) => {
          const notification: Notification = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "error",
            title,
            message,
            duration,
            timestamp: Date.now(),
          };

          return {
            ...state,
            notifications: [...state.notifications, notification],
          };
        }),

      showWarning: (title: string, message: string, duration = 4000) =>
        set((state) => {
          const notification: Notification = {
            id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "warning",
            title,
            message,
            duration,
            timestamp: Date.now(),
          };

          return {
            ...state,
            notifications: [...state.notifications, notification],
          };
        }),

      showInfo: (title: string, message: string, duration = 3000) =>
        set((state) => {
          const notification: Notification = {
            id: `info_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "info",
            title,
            message,
            duration,
            timestamp: Date.now(),
          };

          return {
            ...state,
            notifications: [...state.notifications, notification],
          };
        }),

      // 批量操作
      updateMultipleUIStates: (updates: Partial<UIState>) =>
        set((state) => ({
          ...state,
          ...updates,
        })),

      // 状态重置
      resetUIState: () => set(initialState),

      resetModalState: () =>
        set((state) => ({
          ...state,
          activeModal: null,
          modalData: null,
        })),

      resetNotifications: () =>
        set((state) => ({
          ...state,
          notifications: [],
        })),

      // 选择器
      select: (selector) => selector(get()),
    })),
  ),
);

// 导出预定义的选择器
export const uiSelectors = {
  // 界面状态
  getIsSidebarOpen: (state: UIState) => state.isSidebarOpen,
  getIsSearchOpen: (state: UIState) => state.isSearchOpen,
  getIsSettingsOpen: (state: UIState) => state.isSettingsOpen,

  // 模态框状态
  getActiveModal: (state: UIState) => state.activeModal,
  getModalData: (state: UIState) => state.modalData,
  getIsModalOpen: (state: UIState) => state.activeModal !== null,
  getIsSpecificModalOpen: (modalType: string) => (state: UIState) =>
    state.activeModal === modalType,

  // 主题状态
  getTheme: (state: UIState) => state.theme,
  getColorScheme: (state: UIState) => state.colorScheme,
  getIsDarkMode: (state: UIState) => state.colorScheme === "dark",

  // 加载状态
  getLoadingStates: (state: UIState) => state.loadingStates,
  getIsLoading: (key: string) => (state: UIState) =>
    state.loadingStates[key] || false,
  getAnyLoading: (state: UIState) =>
    Object.values(state.loadingStates).some((loading) => loading),
  getLoadingKeys: (state: UIState) =>
    Object.keys(state.loadingStates).filter((key) => state.loadingStates[key]),

  // 错误状态
  getErrors: (state: UIState) => state.errors,
  getError: (key: string) => (state: UIState) => state.errors[key],
  getHasError: (key: string) => (state: UIState) => state.errors[key] !== null,
  getAnyError: (state: UIState) =>
    Object.values(state.errors).some((error) => error !== null),
  getErrorKeys: (state: UIState) =>
    Object.keys(state.errors).filter((key) => state.errors[key] !== null),

  // 通知状态
  getNotifications: (state: UIState) => state.notifications,
  getNotificationsCount: (state: UIState) => state.notifications.length,
  getNotificationsByType: (type: Notification["type"]) => (state: UIState) =>
    state.notifications.filter((n) => n.type === type),
  getUnreadNotifications: (state: UIState) => state.notifications, // 可以根据需要添加已读/未读逻辑
  getRecentNotifications: (state: UIState, limit = 5) =>
    state.notifications.slice(0, limit),

  // 复合状态
  getUIStateSummary: (state: UIState) => ({
    isSidebarOpen: state.isSidebarOpen,
    isSearchOpen: state.isSearchOpen,
    isSettingsOpen: state.isSettingsOpen,
    activeModal: state.activeModal,
    theme: state.theme,
    colorScheme: state.colorScheme,
    notificationsCount: state.notifications.length,
    loadingCount: Object.keys(state.loadingStates).length,
    errorCount: Object.keys(state.errors).filter(
      (key) => state.errors[key] !== null,
    ).length,
  }),

  // 操作状态
  getCanInteract: (state: UIState) =>
    !Object.values(state.loadingStates).some((loading) => loading) &&
    state.activeModal === null,

  getModalVisibility: (modalType: string) => (state: UIState) => ({
    isVisible: state.activeModal === modalType,
    data: state.activeModal === modalType ? state.modalData : null,
  }),
};

// 创建记忆化 Hook
export const useUISelector = <T>(selector: (state: UIState) => T): T => {
  return useUIStore(StateUtils.createSelector(selector));
};

// 预定义的 Hook
export const useUITheme = () => useUISelector(uiSelectors.getTheme);
export const useColorScheme = () => useUISelector(uiSelectors.getColorScheme);
export const useIsDarkMode = () => useUISelector(uiSelectors.getIsDarkMode);
export const useModalState = (modalType: string) =>
  useUISelector(uiSelectors.getModalVisibility(modalType));
export const useNotifications = () =>
  useUISelector(uiSelectors.getNotifications);
export const useLoadingState = (key: string) =>
  useUISelector(uiSelectors.getIsLoading(key));
export const useErrorState = (key: string) =>
  useUISelector(uiSelectors.getError(key));
export const useUIStateSummary = () =>
  useUISelector(uiSelectors.getUIStateSummary);
export const useCanInteract = () => useUISelector(uiSelectors.getCanInteract);

// 便捷 Hook
export const useNotificationActions = () => {
  const showSuccess = (title: string, message: string, duration?: number) =>
    useUIStore.getState().showSuccess(title, message, duration);

  const showError = (title: string, message: string, duration?: number) =>
    useUIStore.getState().showError(title, message, duration);

  const showWarning = (title: string, message: string, duration?: number) =>
    useUIStore.getState().showWarning(title, message, duration);

  const showInfo = (title: string, message: string, duration?: number) =>
    useUIStore.getState().showInfo(title, message, duration);

  const removeNotification = (id: string) =>
    useUIStore.getState().removeNotification(id);

  const clearNotifications = () => useUIStore.getState().clearNotifications();

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearNotifications,
  };
};

// 主题监听 Hook
export const useThemeListener = () => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const setTheme = useUIStore((state) => state.setTheme);
  const updateColorScheme = useUIStore((state) => state.updateColorScheme);

  React.useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => updateColorScheme();

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, updateColorScheme]);

  return { theme, colorScheme, setTheme };
};
