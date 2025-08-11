/**
 * 播放列表状态管理 Store
 */

import type { Playlist } from "@/db/schema";
import type { PlaylistState, PlaylistStore } from "@/types/stateTypes";
import { StateUtils } from "@/utils/stateUtils";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { MiddlewareCombinations } from "../middleware";

// 初始状态
const initialState: PlaylistState = {
  // 播放列表数据
  playlists: [],
  currentPlaylist: null,

  // 加载状态
  isLoading: false,
  error: null,

  // 搜索和过滤
  searchQuery: "",
  currentFilter: {},

  // 分页
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
  },
};

// 创建播放列表 Store
export const usePlaylistStore = create<PlaylistStore>()(
  MiddlewareCombinations.playlistStore(
    subscribeWithSelector((set, get) => ({
      // 基础状态
      ...initialState,

      // 播放列表管理
      addPlaylist: (playlist: Playlist) =>
        set((state) => {
          const existingIndex = state.playlists.findIndex(
            (p) => p.id === playlist.id,
          );
          let newPlaylists;

          if (existingIndex >= 0) {
            // 更新现有播放列表
            newPlaylists = [...state.playlists];
            newPlaylists[existingIndex] = {
              ...newPlaylists[existingIndex],
              ...playlist,
            };
          } else {
            // 添加新播放列表
            newPlaylists = [...state.playlists, playlist];
          }

          return {
            ...state,
            playlists: newPlaylists,
            pagination: {
              ...state.pagination,
              total: newPlaylists.length,
            },
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
            pagination: {
              ...state.pagination,
              total: newPlaylists.length,
            },
          };
        }),

      updatePlaylist: (playlistId: string, updates: Partial<Playlist>) =>
        set((state) => {
          const newPlaylists = state.playlists.map((p) =>
            p.id === playlistId ? { ...p, ...updates } : p,
          );

          return {
            ...state,
            playlists: newPlaylists,
            currentPlaylist:
              state.currentPlaylist?.id === playlistId
                ? { ...state.currentPlaylist, ...updates }
                : state.currentPlaylist,
          };
        }),

      setPlaylists: (playlists: Playlist[]) =>
        set((state) => ({
          ...state,
          playlists,
          pagination: {
            ...state.pagination,
            total: playlists.length,
          },
        })),

      setCurrentPlaylist: (playlist: Playlist | null) =>
        set((state) => ({
          ...state,
          currentPlaylist: playlist,
        })),

      // 搜索和过滤
      setSearchQuery: (query: string) =>
        set((state) => ({
          ...state,
          searchQuery: query,
        })),

      setFilter: (filter: any) =>
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

      loadMorePlaylists: () =>
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
export const playlistSelectors = {
  // 基础选择器
  getAllPlaylists: (state: PlaylistState) => state.playlists,
  getCurrentPlaylist: (state: PlaylistState) => state.currentPlaylist,
  getIsLoading: (state: PlaylistState) => state.isLoading,

  // 搜索和过滤
  getFilteredPlaylists: (state: PlaylistState) => {
    const { playlists, searchQuery, currentFilter } = state;

    return playlists.filter((playlist) => {
      // 搜索过滤
      const matchesSearch =
        !searchQuery ||
        playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        playlist.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      // 条件过滤
      const matchesFilter = Object.entries(currentFilter).every(
        ([key, value]) => {
          if (value === undefined || value === null) return true;

          switch (key) {
            case "isPublic":
              return playlist.isPublic === value;
            case "isDefault":
              return playlist.isDefault === value;
            case "tags":
              return value.every((tag: string) => playlist.tags.includes(tag));
            case "sortBy":
              return true; // 排序在 getSortedPlaylists 中处理
            default:
              return true;
          }
        },
      );

      return matchesSearch && matchesFilter;
    });
  },

  // 排序播放列表
  getSortedPlaylists: (state: PlaylistState) => {
    const filtered = playlistSelectors.getFilteredPlaylists(state);
    const { currentFilter } = state;

    if (!currentFilter.sortBy) {
      return filtered;
    }

    const sorted = [...filtered];
    const sortOrder = currentFilter.sortOrder || "desc";

    sorted.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (currentFilter.sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "videoCount":
          aValue = a.videoCount;
          bValue = b.videoCount;
          break;
        case "playCount":
          aValue = a.playCount;
          bValue = b.playCount;
          break;
        case "lastPlayedAt":
          aValue = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
          bValue = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  },

  // 分页相关
  getPaginatedPlaylists: (state: PlaylistState) => {
    const sorted = playlistSelectors.getSortedPlaylists(state);
    const { page, pageSize } = state.pagination;

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return sorted.slice(startIndex, endIndex);
  },

  // 统计信息
  getPlaylistStats: (state: PlaylistState) => {
    const playlists = state.playlists;
    const totalVideos = playlists.reduce((sum, p) => sum + p.videoCount, 0);
    const totalDuration = playlists.reduce(
      (sum, p) => sum + p.totalDuration,
      0,
    );
    const totalPlayCount = playlists.reduce((sum, p) => sum + p.playCount, 0);

    return {
      totalPlaylists: playlists.length,
      totalVideos,
      totalDuration,
      totalPlayCount,
      publicPlaylists: playlists.filter((p) => p.isPublic).length,
      defaultPlaylists: playlists.filter((p) => p.isDefault).length,
    };
  },

  // 搜索建议
  getSearchSuggestions: (state: PlaylistState) => {
    const { searchQuery, playlists } = state;
    if (!searchQuery || searchQuery.length < 2) return [];

    const suggestions = new Set<string>();

    playlists.forEach((playlist) => {
      // 从名称中提取建议
      if (playlist.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.add(playlist.name);
      }

      // 从标签中提取建议
      playlist.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(searchQuery.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  },
};

// 创建记忆化 Hook
export const usePlaylistSelector = <T>(
  selector: (state: PlaylistState) => T,
): T => {
  return usePlaylistStore(StateUtils.createSelector(selector));
};

// 预定义的 Hook
export const useAllPlaylists = () =>
  usePlaylistSelector(playlistSelectors.getAllPlaylists);
export const useCurrentPlaylist = () =>
  usePlaylistSelector(playlistSelectors.getCurrentPlaylist);
export const useFilteredPlaylists = () =>
  usePlaylistSelector(playlistSelectors.getFilteredPlaylists);
export const useSortedPlaylists = () =>
  usePlaylistSelector(playlistSelectors.getSortedPlaylists);
export const usePlaylistStats = () =>
  usePlaylistSelector(playlistSelectors.getPlaylistStats);
