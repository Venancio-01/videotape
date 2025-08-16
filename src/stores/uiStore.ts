/**
 * UI 状态管理 Store - 管理界面状态、主题、屏幕方向等
 */

import { MiddlewareCombinations } from "@/middleware";
import type { UIState, UIStore } from "@/types/storeTypes";
import * as ScreenOrientation from "expo-screen-orientation";
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

  // 屏幕方向状态
  screenOrientation: "portrait",
  isOrientationLocked: false,

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

      // === 界面状态管理 ===
      toggleSidebar: () =>
        set((state) => ({
          ...state,
          isSidebarOpen: !state.isSidebarOpen,
        })),

      setSidebarOpen: (open: boolean) =>
        set((state) => ({
          ...state,
          isSidebarOpen: open,
        })),

      toggleSearch: () =>
        set((state) => ({
          ...state,
          isSearchOpen: !state.isSearchOpen,
        })),

      setSearchOpen: (open: boolean) =>
        set((state) => ({
          ...state,
          isSearchOpen: open,
        })),

      toggleSettings: () =>
        set((state) => ({
          ...state,
          isSettingsOpen: !state.isSettingsOpen,
        })),

      setSettingsOpen: (open: boolean) =>
        set((state) => ({
          ...state,
          isSettingsOpen: open,
        })),

      // === 模态框管理 ===
      openModal: (type: UIState["activeModal"], data?: unknown) =>
        set((state) => ({
          ...state,
          activeModal: type,
          modalData: data || null,
        })),

      closeModal: () =>
        set((state) => ({
          ...state,
          activeModal: null,
          modalData: null,
        })),

      setModalData: (data: unknown) =>
        set((state) => ({
          ...state,
          modalData: data,
        })),

      // === 主题管理 ===
      setTheme: (theme: "light" | "dark" | "system") =>
        set((state) => ({
          ...state,
          theme,
        })),

      setColorScheme: (scheme: "light" | "dark") =>
        set((state) => ({
          ...state,
          colorScheme: scheme,
        })),

      // === 屏幕方向管理 ===
      setScreenOrientation: async (orientation: "portrait" | "landscape") => {
        try {
          const currentState = get();

          // 如果方向被锁定，先解锁
          if (currentState.isOrientationLocked) {
            await ScreenOrientation.unlockAsync();
          }

          // 设置新的方向
          if (orientation === "portrait") {
            await ScreenOrientation.lockAsync(
              ScreenOrientation.OrientationLock.PORTRAIT_UP,
            );
          } else {
            await ScreenOrientation.lockAsync(
              ScreenOrientation.OrientationLock.LANDSCAPE,
            );
          }

          // 更新状态
          set((state) => ({
            ...state,
            screenOrientation: orientation,
          }));
        } catch (error) {
          console.error("Failed to set screen orientation:", error);
        }
      },

      toggleScreenOrientation: async () => {
        const currentState = get();
        const newOrientation =
          currentState.screenOrientation === "portrait"
            ? "landscape"
            : "portrait";
        await get().setScreenOrientation(newOrientation);
      },

      setOrientationLocked: async (locked: boolean) => {
        try {
          if (locked) {
            // 锁定当前方向
            const currentState = get();
            if (currentState.screenOrientation === "portrait") {
              await ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT_UP,
              );
            } else {
              await ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.LANDSCAPE,
              );
            }
          } else {
            // 解锁方向
            await ScreenOrientation.unlockAsync();
          }

          set((state) => ({
            ...state,
            isOrientationLocked: locked,
          }));
        } catch (error) {
          console.error("Failed to set orientation lock:", error);
        }
      },

      toggleOrientationLock: async () => {
        const currentState = get();
        await get().setOrientationLocked(!currentState.isOrientationLocked);
      },

      // === 加载状态管理 ===
      setLoading: (key: string, loading: boolean) =>
        set((state) => ({
          ...state,
          loadingStates: {
            ...state.loadingStates,
            [key]: loading,
          },
        })),

      setMultipleLoading: (states: Record<string, boolean>) =>
        set((state) => ({
          ...state,
          loadingStates: {
            ...state.loadingStates,
            ...states,
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

      // === 错误状态管理 ===
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

      // === 通知管理 ===
      addNotification: (
        notification: Omit<UIState["notifications"][0], "id" | "timestamp">,
      ) =>
        set((state) => {
          const newNotification: UIState["notifications"][0] = {
            ...notification,
            id: `notification_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
          };

          return {
            ...state,
            notifications: [newNotification, ...state.notifications].slice(
              0,
              10,
            ), // 保留最近10条
          };
        }),

      removeNotification: (id: string) =>
        set((state) => ({
          ...state,
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () =>
        set((state) => ({
          ...state,
          notifications: [],
        })),

      showNotification: (
        type: UIState["notifications"][0]["type"],
        title: string,
        message: string,
        options?: {
          duration?: number;
          action?: {
            label: string;
            onPress: () => void;
          };
        },
      ) => {
        const { duration = 3000, action } = options || {};

        get().addNotification({
          type,
          title,
          message,
          duration,
          action,
        });

        // 自动移除通知
        if (duration > 0) {
          setTimeout(() => {
            get().clearNotifications();
          }, duration);
        }
      },

      // === 状态重置 ===
      resetUIState: () => set(initialState),

      // === 选择器 ===
      select: (selector) => selector(get()),
    })),
  ),
);

// 导出预定义的选择器
export const uiSelectors = {
  // 基础状态
  getTheme: (state: UIState) => state.theme,
  getColorScheme: (state: UIState) => state.colorScheme,
  getScreenOrientation: (state: UIState) => state.screenOrientation,
  getIsOrientationLocked: (state: UIState) => state.isOrientationLocked,

  // 界面状态
  getIsSidebarOpen: (state: UIState) => state.isSidebarOpen,
  getIsSearchOpen: (state: UIState) => state.isSearchOpen,
  getIsSettingsOpen: (state: UIState) => state.isSettingsOpen,

  // 模态框状态
  getActiveModal: (state: UIState) => state.activeModal,
  getModalData: (state: UIState) => state.modalData,

  // 加载状态
  getLoadingState: (key: string) => (state: UIState) =>
    state.loadingStates[key] || false,
  getIsLoading: (state: UIState) =>
    Object.values(state.loadingStates).some(Boolean),

  // 错误状态
  getError: (key: string) => (state: UIState) => state.errors[key],
  getHasErrors: (state: UIState) => Object.values(state.errors).some(Boolean),

  // 通知状态
  getNotifications: (state: UIState) => state.notifications,
  getHasNotifications: (state: UIState) => state.notifications.length > 0,
};

// 创建记忆化 Hook - 使用 Zustand 内置的记忆化
export const useUISelector = <T>(selector: (state: UIState) => T): T => {
  return useUIStore(selector);
};

// 预定义的 Hook
export const useTheme = () => useUISelector(uiSelectors.getTheme);
export const useColorScheme = () => useUISelector(uiSelectors.getColorScheme);
export const useScreenOrientation = () =>
  useUISelector(uiSelectors.getScreenOrientation);
export const useIsOrientationLocked = () =>
  useUISelector(uiSelectors.getIsOrientationLocked);
export const useIsSidebarOpen = () =>
  useUISelector(uiSelectors.getIsSidebarOpen);
export const useIsSearchOpen = () => useUISelector(uiSelectors.getIsSearchOpen);
export const useIsSettingsOpen = () =>
  useUISelector(uiSelectors.getIsSettingsOpen);
export const useActiveModal = () => useUISelector(uiSelectors.getActiveModal);
export const useModalData = () => useUISelector(uiSelectors.getModalData);
export const useNotifications = () =>
  useUISelector(uiSelectors.getNotifications);
export const useHasNotifications = () =>
  useUISelector(uiSelectors.getHasNotifications);
