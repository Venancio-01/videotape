/**
 * 播放 Store Hook - 提供播放状态管理的便捷接口
 */

import { usePlaybackStore as baseUsePlaybackStore, playbackSelectors } from '@/stores/playbackStore';
import { usePlaybackSelector } from '@/stores/playbackStore';
import { useMemo } from 'react';

// 基础 Hook
export const usePlaybackStore = baseUsePlaybackStore;

// 选择器 Hooks
export const useIsPlaying = () => usePlaybackSelector(playbackSelectors.getIsPlaying);
export const useIsPaused = () => usePlaybackSelector(playbackSelectors.getIsPaused);
export const useIsLoading = () => usePlaybackSelector(playbackSelectors.getIsLoading);
export const useIsBuffering = () => usePlaybackSelector(playbackSelectors.getIsBuffering);
export const usePosition = () => usePlaybackSelector(playbackSelectors.getPosition);
export const useDuration = () => usePlaybackSelector(playbackSelectors.getDuration);
export const useBufferedPosition = () => usePlaybackSelector(playbackSelectors.getBufferedPosition);
export const useProgress = () => usePlaybackSelector(playbackSelectors.getProgress);
export const useFormattedTime = () => usePlaybackSelector((state) => ({
  position: playbackSelectors.getFormattedPosition(state),
  duration: playbackSelectors.getFormattedDuration(state),
  remaining: playbackSelectors.getFormattedTimeRemaining(state),
}));
export const useVolume = () => usePlaybackSelector(playbackSelectors.getVolume);
export const usePlaybackRate = () => usePlaybackSelector(playbackSelectors.getPlaybackRate);
export const useIsMuted = () => usePlaybackSelector(playbackSelectors.getIsMuted);
export const useIsLooping = () => usePlaybackSelector(playbackSelectors.getIsLooping);
export const useRepeatMode = () => usePlaybackSelector(playbackSelectors.getRepeatMode);
export const useShuffleMode = () => usePlaybackSelector(playbackSelectors.getShuffleMode);
export const useError = () => usePlaybackSelector(playbackSelectors.getError);
export const usePlaybackStatus = () => usePlaybackSelector(playbackSelectors.getPlaybackStatus);

// 控制状态 Hooks
export const usePlaybackControls = () => usePlaybackSelector(playbackSelectors.getPlaybackControls);
export const usePlaybackSettings = () => usePlaybackSelector(playbackSelectors.getPlaybackSettings);

// 操作 Hooks
export const usePlaybackActions = () => {
  const play = usePlaybackStore((state) => state.play);
  const pause = usePlaybackStore((state) => state.pause);
  const togglePlayPause = usePlaybackStore((state) => state.togglePlayPause);
  const stop = usePlaybackStore((state) => state.stop);
  const setPosition = usePlaybackStore((state) => state.setPosition);
  const seekTo = usePlaybackStore((state) => state.seekTo);
  const seekForward = usePlaybackStore((state) => state.seekForward);
  const seekBackward = usePlaybackStore((state) => state.seekBackward);
  const setVolume = usePlaybackStore((state) => state.setVolume);
  const setPlaybackRate = usePlaybackStore((state) => state.setPlaybackRate);
  const toggleMute = usePlaybackStore((state) => state.toggleMute);
  const setMuted = usePlaybackStore((state) => state.setMuted);
  const toggleLooping = usePlaybackStore((state) => state.toggleLooping);
  const setLooping = usePlaybackStore((state) => state.setLooping);
  const setBuffering = usePlaybackStore((state) => state.setBuffering);
  const setBufferedPosition = usePlaybackStore((state) => state.setBufferedPosition);
  const setDuration = usePlaybackStore((state) => state.setDuration);
  const setError = usePlaybackStore((state) => state.setError);
  const clearError = usePlaybackStore((state) => state.clearError);
  const updatePlaybackState = usePlaybackStore((state) => state.updatePlaybackState);
  const updateProgress = usePlaybackStore((state) => state.updateProgress);
  const updateBuffering = usePlaybackStore((state) => state.updateBuffering);
  const resetPlaybackState = usePlaybackStore((state) => state.resetPlaybackState);
  const resetPlaybackControls = usePlaybackStore((state) => state.resetPlaybackControls);

  return {
    play,
    pause,
    togglePlayPause,
    stop,
    setPosition,
    seekTo,
    seekForward,
    seekBackward,
    setVolume,
    setPlaybackRate,
    toggleMute,
    setMuted,
    toggleLooping,
    setLooping,
    setBuffering,
    setBufferedPosition,
    setDuration,
    setError,
    clearError,
    updatePlaybackState,
    updateProgress,
    updateBuffering,
    resetPlaybackState,
    resetPlaybackControls,
  };
};

// 播放控制 Hook
export const usePlaybackControl = () => {
  const isPlaying = useIsPlaying();
  const isPaused = useIsPaused();
  const isLoading = useIsLoading();
  const error = usePlaybackSelector(playbackSelectors.getError);
  const actions = usePlaybackActions();
  const controls = usePlaybackControls();

  return {
    isPlaying,
    isPaused,
    isLoading,
    error,
    hasError: error !== null,
    ...actions,
    ...controls,
  };
};

// 进度管理 Hook
export const usePlaybackProgress = () => {
  const position = usePosition();
  const duration = useDuration();
  const bufferedPosition = useBufferedPosition();
  const progress = useProgress();
  const formattedTime = useFormattedTime();
  const actions = usePlaybackActions();

  const seekToPosition = (position: number) => {
    actions.seekTo(position);
  };

  const seekToPercentage = (percentage: number) => {
    if (duration > 0) {
      const position = (percentage / 100) * duration;
      seekToPosition(position);
    }
  };

  const seekForwardSeconds = (seconds: number = 10) => {
    actions.seekForward(seconds);
  };

  const seekBackwardSeconds = (seconds: number = 10) => {
    actions.seekBackward(seconds);
  };

  return {
    position,
    duration,
    bufferedPosition,
    progress,
    formattedTime,
    seekToPosition,
    seekToPercentage,
    seekForwardSeconds,
    seekBackwardSeconds,
    canSeek: duration > 0,
    timeRemaining: Math.max(0, duration - position),
  };
};

// 音量控制 Hook
export const usePlaybackVolume = () => {
  const volume = useVolume();
  const isMuted = useIsMuted();
  const volumePercentage = usePlaybackSelector(playbackSelectors.getVolumePercentage);
  const isVolumeMuted = usePlaybackSelector(playbackSelectors.getIsVolumeMuted);
  const actions = usePlaybackActions();

  const setVolumePercentage = (percentage: number) => {
    actions.setVolume(percentage / 100);
  };

  const increaseVolume = (amount: number = 10) => {
    const newVolume = Math.min(100, volumePercentage + amount);
    setVolumePercentage(newVolume);
  };

  const decreaseVolume = (amount: number = 10) => {
    const newVolume = Math.max(0, volumePercentage - amount);
    setVolumePercentage(newVolume);
  };

  const toggleMute = () => {
    actions.toggleMute();
  };

  return {
    volume,
    isMuted,
    volumePercentage,
    isVolumeMuted,
    setVolumePercentage,
    increaseVolume,
    decreaseVolume,
    toggleMute,
    setVolume: actions.setVolume,
    setMuted: actions.setMuted,
  };
};

// 播放速率 Hook
export const usePlaybackSpeed = () => {
  const playbackRate = usePlaybackRate();
  const formattedPlaybackRate = usePlaybackSelector(playbackSelectors.getFormattedPlaybackRate);
  const playbackRateOptions = usePlaybackSelector(playbackSelectors.getPlaybackRateOptions);
  const actions = usePlaybackActions();

  const setPlaybackSpeed = (speed: number) => {
    actions.setPlaybackRate(speed);
  };

  const increaseSpeed = () => {
    const currentIndex = playbackRateOptions.indexOf(playbackRate);
    if (currentIndex < playbackRateOptions.length - 1) {
      setPlaybackSpeed(playbackRateOptions[currentIndex + 1]);
    }
  };

  const decreaseSpeed = () => {
    const currentIndex = playbackRateOptions.indexOf(playbackRate);
    if (currentIndex > 0) {
      setPlaybackSpeed(playbackRateOptions[currentIndex - 1]);
    }
  };

  return {
    playbackRate,
    formattedPlaybackRate,
    playbackRateOptions,
    setPlaybackSpeed,
    increaseSpeed,
    decreaseSpeed,
    canIncreaseSpeed: playbackRate < playbackRateOptions[playbackRateOptions.length - 1],
    canDecreaseSpeed: playbackRate > playbackRateOptions[0],
  };
};

// 播放模式 Hook
export const usePlaybackModes = () => {
  const repeatMode = useRepeatMode();
  const shuffleMode = useShuffleMode();
  const isLooping = useIsLooping();
  const actions = usePlaybackActions();

  const cycleRepeatMode = () => {
    const modes: ('none' | 'single' | 'all')[] = ['none', 'single', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    actions.setRepeatMode(modes[nextIndex]);
  };

  const toggleShuffle = () => {
    actions.toggleShuffle();
  };

  const toggleLooping = () => {
    actions.toggleLooping();
  };

  return {
    repeatMode,
    shuffleMode,
    isLooping,
    cycleRepeatMode,
    toggleShuffle,
    toggleLooping,
    setRepeatMode: actions.setRepeatMode,
    setShuffle: actions.setShuffle,
    setLooping: actions.setLooping,
  };
};

// 错误处理 Hook
export const usePlaybackError = () => {
  const error = usePlaybackSelector(playbackSelectors.getError);
  const errorCode = usePlaybackSelector(playbackSelectors.getErrorCode);
  const hasError = usePlaybackSelector(playbackSelectors.getHasError);
  const actions = usePlaybackActions();

  return {
    error,
    errorCode,
    hasError,
    setError: actions.setError,
    clearError: actions.clearError,
  };
};

// 缓冲状态 Hook
export const usePlaybackBuffering = () => {
  const isBuffering = useIsBuffering();
  const bufferedPosition = useBufferedPosition();
  const bufferedProgress = usePlaybackSelector(playbackSelectors.getBufferedProgress);
  const actions = usePlaybackActions();

  return {
    isBuffering,
    bufferedPosition,
    bufferedProgress,
    setBuffering: actions.setBuffering,
    setBufferedPosition: actions.setBufferedPosition,
    updateBuffering: actions.updateBuffering,
  };
};

// 复合 Hook - 提供完整的播放管理功能
export const usePlaybackManager = () => {
  const status = usePlaybackStatus();
  const progress = usePlaybackProgress();
  const volume = usePlaybackVolume();
  const speed = usePlaybackSpeed();
  const modes = usePlaybackModes();
  const error = usePlaybackError();
  const buffering = usePlaybackBuffering();
  const controls = usePlaybackControls();

  return {
    // 状态
    status,
    progress,
    volume,
    speed,
    modes,
    error,
    buffering,
    controls,
    
    // 便捷属性
    isPlaying: status === 'playing',
    isPaused: status === 'paused',
    isLoading: status === 'loading',
    isBuffering: buffering.isBuffering,
    hasError: error.hasError,
    canPlay: controls.canPlay,
    canPause: controls.canPause,
    canSeek: controls.canSeek,
  };
};