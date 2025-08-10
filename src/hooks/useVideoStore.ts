/**
 * 视频 Store Hook - 提供视频状态管理的便捷接口
 */

import {
  useVideoStore as baseUseVideoStore,
  videoSelectors,
} from "@/stores/videoStore";
import { useVideoSelector } from "@/stores/videoStore";
import { useMemo } from "react";

// 基础 Hook
export const useVideoStore = baseUseVideoStore;

// 选择器 Hooks
export const useAllVideos = () => useVideoSelector(videoSelectors.getAllVideos);
export const useCurrentVideo = () =>
  useVideoSelector(videoSelectors.getCurrentVideo);
export const useIsPlaying = () => useVideoSelector(videoSelectors.getIsPlaying);
export const useIsLoading = () => useVideoSelector(videoSelectors.getIsLoading);
export const useFavoriteVideos = () =>
  useVideoSelector(videoSelectors.getFavoriteVideos);
export const useFilteredVideos = () =>
  useVideoSelector(videoSelectors.getFilteredVideos);
export const useVideoStats = () =>
  useVideoSelector(videoSelectors.getVideoStats);

// 操作 Hooks
export const useVideoActions = () => {
  const addVideo = useVideoStore((state) => state.addVideo);
  const removeVideo = useVideoStore((state) => state.removeVideo);
  const updateVideo = useVideoStore((state) => state.updateVideo);
  const setVideos = useVideoStore((state) => state.setVideos);
  const setCurrentVideo = useVideoStore((state) => state.setCurrentVideo);
  const playVideo = useVideoStore((state) => state.playVideo);
  const pauseVideo = useVideoStore((state) => state.pauseVideo);
  const resumeVideo = useVideoStore((state) => state.resumeVideo);
  const stopVideo = useVideoStore((state) => state.stopVideo);
  const toggleFavorite = useVideoStore((state) => state.toggleFavorite);
  const addToFavorites = useVideoStore((state) => state.addToFavorites);
  const removeFromFavorites = useVideoStore(
    (state) => state.removeFromFavorites,
  );
  const setFavorites = useVideoStore((state) => state.setFavorites);
  const addToWatchHistory = useVideoStore((state) => state.addToWatchHistory);
  const updateWatchProgress = useVideoStore(
    (state) => state.updateWatchProgress,
  );
  const clearWatchHistory = useVideoStore((state) => state.clearWatchHistory);
  const setSearchQuery = useVideoStore((state) => state.setSearchQuery);
  const setFilter = useVideoStore((state) => state.setFilter);
  const clearFilters = useVideoStore((state) => state.clearFilters);
  const setPagination = useVideoStore((state) => state.setPagination);
  const loadMoreVideos = useVideoStore((state) => state.loadMoreVideos);
  const setLoading = useVideoStore((state) => state.setLoading);
  const setError = useVideoStore((state) => state.setError);
  const clearError = useVideoStore((state) => state.clearError);
  const reset = useVideoStore((state) => state.reset);

  return {
    addVideo,
    removeVideo,
    updateVideo,
    setVideos,
    setCurrentVideo,
    playVideo,
    pauseVideo,
    resumeVideo,
    stopVideo,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    setFavorites,
    addToWatchHistory,
    updateWatchProgress,
    clearWatchHistory,
    setSearchQuery,
    setFilter,
    clearFilters,
    setPagination,
    loadMoreVideos,
    setLoading,
    setError,
    clearError,
    reset,
  };
};

// 搜索相关 Hooks
export const useVideoSearch = () => {
  const searchQuery = useVideoStore((state) => state.searchQuery);
  const setSearchQuery = useVideoStore((state) => state.setSearchQuery);
  const clearFilters = useVideoStore((state) => state.clearFilters);
  const searchSuggestions = useVideoSelector(
    videoSelectors.getSearchSuggestions,
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
export const useVideoPagination = () => {
  const pagination = useVideoStore((state) => state.pagination);
  const setPagination = useVideoStore((state) => state.setPagination);
  const loadMoreVideos = useVideoStore((state) => state.loadMoreVideos);
  const filteredVideos = useVideoSelector(videoSelectors.getFilteredVideos);
  const paginatedVideos = useVideoSelector(videoSelectors.getPaginatedVideos);

  return {
    pagination,
    setPagination,
    loadMoreVideos,
    filteredVideos,
    paginatedVideos,
    hasMore: pagination.hasMore,
    isLoading: useVideoSelector((state) => state.isLoading),
  };
};

// 收藏相关 Hooks
export const useVideoFavorites = () => {
  const favorites = useVideoSelector(videoSelectors.getFavorites);
  const toggleFavorite = useVideoStore((state) => state.toggleFavorite);
  const addToFavorites = useVideoStore((state) => state.addToFavorites);
  const removeFromFavorites = useVideoStore(
    (state) => state.removeFromFavorites,
  );
  const favoritesCount = useVideoSelector(videoSelectors.getFavoritesCount);

  const isFavorite = (videoId: string) => {
    return useVideoSelector(videoSelectors.getIsFavorite(videoId));
  };

  return {
    favorites,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    favoritesCount,
    isFavorite,
  };
};

// 播放相关 Hooks
export const useVideoPlayback = () => {
  const currentVideo = useVideoSelector(videoSelectors.getCurrentVideo);
  const playbackState = useVideoStore((state) => state.playbackState);
  const playVideo = useVideoStore((state) => state.playVideo);
  const pauseVideo = useVideoStore((state) => state.pauseVideo);
  const resumeVideo = useVideoStore((state) => state.resumeVideo);
  const stopVideo = useVideoStore((state) => state.stopVideo);
  const updateWatchProgress = useVideoStore(
    (state) => state.updateWatchProgress,
  );

  return {
    currentVideo,
    playbackState,
    playVideo,
    pauseVideo,
    resumeVideo,
    stopVideo,
    updateWatchProgress,
    hasCurrentVideo: currentVideo !== null,
  };
};

// 观看历史 Hooks
export const useVideoHistory = () => {
  const watchHistory = useVideoStore((state) => state.watchHistory);
  const addToWatchHistory = useVideoStore((state) => state.addToWatchHistory);
  const updateWatchProgress = useVideoStore(
    (state) => state.updateWatchProgress,
  );
  const clearWatchHistory = useVideoStore((state) => state.clearWatchHistory);
  const recentHistory = useVideoSelector((state) =>
    videoSelectors.getRecentHistory(state, 10),
  );

  return {
    watchHistory,
    addToWatchHistory,
    updateWatchProgress,
    clearWatchHistory,
    recentHistory,
    historyCount: watchHistory.length,
  };
};

// 状态监控 Hooks
export const useVideoStateMonitor = () => {
  const isLoading = useVideoSelector(videoSelectors.getIsLoading);
  const error = useVideoStore((state) => state.error);
  const videos = useVideoSelector(videoSelectors.getAllVideos);
  const currentVideo = useVideoSelector(videoSelectors.getCurrentVideo);

  return {
    isLoading,
    error,
    hasError: error !== null,
    videosCount: videos.length,
    hasCurrentVideo: currentVideo !== null,
    hasVideos: videos.length > 0,
  };
};

// 批量操作 Hooks
export const useVideoBatchOperations = () => {
  const videos = useVideoSelector(videoSelectors.getAllVideos);
  const removeVideo = useVideoStore((state) => state.removeVideo);
  const addToFavorites = useVideoStore((state) => state.addToFavorites);
  const removeFromFavorites = useVideoStore(
    (state) => state.removeFromFavorites,
  );

  const removeMultiple = (videoIds: string[]) => {
    videoIds.forEach((id) => removeVideo(id));
  };

  const addMultipleToFavorites = (videoIds: string[]) => {
    videoIds.forEach((id) => addToFavorites(id));
  };

  const removeMultipleFromFavorites = (videoIds: string[]) => {
    videoIds.forEach((id) => removeFromFavorites(id));
  };

  const selectAll = () => videos.map((v) => v.id);
  const selectByCategory = (category: string) =>
    videos.filter((v) => v.category === category).map((v) => v.id);
  const selectByTag = (tag: string) =>
    videos.filter((v) => v.tags.includes(tag)).map((v) => v.id);

  return {
    removeMultiple,
    addMultipleToFavorites,
    removeMultipleFromFavorites,
    selectAll,
    selectByCategory,
    selectByTag,
  };
};

// 复合 Hook - 提供完整的视频管理功能
export const useVideoManager = () => {
  const videos = useAllVideos();
  const currentVideo = useCurrentVideo();
  const favorites = useVideoSelector(videoSelectors.getFavorites);
  const stats = useVideoStats();
  const actions = useVideoActions();
  const search = useVideoSearch();
  const pagination = useVideoPagination();
  const favoritesManager = useVideoFavorites();
  const playback = useVideoPlayback();
  const history = useVideoHistory();
  const monitor = useVideoStateMonitor();
  const batchOps = useVideoBatchOperations();

  return {
    // 数据
    videos,
    currentVideo,
    favorites,
    stats,

    // 操作
    ...actions,

    // 功能模块
    search,
    pagination,
    favoritesManager,
    playback,
    history,
    monitor,
    batchOps,

    // 便捷属性
    hasVideos: videos.length > 0,
    hasCurrentVideo: currentVideo !== null,
    isLoading: monitor.isLoading,
    hasError: monitor.hasError,
    favoritesCount: favorites.length,
  };
};
