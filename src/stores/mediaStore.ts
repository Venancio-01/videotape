/**
 * 媒体状态管理 Store - 统一视频和播放列表管理
 */

import type { Playlist, Video, WatchHistory } from "@/db/schema";
import { MiddlewareCombinations } from "@/middleware";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// 合并后的媒体状态
interface MediaState {
  // === 视频管理 ===
  videos: Video[];
  currentVideo: Video | null;
  watchHistory: WatchHistory[];

  // === 播放列表管理 ===
  playlists: Playlist[];
  currentPlaylist: Playlist | null;

  // === 搜索和过滤 ===
  searchQuery: string;
  currentFilter: Record<string, unknown>;

  // === 分页 ===
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };

  // === 状态管理 ===
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: MediaState = {
  videos: [],
  currentVideo: null,
  watchHistory: [],
  playlists: [],
  currentPlaylist: null,
  searchQuery: "",
  currentFilter: {} as Record<string, unknown>,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
  },
  isLoading: false,
  error: null,
};

// 创建媒体 Store
export const useMediaStore = create<MediaState>()(
  MiddlewareCombinations.mediaStore(
    subscribeWithSelector((set, get) => ({
      // 基础状态
      ...initialState,

      // === 视频管理 ===
      setVideos: (videos: Video[]) =>
        set((state) => ({
          ...state,
          videos,
          pagination: { ...state.pagination, total: videos.length },
        })),

      addVideo: (video: Video) =>
        set((state) => {
          const existingIndex = state.videos.findIndex(
            (v) => v.id === video.id,
          );
          const newVideos =
            existingIndex >= 0
              ? state.videos.map((v, i) =>
                  i === existingIndex ? { ...v, ...video } : v,
                )
              : [...state.videos, video];

          return {
            ...state,
            videos: newVideos,
            pagination: { ...state.pagination, total: newVideos.length },
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
            pagination: { ...state.pagination, total: newVideos.length },
          };
        }),

      updateVideo: (videoId: string, updates: Partial<Video>) =>
        set((state) => ({
          ...state,
          videos: state.videos.map((v) =>
            v.id === videoId ? { ...v, ...updates } : v,
          ),
          currentVideo:
            state.currentVideo?.id === videoId
              ? { ...state.currentVideo, ...updates }
              : state.currentVideo,
        })),

      setCurrentVideo: (video: Video | null) =>
        set((state) => ({
          ...state,
          currentVideo: video,
        })),

      // === 观看历史 ===
      addToWatchHistory: (history: WatchHistory) =>
        set((state) => ({
          ...state,
          watchHistory: [history, ...state.watchHistory].slice(0, 100),
        })),

      updateWatchProgress: (
        videoId: string,
        position: number,
        duration: number,
      ) =>
        set((state) => {
          const existingIndex = state.watchHistory.findIndex(
            (h) => h.videoId === videoId,
          );
          const historyEntry: WatchHistory = {
            id: `history_${videoId}_${Date.now()}`,
            videoId,
            position,
            duration,
            watchedAt: new Date().toISOString(),
            completed: position >= duration * 0.9,
          };

          const newHistory =
            existingIndex >= 0
              ? state.watchHistory.map((h, i) =>
                  i === existingIndex ? historyEntry : h,
                )
              : [historyEntry, ...state.watchHistory];

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

      // === 播放列表管理 ===
      setPlaylists: (playlists: Playlist[]) =>
        set((state) => ({
          ...state,
          playlists,
          pagination: { ...state.pagination, total: playlists.length },
        })),

      addPlaylist: (playlist: Playlist) =>
        set((state) => {
          const existingIndex = state.playlists.findIndex(
            (p) => p.id === playlist.id,
          );
          const newPlaylists =
            existingIndex >= 0
              ? state.playlists.map((p, i) =>
                  i === existingIndex ? { ...p, ...playlist } : p,
                )
              : [...state.playlists, playlist];

          return {
            ...state,
            playlists: newPlaylists,
            pagination: { ...state.pagination, total: newPlaylists.length },
          };
        }),

      removePlaylist: (playlistId: string) =>
        set((state) => {
          const newPlaylists = state.playlists.filter(
            (p) => p.id !== playlistId,
          );
          return {
            ...state,
            playlists: newPlaylists,
            currentPlaylist:
              state.currentPlaylist?.id === playlistId
                ? null
                : state.currentPlaylist,
            pagination: { ...state.pagination, total: newPlaylists.length },
          };
        }),

      updatePlaylist: (playlistId: string, updates: Partial<Playlist>) =>
        set((state) => ({
          ...state,
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, ...updates } : p,
          ),
          currentPlaylist:
            state.currentPlaylist?.id === playlistId
              ? { ...state.currentPlaylist, ...updates }
              : state.currentPlaylist,
        })),

      setCurrentPlaylist: (playlist: Playlist | null) =>
        set((state) => ({
          ...state,
          currentPlaylist: playlist,
        })),

      // === 搜索和过滤 ===
      setSearchQuery: (query: string) =>
        set((state) => ({
          ...state,
          searchQuery: query,
        })),

      setFilter: (filter: Record<string, unknown>) =>
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

      // === 分页 ===
      setPagination: (pagination: Partial<MediaState["pagination"]>) =>
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

      // === 状态管理 ===
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

      // === 状态重置 ===
      reset: () => set(initialState),

      // === 选择器 ===
      select: (selector) => selector(get()),
    })),
  ),
);

// 导出预定义的选择器
export const mediaSelectors = {
  // === 基础状态 ===
  getVideos: (state: MediaState) => state.videos,
  getCurrentVideo: (state: MediaState) => state.currentVideo,
  getWatchHistory: (state: MediaState) => state.watchHistory,
  getPlaylists: (state: MediaState) => state.playlists,
  getCurrentPlaylist: (state: MediaState) => state.currentPlaylist,
  getIsLoading: (state: MediaState) => state.isLoading,
  getError: (state: MediaState) => state.error,

  // === 过滤和搜索 ===
  getFilteredVideos: (state: MediaState) => {
    const { videos, searchQuery, currentFilter } = state;
    return videos.filter((video) => {
      const matchesSearch =
        !searchQuery ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = Object.entries(currentFilter).every(
        ([key, value]) =>
          value === undefined ||
          value === null ||
          video[key as keyof Video] === value,
      );
      return matchesSearch && matchesFilter;
    });
  },

  getFilteredPlaylists: (state: MediaState) => {
    const { playlists, searchQuery } = state;
    return playlists.filter(
      (playlist) =>
        !searchQuery ||
        playlist.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  },

  // === 统计信息 ===
  getMediaStats: (state: MediaState) => ({
    totalVideos: state.videos.length,
    totalPlaylists: state.playlists.length,
    favoriteCount: state.videos.filter((v) => v.isFavorite).length,
    historyCount: state.watchHistory.length,
  }),
};

// 创建记忆化 Hook - 使用 Zustand 内置的记忆化
export const useMediaSelector = <T>(selector: (state: MediaState) => T): T => {
  return useMediaStore(selector);
};

// 预定义的 Hook
export const useVideos = () => useMediaSelector(mediaSelectors.getVideos);
export const useCurrentVideo = () =>
  useMediaSelector(mediaSelectors.getCurrentVideo);
export const usePlaylists = () => useMediaSelector(mediaSelectors.getPlaylists);
export const useCurrentPlaylist = () =>
  useMediaSelector(mediaSelectors.getCurrentPlaylist);
export const useFilteredVideos = () =>
  useMediaSelector(mediaSelectors.getFilteredVideos);
export const useFilteredPlaylists = () =>
  useMediaSelector(mediaSelectors.getFilteredPlaylists);
export const useMediaStats = () =>
  useMediaSelector(mediaSelectors.getMediaStats);
