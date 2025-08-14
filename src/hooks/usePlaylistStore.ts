/**
 * 播放列表 Store Hook - 提供播放列表状态管理的便捷接口
 */

import {
  usePlaylistStore as baseUsePlaylistStore,
  playlistSelectors,
} from "@/stores/playlistStore";
import { usePlaylistSelector } from "@/stores/playlistStore";
import { useMemo } from "react";

// 基础 Hook
export const usePlaylistStore = baseUsePlaylistStore;

// 选择器 Hooks
export const useAllPlaylists = () =>
  usePlaylistSelector(playlistSelectors.getAllPlaylists);
export const useCurrentPlaylist = () =>
  usePlaylistSelector(playlistSelectors.getCurrentPlaylist);
export const useIsLoading = () =>
  usePlaylistSelector(playlistSelectors.getIsLoading);
export const useFilteredPlaylists = () =>
  usePlaylistSelector(playlistSelectors.getFilteredPlaylists);
export const useSortedPlaylists = () =>
  usePlaylistSelector(playlistSelectors.getSortedPlaylists);
export const usePlaylistStats = () =>
  usePlaylistSelector(playlistSelectors.getPlaylistStats);

// 操作 Hooks
export const usePlaylistActions = () => {
  const addPlaylist = usePlaylistStore((state) => state.addPlaylist);
  const removePlaylist = usePlaylistStore((state) => state.removePlaylist);
  const updatePlaylist = usePlaylistStore((state) => state.updatePlaylist);
  const setPlaylists = usePlaylistStore((state) => state.setPlaylists);
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist,
  );
  const setSearchQuery = usePlaylistStore((state) => state.setSearchQuery);
  const setFilter = usePlaylistStore((state) => state.setFilter);
  const clearFilters = usePlaylistStore((state) => state.clearFilters);
  const setPagination = usePlaylistStore((state) => state.setPagination);
  const loadMorePlaylists = usePlaylistStore(
    (state) => state.loadMorePlaylists,
  );
  const setLoading = usePlaylistStore((state) => state.setLoading);
  const setError = usePlaylistStore((state) => state.setError);
  const clearError = usePlaylistStore((state) => state.clearError);
  const reset = usePlaylistStore((state) => state.reset);

  return {
    addPlaylist,
    removePlaylist,
    updatePlaylist,
    setPlaylists,
    setCurrentPlaylist,
    setSearchQuery,
    setFilter,
    clearFilters,
    setPagination,
    loadMorePlaylists,
    setLoading,
    setError,
    clearError,
    reset,
  };
};

// 搜索相关 Hooks
export const usePlaylistSearch = () => {
  const searchQuery = usePlaylistStore((state) => state.searchQuery);
  const setSearchQuery = usePlaylistStore((state) => state.setSearchQuery);
  const clearFilters = usePlaylistStore((state) => state.clearFilters);
  const searchSuggestions = usePlaylistSelector(
    playlistSelectors.getSearchSuggestions,
  );

  return {
    searchQuery,
    setSearchQuery,
    clearFilters,
    searchSuggestions,
    hasSearchQuery: searchQuery.length > 0,
  };
};

// 分页相关 Hooks
export const usePlaylistPagination = () => {
  const pagination = usePlaylistStore((state) => state.pagination);
  const setPagination = usePlaylistStore((state) => state.setPagination);
  const loadMorePlaylists = usePlaylistStore(
    (state) => state.loadMorePlaylists,
  );
  const filteredPlaylists = usePlaylistSelector(
    playlistSelectors.getFilteredPlaylists,
  );
  const paginatedPlaylists = usePlaylistSelector(
    playlistSelectors.getPaginatedPlaylists,
  );

  return {
    pagination,
    setPagination,
    loadMorePlaylists,
    filteredPlaylists,
    paginatedPlaylists,
    hasMore: pagination.hasMore,
    isLoading: usePlaylistSelector((state) => state.isLoading),
  };
};

// 状态监控 Hooks
export const usePlaylistStateMonitor = () => {
  const isLoading = usePlaylistSelector(playlistSelectors.getIsLoading);
  const error = usePlaylistStore((state) => state.error);
  const playlists = usePlaylistSelector(playlistSelectors.getAllPlaylists);
  const currentPlaylist = usePlaylistSelector(
    playlistSelectors.getCurrentPlaylist,
  );

  return {
    isLoading,
    error,
    hasError: error !== null,
    playlistsCount: playlists.length,
    hasCurrentPlaylist: currentPlaylist !== null,
    hasPlaylists: playlists.length > 0,
  };
};

// 复合 Hook - 提供完整的播放列表管理功能
export const usePlaylistManager = () => {
  const playlists = useAllPlaylists();
  const currentPlaylist = useCurrentPlaylist();
  const stats = usePlaylistStats();
  const actions = usePlaylistActions();
  const search = usePlaylistSearch();
  const pagination = usePlaylistPagination();
  const monitor = usePlaylistStateMonitor();

  return {
    // 数据
    playlists,
    currentPlaylist,
    stats,

    // 操作
    ...actions,

    // 功能模块
    search,
    pagination,
    monitor,

    // 便捷属性
    hasPlaylists: playlists.length > 0,
    hasCurrentPlaylist: currentPlaylist !== null,
    isLoading: monitor.isLoading,
    hasError: monitor.hasError,
    playlistsCount: playlists.length,
  };
};
