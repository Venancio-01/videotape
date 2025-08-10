/**
 * 队列 Store Hook - 提供队列状态管理的便捷接口
 */

import { useQueueStore as baseUseQueueStore, queueSelectors } from '@/stores/queueStore';
import { useQueueSelector } from '@/stores/queueStore';
import { useMemo } from 'react';

// 基础 Hook
export const useQueueStore = baseUseQueueStore;

// 选择器 Hooks
export const useQueue = () => useQueueSelector(queueSelectors.getQueue);
export const useCurrentQueueIndex = () => useQueueSelector(queueSelectors.getCurrentQueueIndex);
export const useCurrentQueueItem = () => useQueueSelector(queueSelectors.getCurrentQueueItem);
export const useQueueLength = () => useQueueSelector(queueSelectors.getQueueLength);
export const useIsQueueEmpty = () => useQueueSelector(queueSelectors.getIsQueueEmpty);
export const useHistory = () => useQueueSelector(queueSelectors.getHistory);
export const usePlaylists = () => useQueueSelector(queueSelectors.getPlaylists);
export const useCurrentPlaylist = () => useQueueSelector(queueSelectors.getCurrentPlaylist);
export const usePlaylistCount = () => useQueueSelector(queueSelectors.getPlaylistCount);
export const useRepeatMode = () => useQueueSelector(queueSelectors.getRepeatMode);
export const useShuffleMode = () => useQueueSelector(queueSelectors.getShuffleMode);
export const useQueueStats = () => useQueueSelector(queueSelectors.getQueueStats);

// 导航 Hooks
export const usePlaybackNavigation = () => useQueueSelector(queueSelectors.getPlaybackNavigation);

// 操作 Hooks
export const useQueueActions = () => {
  const setQueue = useQueueStore((state) => state.setQueue);
  const addToQueue = useQueueStore((state) => state.addToQueue);
  const addToQueueNext = useQueueStore((state) => state.addToQueueNext);
  const removeFromQueue = useQueueStore((state) => state.removeFromQueue);
  const moveInQueue = useQueueStore((state) => state.moveInQueue);
  const clearQueue = useQueueStore((state) => state.clearQueue);
  const setCurrentQueueIndex = useQueueStore((state) => state.setCurrentQueueIndex);
  const addToHistory = useQueueStore((state) => state.addToHistory);
  const removeFromHistory = useQueueStore((state) => state.removeFromHistory);
  const clearHistory = useQueueStore((state) => state.clearHistory);
  const setPlaylists = useQueueStore((state) => state.setPlaylists);
  const addPlaylist = useQueueStore((state) => state.addPlaylist);
  const updatePlaylist = useQueueStore((state) => state.updatePlaylist);
  const removePlaylist = useQueueStore((state) => state.removePlaylist);
  const setCurrentPlaylist = useQueueStore((state) => state.setCurrentPlaylist);
  const playPlaylist = useQueueStore((state) => state.playPlaylist);
  const setRepeatMode = useQueueStore((state) => state.setRepeatMode);
  const toggleShuffle = useQueueStore((state) => state.toggleShuffle);
  const setShuffle = useQueueStore((state) => state.setShuffle);
  const playNext = useQueueStore((state) => state.playNext);
  const playPrevious = useQueueStore((state) => state.playPrevious);
  const playAtIndex = useQueueStore((state) => state.playAtIndex);
  const addMultipleToQueue = useQueueStore((state) => state.addMultipleToQueue);
  const removeMultipleFromQueue = useQueueStore((state) => state.removeMultipleFromQueue);
  const shuffleQueue = useQueueStore((state) => state.shuffleQueue);
  const loadPlaylistToQueue = useQueueStore((state) => state.loadPlaylistToQueue);
  const setLoading = useQueueStore((state) => state.setLoading);
  const setError = useQueueStore((state) => state.setError);
  const clearError = useQueueStore((state) => state.clearError);
  const resetQueue = useQueueStore((state) => state.resetQueue);
  const resetCurrentQueue = useQueueStore((state) => state.resetCurrentQueue);
  const resetPlaylists = useQueueStore((state) => state.resetPlaylists);

  return {
    setQueue,
    addToQueue,
    addToQueueNext,
    removeFromQueue,
    moveInQueue,
    clearQueue,
    setCurrentQueueIndex,
    addToHistory,
    removeFromHistory,
    clearHistory,
    setPlaylists,
    addPlaylist,
    updatePlaylist,
    removePlaylist,
    setCurrentPlaylist,
    playPlaylist,
    setRepeatMode,
    toggleShuffle,
    setShuffle,
    playNext,
    playPrevious,
    playAtIndex,
    addMultipleToQueue,
    removeMultipleFromQueue,
    shuffleQueue,
    loadPlaylistToQueue,
    setLoading,
    setError,
    clearError,
    resetQueue,
    resetCurrentQueue,
    resetPlaylists,
  };
};

// 队列管理 Hook
export const useQueueManager = () => {
  const queue = useQueue();
  const currentQueueIndex = useCurrentQueueIndex();
  const currentQueueItem = useCurrentQueueItem();
  const queueLength = useQueueLength();
  const isQueueEmpty = useIsQueueEmpty();
  const actions = useQueueActions();

  const addToQueue = (video: any) => actions.addToQueue(video);
  const addToQueueNext = (video: any) => actions.addToQueueNext(video);
  const removeFromQueue = (index: number) => actions.removeFromQueue(index);
  const moveItem = (fromIndex: number, toIndex: number) => actions.moveInQueue(fromIndex, toIndex);
  const clearQueue = () => actions.clearQueue();
  const shuffleQueue = () => actions.shuffleQueue();

  const playAtIndex = (index: number) => actions.playAtIndex(index);
  const playNext = () => actions.playNext();
  const playPrevious = () => actions.playPrevious();

  return {
    queue,
    currentQueueIndex,
    currentQueueItem,
    queueLength,
    isQueueEmpty,
    addToQueue,
    addToQueueNext,
    removeFromQueue,
    moveItem,
    clearQueue,
    shuffleQueue,
    playAtIndex,
    playNext,
    playPrevious,
    hasCurrentItem: currentQueueItem !== null,
    canPlayNext: useQueueSelector(queueSelectors.getHasNext),
    canPlayPrevious: useQueueSelector(queueSelectors.getHasPrevious),
  };
};

// 播放历史 Hook
export const useQueueHistory = () => {
  const history = useHistory();
  const historyLength = useQueueSelector(queueSelectors.getHistoryLength);
  const actions = useQueueActions();

  const addToHistory = (video: any) => actions.addToHistory(video);
  const removeFromHistory = (videoId: string) => actions.removeFromHistory(videoId);
  const clearHistory = () => actions.clearHistory();

  const getRecentHistory = (limit: number = 10) => {
    return history.slice(0, limit);
  };

  return {
    history,
    historyLength,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentHistory,
    hasHistory: history.length > 0,
  };
};

// 播放列表管理 Hook
export const usePlaylistManager = () => {
  const playlists = usePlaylists();
  const currentPlaylist = useCurrentPlaylist();
  const playlistCount = usePlaylistCount();
  const actions = useQueueActions();

  const addPlaylist = (playlist: any) => actions.addPlaylist(playlist);
  const updatePlaylist = (playlistId: string, updates: any) => actions.updatePlaylist(playlistId, updates);
  const removePlaylist = (playlistId: string) => actions.removePlaylist(playlistId);
  const setCurrentPlaylist = (playlist: any) => actions.setCurrentPlaylist(playlist);
  const playPlaylist = (playlist: any, startIndex?: number) => actions.playPlaylist(playlist, startIndex);
  const loadPlaylistToQueue = (playlist: any) => actions.loadPlaylistToQueue(playlist);

  const getPlaylistById = (playlistId: string) => {
    return useQueueSelector(queueSelectors.getPlaylistById(playlistId));
  };

  const getVideosInPlaylist = (playlistId: string) => {
    return useQueueSelector(queueSelectors.getVideosInPlaylist(playlistId));
  };

  return {
    playlists,
    currentPlaylist,
    playlistCount,
    addPlaylist,
    updatePlaylist,
    removePlaylist,
    setCurrentPlaylist,
    playPlaylist,
    loadPlaylistToQueue,
    getPlaylistById,
    getVideosInPlaylist,
    hasCurrentPlaylist: currentPlaylist !== null,
    hasPlaylists: playlists.length > 0,
  };
};

// 播放模式 Hook
export const useQueueModes = () => {
  const repeatMode = useRepeatMode();
  const shuffleMode = useShuffleMode();
  const actions = useQueueActions();

  const setRepeatMode = (mode: 'none' | 'single' | 'all') => actions.setRepeatMode(mode);
  const toggleShuffle = () => actions.toggleShuffle();
  const setShuffle = (shuffle: boolean) => actions.setShuffle(shuffle);

  const cycleRepeatMode = () => {
    const modes: ('none' | 'single' | 'all')[] = ['none', 'single', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  return {
    repeatMode,
    shuffleMode,
    setRepeatMode,
    toggleShuffle,
    setShuffle,
    cycleRepeatMode,
    isRepeatNone: repeatMode === 'none',
    isRepeatSingle: repeatMode === 'single',
    isRepeatAll: repeatMode === 'all',
  };
};

// 批量操作 Hook
export const useQueueBatchOperations = () => {
  const queue = useQueue();
  const actions = useQueueActions();

  const addMultipleToQueue = (videos: any[]) => actions.addMultipleToQueue(videos);
  const removeMultipleFromQueue = (indices: number[]) => actions.removeMultipleFromQueue(indices);

  const selectAll = () => queue.map((_, index) => index);
  const selectRange = (startIndex: number, endIndex: number) => {
    const indices = [];
    for (let i = startIndex; i <= endIndex; i++) {
      indices.push(i);
    }
    return indices;
  };

  const moveToTop = (indices: number[]) => {
    indices.sort((a, b) => a - b);
    const items = indices.map(i => queue[i]);
    const newQueue = queue.filter((_, i) => !indices.includes(i));
    return [...items, ...newQueue];
  };

  const moveToBottom = (indices: number[]) => {
    indices.sort((a, b) => a - b);
    const items = indices.map(i => queue[i]);
    const newQueue = queue.filter((_, i) => !indices.includes(i));
    return [...newQueue, ...items];
  };

  return {
    addMultipleToQueue,
    removeMultipleFromQueue,
    selectAll,
    selectRange,
    moveToTop,
    moveToBottom,
  };
};

// 队列统计 Hook
export const useQueueStatistics = () => {
  const stats = useQueueStats();
  const queue = useQueue();
  const history = useHistory();
  const playlists = usePlaylists();

  return {
    ...stats,
    queueItems: queue.length,
    historyItems: history.length,
    playlistItems: playlists.reduce((total, playlist) => total + playlist.videos.length, 0),
  };
};

// 复合 Hook - 提供完整的队列管理功能
export const useQueueManager = () => {
  const queue = useQueue();
  const currentQueueItem = useCurrentQueueItem();
  const navigation = usePlaybackNavigation();
  const modes = useQueueModes();
  const history = useQueueHistory();
  const playlists = usePlaylistManager();
  const stats = useQueueStatistics();
  const actions = useQueueActions();

  return {
    // 数据
    queue,
    currentQueueItem,
    
    // 导航
    ...navigation,
    
    // 模式
    ...modes,
    
    // 功能模块
    history,
    playlists,
    stats,
    
    // 操作
    ...actions,
    
    // 便捷属性
    isQueueEmpty: queue.length === 0,
    hasCurrentItem: currentQueueItem !== null,
    totalDuration: stats.totalDuration,
    totalVideos: stats.totalVideos,
  };
};