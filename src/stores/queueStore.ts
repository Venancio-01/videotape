/**
 * 队列状态管理 Store
 */

import type { Playlist, Video } from "@/db/schema";
import type { QueueState } from "@/types/stateTypes";
import type { QueueStore } from "@/types/storeTypes";
import { StateUtils } from "@/utils/stateUtils";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { MiddlewareCombinations } from "../middleware";

// 初始状态
const initialState: QueueState = {
  // 播放队列
  queue: [],
  currentQueueIndex: -1,

  // 播放历史
  history: [],

  // 播放列表
  playlists: [],
  currentPlaylist: null,

  // 队列操作
  isShuffleOn: false,
  repeatMode: "none",

  // 队列状态
  isLoading: false,
  error: null,
};

// 创建队列 Store
export const useQueueStore = create<QueueStore>()(
  MiddlewareCombinations.queueStore(
    subscribeWithSelector((set, get) => ({
      // 基础状态
      ...initialState,

      // 队列管理
      setQueue: (queue: Video[]) =>
        set((state) => ({
          ...state,
          queue,
          currentQueueIndex: queue.length > 0 ? 0 : -1,
        })),

      addToQueue: (video: Video) =>
        set((state) => {
          const newQueue = [...state.queue, video];
          return {
            ...state,
            queue: newQueue,
            currentQueueIndex:
              state.currentQueueIndex === -1 ? 0 : state.currentQueueIndex,
          };
        }),

      addToQueueNext: (video: Video) =>
        set((state) => {
          const newQueue = [...state.queue];
          const insertIndex = state.currentQueueIndex + 1;
          newQueue.splice(insertIndex, 0, video);

          return {
            ...state,
            queue: newQueue,
          };
        }),

      removeFromQueue: (index: number) =>
        set((state) => {
          const newQueue = state.queue.filter((_, i) => i !== index);
          let newIndex = state.currentQueueIndex;

          if (index < state.currentQueueIndex) {
            newIndex = Math.max(0, newIndex - 1);
          } else if (index === state.currentQueueIndex) {
            newIndex = Math.min(newIndex, newQueue.length - 1);
          }

          return {
            ...state,
            queue: newQueue,
            currentQueueIndex: newQueue.length > 0 ? newIndex : -1,
          };
        }),

      moveInQueue: (fromIndex: number, toIndex: number) =>
        set((state) => {
          const newQueue = [...state.queue];
          const [movedItem] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, movedItem);

          let newIndex = state.currentQueueIndex;
          if (state.currentQueueIndex === fromIndex) {
            newIndex = toIndex;
          } else if (
            fromIndex < state.currentQueueIndex &&
            toIndex >= state.currentQueueIndex
          ) {
            newIndex = Math.max(0, newIndex - 1);
          } else if (
            fromIndex > state.currentQueueIndex &&
            toIndex <= state.currentQueueIndex
          ) {
            newIndex = Math.min(newQueue.length - 1, newIndex + 1);
          }

          return {
            ...state,
            queue: newQueue,
            currentQueueIndex: newIndex,
          };
        }),

      clearQueue: () =>
        set((state) => ({
          ...state,
          queue: [],
          currentQueueIndex: -1,
        })),

      setCurrentQueueIndex: (index: number) =>
        set((state) => ({
          ...state,
          currentQueueIndex: Math.max(
            -1,
            Math.min(index, state.queue.length - 1),
          ),
        })),

      // 播放历史管理
      addToHistory: (video: Video) =>
        set((state) => {
          const newHistory = [
            video,
            ...state.history.filter((v) => v.id !== video.id),
          ];
          return {
            ...state,
            history: newHistory.slice(0, 100), // 保留最近100条
          };
        }),

      removeFromHistory: (videoId: string) =>
        set((state) => ({
          ...state,
          history: state.history.filter((v) => v.id !== videoId),
        })),

      clearHistory: () =>
        set((state) => ({
          ...state,
          history: [],
        })),

      // 播放列表管理
      setPlaylists: (playlists: Playlist[]) =>
        set((state) => ({
          ...state,
          playlists,
        })),

      addPlaylist: (playlist: Playlist) =>
        set((state) => ({
          ...state,
          playlists: [...state.playlists, playlist],
        })),

      updatePlaylist: (playlistId: string, updates: Partial<Playlist>) =>
        set((state) => ({
          ...state,
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, ...updates } : p,
          ),
        })),

      removePlaylist: (playlistId: string) =>
        set((state) => ({
          ...state,
          playlists: state.playlists.filter((p) => p.id !== playlistId),
          currentPlaylist:
            state.currentPlaylist?.id === playlistId
              ? null
              : state.currentPlaylist,
        })),

      setCurrentPlaylist: (playlist: Playlist | null) =>
        set((state) => ({
          ...state,
          currentPlaylist: playlist,
        })),

      // 从播放列表播放
      playPlaylist: (playlist: Playlist, startIndex = 0) =>
        set((state) => ({
          ...state,
          currentPlaylist: playlist,
          queue: playlist.videos,
          currentQueueIndex: Math.max(
            0,
            Math.min(startIndex, playlist.videos.length - 1),
          ),
        })),

      // 播放模式
      setRepeatMode: (mode: "none" | "single" | "all") =>
        set((state) => ({
          ...state,
          repeatMode: mode,
        })),

      toggleShuffle: () =>
        set((state) => {
          const newShuffleState = !state.isShuffleOn;
          let newQueue = [...state.queue];

          if (newShuffleState) {
            // 打乱队列（保持当前播放的项目在第一位）
            const currentItem =
              state.currentQueueIndex >= 0
                ? newQueue[state.currentQueueIndex]
                : null;
            newQueue = newQueue.filter((_, i) => i !== state.currentQueueIndex);

            // Fisher-Yates 洗牌算法
            for (let i = newQueue.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
            }

            if (currentItem) {
              newQueue.unshift(currentItem);
            }
          }

          return {
            ...state,
            isShuffleOn: newShuffleState,
            queue: newQueue,
            currentQueueIndex:
              newShuffleOn && newQueue.length > 0 ? 0 : state.currentQueueIndex,
          };
        }),

      setShuffle: (shuffle: boolean) =>
        set((state) => {
          if (state.isShuffleOn === shuffle) return state;

          let newQueue = [...state.queue];
          if (shuffle) {
            // 打乱队列
            const currentItem =
              state.currentQueueIndex >= 0
                ? newQueue[state.currentQueueIndex]
                : null;
            newQueue = newQueue.filter((_, i) => i !== state.currentQueueIndex);

            for (let i = newQueue.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
            }

            if (currentItem) {
              newQueue.unshift(currentItem);
            }
          }

          return {
            ...state,
            isShuffleOn: shuffle,
            queue: newQueue,
            currentQueueIndex:
              shuffle && newQueue.length > 0 ? 0 : state.currentQueueIndex,
          };
        }),

      // 队列操作
      playNext: () =>
        set((state) => {
          const { queue, currentQueueIndex, repeatMode } = state;

          if (queue.length === 0) return state;

          let nextIndex;

          if (repeatMode === "single") {
            nextIndex = currentQueueIndex;
          } else if (repeatMode === "all") {
            nextIndex = (currentQueueIndex + 1) % queue.length;
          } else {
            nextIndex = currentQueueIndex + 1;
            if (nextIndex >= queue.length) {
              return state;
            }
          }

          return {
            ...state,
            currentQueueIndex: nextIndex,
          };
        }),

      playPrevious: () =>
        set((state) => {
          const { queue, currentQueueIndex } = state;

          if (queue.length === 0) return state;

          let prevIndex = currentQueueIndex - 1;
          if (prevIndex < 0) {
            prevIndex = queue.length - 1;
          }

          return {
            ...state,
            currentQueueIndex: prevIndex,
          };
        }),

      // 批量操作
      addMultipleToQueue: (videos: Video[]) =>
        set((state) => {
          const newQueue = [...state.queue, ...videos];
          return {
            ...state,
            queue: newQueue,
            currentQueueIndex:
              state.currentQueueIndex === -1 ? 0 : state.currentQueueIndex,
          };
        }),

      removeMultipleFromQueue: (indices: number[]) =>
        set((state) => {
          const indexSet = new Set(indices);
          const newQueue = state.queue.filter((_, i) => !indexSet.has(i));

          let newIndex = state.currentQueueIndex;
          const removedBeforeCurrent = indices.filter(
            (i) => i < state.currentQueueIndex,
          ).length;

          if (indexSet.has(state.currentQueueIndex)) {
            newIndex = Math.min(
              newIndex - removedBeforeCurrent,
              newQueue.length - 1,
            );
          } else {
            newIndex = Math.max(0, newIndex - removedBeforeCurrent);
          }

          return {
            ...state,
            queue: newQueue,
            currentQueueIndex: newQueue.length > 0 ? newIndex : -1,
          };
        }),

      // 智能队列操作
      shuffleQueue: () =>
        set((state) => {
          const newQueue = [...state.queue];
          const currentItem =
            state.currentQueueIndex >= 0
              ? newQueue[state.currentQueueIndex]
              : null;

          // 移除当前项目
          const filteredQueue = newQueue.filter(
            (_, i) => i !== state.currentQueueIndex,
          );

          // Fisher-Yates 洗牌
          for (let i = filteredQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filteredQueue[i], filteredQueue[j]] = [
              filteredQueue[j],
              filteredQueue[i],
            ];
          }

          // 重新插入当前项目
          if (currentItem) {
            filteredQueue.unshift(currentItem);
          }

          return {
            ...state,
            queue: filteredQueue,
            currentQueueIndex: currentItem ? 0 : -1,
            isShuffleOn: true,
          };
        }),

      // 播放列表到队列
      loadPlaylistToQueue: (playlist: Playlist) =>
        set((state) => ({
          ...state,
          queue: playlist.videos,
          currentQueueIndex: playlist.videos.length > 0 ? 0 : -1,
          currentPlaylist: playlist,
        })),

      // 状态管理
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

      // 状态重置
      resetQueue: () => set(initialState),

      // 部分重置
      resetCurrentQueue: () =>
        set((state) => ({
          ...state,
          currentQueueIndex: -1,
        })),

      resetPlaylists: () =>
        set((state) => ({
          ...state,
          playlists: [],
          currentPlaylist: null,
        })),

      // 选择器
      select: (selector) => selector(get()),
    })),
  ),
);

// 导出预定义的选择器
export const queueSelectors = {
  // 基础队列状态
  getQueue: (state: QueueState) => state.queue,
  getCurrentQueueIndex: (state: QueueState) => state.currentQueueIndex,
  getCurrentQueueItem: (state: QueueState) =>
    state.currentQueueIndex >= 0 && state.currentQueueIndex < state.queue.length
      ? state.queue[state.currentQueueIndex]
      : null,
  getQueueLength: (state: QueueState) => state.queue.length,
  getIsQueueEmpty: (state: QueueState) => state.queue.length === 0,

  // 播放历史
  getHistory: (state: QueueState) => state.history,
  getHistoryLength: (state: QueueState) => state.history.length,

  // 播放列表
  getPlaylists: (state: QueueState) => state.playlists,
  getCurrentPlaylist: (state: QueueState) => state.currentPlaylist,
  getPlaylistCount: (state: QueueState) => state.playlists.length,

  // 播放模式
  getRepeatMode: (state: QueueState) => state.repeatMode,
  getShuffleMode: (state: QueueState) => state.isShuffleOn,

  // 导航状态
  getHasNext: (state: QueueState) => {
    const { queue, currentQueueIndex, repeatMode } = state;
    if (queue.length === 0) return false;
    if (repeatMode === "all") return true;
    return currentQueueIndex < queue.length - 1;
  },

  getHasPrevious: (state: QueueState) => {
    const { queue, currentQueueIndex } = state;
    if (queue.length === 0) return false;
    return currentQueueIndex > 0;
  },

  getNextItem: (state: QueueState) => {
    const { queue, currentQueueIndex, repeatMode } = state;
    if (queue.length === 0) return null;

    if (repeatMode === "single") {
      return queue[currentQueueIndex];
    }

    const nextIndex =
      repeatMode === "all"
        ? (currentQueueIndex + 1) % queue.length
        : currentQueueIndex + 1;

    return nextIndex < queue.length ? queue[nextIndex] : null;
  },

  getPreviousItem: (state: QueueState) => {
    const { queue, currentQueueIndex } = state;
    if (queue.length === 0) return null;

    const prevIndex =
      currentQueueIndex > 0 ? currentQueueIndex - 1 : queue.length - 1;
    return queue[prevIndex];
  },

  // 队列统计
  getQueueStats: (state: QueueState) => {
    const { queue, history, playlists } = state;
    const totalDuration = queue.reduce((sum, video) => sum + video.duration, 0);
    const totalSize = queue.reduce((sum, video) => sum + video.fileSize, 0);

    return {
      totalVideos: queue.length,
      totalDuration,
      totalSize,
      averageRating:
        queue.length > 0
          ? queue.reduce((sum, video) => sum + video.rating, 0) / queue.length
          : 0,
      historyCount: history.length,
      playlistCount: playlists.length,
    };
  },

  // 播放列表相关
  getPlaylistById: (playlistId: string) => (state: QueueState) =>
    state.playlists.find((p) => p.id === playlistId),

  getVideosInPlaylist: (playlistId: string) => (state: QueueState) => {
    const playlist = state.playlists.find((p) => p.id === playlistId);
    return playlist ? playlist.videos : [];
  },

  // 队列操作状态
  getCanPlayNext: (state: QueueState) => queueSelectors.getHasNext(state),
  getCanPlayPrevious: (state: QueueState) =>
    queueSelectors.getHasPrevious(state),
  getCanClearQueue: (state: QueueState) => state.queue.length > 0,
  getCanShuffle: (state: QueueState) => state.queue.length > 1,

  // 加载状态
  getIsLoading: (state: QueueState) => state.isLoading,
  getError: (state: QueueState) => state.error,
  getHasError: (state: QueueState) => state.error !== null,
};

// 创建记忆化 Hook
export const useQueueSelector = <T>(selector: (state: QueueState) => T): T => {
  return useQueueStore(StateUtils.createSelector(selector));
};

// 预定义的 Hook
export const useCurrentQueueItem = () =>
  useQueueSelector(queueSelectors.getCurrentQueueItem);
export const useQueueStats = () =>
  useQueueSelector(queueSelectors.getQueueStats);
export const usePlaybackNavigation = () =>
  useQueueSelector((state) => ({
    hasNext: queueSelectors.getHasNext(state),
    hasPrevious: queueSelectors.getHasPrevious(state),
    nextItem: queueSelectors.getNextItem(state),
    previousItem: queueSelectors.getPreviousItem(state),
    canPlayNext: queueSelectors.getCanPlayNext(state),
    canPlayPrevious: queueSelectors.getCanPlayPrevious(state),
  }));
export const usePlaylistManagement = () =>
  useQueueSelector((state) => ({
    playlists: state.playlists,
    currentPlaylist: state.currentPlaylist,
    playlistCount: state.playlists.length,
  }));
