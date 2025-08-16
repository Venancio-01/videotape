/**
 * 视频状态管理 Store
 */

import type { Video } from "@/db/schema";
import { MiddlewareCombinations } from "@/middleware";
import type { VideoFilter, VideoState } from "@/types/stateTypes";
import type { VideoStore } from "@/types/storeTypes";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// 初始状态
const initialState: VideoState = {
  // 视频数据
  videos: [],
  currentVideo: null,


  // 搜索和过滤
  searchQuery: "",
  currentFilter: {},

  // 观看历史
  watchHistory: [],

  // 加载状态
  isLoading: false,
  error: null,

  // 分页
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
  },
};

// 创建视频 Store
export const useVideoStore = create<VideoStore>()(
  MiddlewareCombinations.videoStore(
    subscribeWithSelector((set, get) => ({
      // 基础状态
      ...initialState,

      // 视频管理
      addVideo: (video: Video) =>
        set((state) => {
          const existingIndex = state.videos.findIndex(
            (v) => v.id === video.id,
          );
          let newVideos;

          if (existingIndex >= 0) {
            // 更新现有视频
            newVideos = [...state.videos];
            newVideos[existingIndex] = {
              ...newVideos[existingIndex],
              ...video,
            };
          } else {
            // 添加新视频
            newVideos = [...state.videos, video];
          }

          return {
            ...state,
            videos: newVideos,
            pagination: {
              ...state.pagination,
              total: newVideos.length,
            },
          };
        }),

      removeVideo: (videoId: string) =>
        set((state) => {
          const newVideos = state.videos.filter((v) => v.id !== videoId);

          return {
            ...state,
            videos: newVideos,
            currentVideo:
              state.currentVideo?.id === videoId ? null : state.currentVideo,
            pagination: {
              ...state.pagination,
              total: newVideos.length,
            },
          };
        }),

      updateVideo: (videoId: string, updates: Partial<Video>) =>
        set((state) => {
          const newVideos = state.videos.map((v) =>
            v.id === videoId ? { ...v, ...updates } : v,
          );

          return {
            ...state,
            videos: newVideos,
            currentVideo:
              state.currentVideo?.id === videoId
                ? { ...state.currentVideo, ...updates }
                : state.currentVideo,
          };
        }),

      setVideos: (videos: Video[]) =>
        set((state) => ({
          ...state,
          videos,
          pagination: {
            ...state.pagination,
            total: videos.length,
          },
        })),

      // 当前视频设置
      setCurrentVideo: (video: Video | null) =>
        set((state) => ({
          ...state,
          currentVideo: video,
        })),


      // 观看历史
      addToWatchHistory: (history) =>
        set((state) => ({
          ...state,
          watchHistory: [history, ...state.watchHistory].slice(0, 100), // 保留最近100条
        })),

      updateWatchProgress: (
        videoId: string,
        position: number,
        duration: number,
      ) =>
        set((state) => {
          const historyEntry = {
            id: `history_${videoId}_${Date.now()}`,
            videoId,
            position,
            duration,
            watchedAt: new Date().toISOString(),
            completed: position >= duration * 0.9, // 90% 完成
            watchTime: Math.abs(
              position -
                (state.watchHistory.find((h) => h.videoId === videoId)
                  ?.position || 0),
            ),
          };

          const existingIndex = state.watchHistory.findIndex(
            (h) => h.videoId === videoId,
          );
          let newHistory;

          if (existingIndex >= 0) {
            newHistory = [...state.watchHistory];
            newHistory[existingIndex] = historyEntry;
          } else {
            newHistory = [historyEntry, ...state.watchHistory];
          }

          return {
            ...state,
            watchHistory: newHistory.slice(0, 100),
          };
        }),

      clearWatchHistory: () =>
        set((state) => ({
          ...state,
          watchHistory: [],
        })),

      // 搜索和过滤
      setSearchQuery: (query: string) =>
        set((state) => ({
          ...state,
          searchQuery: query,
        })),

      setFilter: (filter: Partial<VideoFilter>) =>
        set((state) => ({
          ...state,
          currentFilter: { ...state.currentFilter, ...filter },
        })),

      clearFilters: () =>
        set((state) => ({
          ...state,
          searchQuery: "",
          currentFilter: {},
        })),

      // 分页
      setPagination: (pagination) =>
        set((state) => ({
          ...state,
          pagination: { ...state.pagination, ...pagination },
        })),

      loadMoreVideos: () =>
        set((state) => {
          if (!state.pagination.hasMore) return state;

          const newPage = state.pagination.page + 1;
          return {
            ...state,
            pagination: {
              ...state.pagination,
              page: newPage,
              hasMore:
                newPage * state.pagination.pageSize < state.pagination.total,
            },
          };
        }),

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

      // 状态重置
      reset: () => set(initialState),

      // 选择器
      select: (selector) => selector(get()),
    })),
  ),
);

// 导出预定义的选择器
export const videoSelectors = {
  // 基础选择器
  getAllVideos: (state: VideoState) => state.videos,
  getCurrentVideo: (state: VideoState) => state.currentVideo,
  getIsLoading: (state: VideoState) => state.isLoading,


  // 搜索和过滤
  getFilteredVideos: (state: VideoState) => {
    const { videos, searchQuery, currentFilter } = state;

    return videos.filter((video) => {
      // 搜索过滤
      const matchesSearch =
        !searchQuery ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase());

      // 条件过滤
      const matchesFilter = Object.entries(currentFilter).every(
        ([key, value]) => {
          if (value === undefined || value === null) return true;

          switch (key) {
            // 移除了category和tags过滤功能
            case "duration": {
              const { min, max } = value as { min: number; max: number };
              return (
                typeof video.duration === "number" &&
                video.duration >= min &&
                video.duration <= max
              );
            }
            case "size": {
              const { min: minSize, max: maxSize } = value as {
                min: number;
                max: number;
              };
              return (
                typeof video.fileSize === "number" &&
                video.fileSize >= minSize &&
                video.fileSize <= maxSize
              );
            }
            case "isWatched":
              return (
                state.watchHistory.some((h) => h.videoId === video.id) === value
              );
            default:
              return true;
          }
        },
      );

      return matchesSearch && matchesFilter;
    });
  },

  // 分页相关
  getPaginatedVideos: (state: VideoState) => {
    const filteredVideos = videoSelectors.getFilteredVideos(state);
    const { page, pageSize } = state.pagination;

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredVideos.slice(startIndex, endIndex);
  },

  // 统计信息
  getVideoStats: (state: VideoState) => {
    const videos = state.videos;
    const totalDuration = videos.reduce(
      (sum, video) =>
        sum + (typeof video.duration === "number" ? video.duration : 0),
      0,
    );
    const totalSize = videos.reduce(
      (sum, video) =>
        sum + (typeof video.fileSize === "number" ? video.fileSize : 0),
      0,
    );
    const totalPlayCount = videos.reduce(
      (sum, video) =>
        sum + (typeof video.playCount === "number" ? video.playCount : 0),
      0,
    );

    return {
      totalVideos: videos.length,
      totalDuration,
      totalSize,
      totalPlayCount,
    };
  },

  // 观看历史
  getRecentHistory: (state: VideoStore, limit = 10) =>
    state.watchHistory.slice(0, limit),

  // 搜索建议
  getSearchSuggestions: (state: VideoState) => {
    const { searchQuery, videos } = state;
    if (!searchQuery || searchQuery.length < 2) return [];

    const suggestions = new Set<string>();

    for (const video of videos) {
      // 从标题中提取建议
      if (video.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.add(video.title);
      }
    }

    return Array.from(suggestions).slice(0, 5);
  },
};

// 创建记忆化 Hook - 使用 Zustand 内置的记忆化
export const useVideoSelector = <T>(selector: (state: VideoState) => T): T => {
  return useVideoStore(selector);
};

// 预定义的 Hook
export const useAllVideos = () => useVideoSelector(videoSelectors.getAllVideos);
export const useCurrentVideo = () =>
  useVideoSelector(videoSelectors.getCurrentVideo);
export const useFilteredVideos = () =>
  useVideoSelector(videoSelectors.getFilteredVideos);
export const useVideoStats = () =>
  useVideoSelector(videoSelectors.getVideoStats);
