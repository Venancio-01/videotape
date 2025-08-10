/**
 * 播放状态管理 Store
 */

import type { PlaybackState } from "@/types/stateTypes";
import type { PlaybackStore } from "@/types/storeTypes";
import { StateUtils } from "@/utils/stateUtils";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// 初始状态
const initialState: PlaybackState = {
  // 基础状态
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  isBuffering: false,

  // 位置信息
  position: 0,
  duration: 0,
  bufferedPosition: 0,

  // 播放设置
  volume: 1.0,
  playbackRate: 1.0,
  isLooping: false,
  isMuted: false,

  // 播放队列
  queue: [],
  currentQueueIndex: -1,
  repeatMode: "none",
  shuffleMode: false,

  // 错误状态
  error: null,
  errorCode: null,
};

// 创建播放 Store
export const usePlaybackStore = create<PlaybackStore>()(
  MiddlewareCombinations.playbackStore(
    subscribeWithSelector((set, get) => ({
      // 基础状态
      ...initialState,

      // 播放控制
      play: () =>
        set((state) => ({
          ...state,
          isPlaying: true,
          isPaused: false,
          isLoading: false,
        })),

      pause: () =>
        set((state) => ({
          ...state,
          isPlaying: false,
          isPaused: true,
        })),

      togglePlayPause: () =>
        set((state) => ({
          ...state,
          isPlaying: !state.isPlaying,
          isPaused: state.isPlaying,
        })),

      stop: () =>
        set((state) => ({
          ...state,
          isPlaying: false,
          isPaused: false,
          position: 0,
        })),

      // 位置控制
      setPosition: (position: number) =>
        set((state) => ({
          ...state,
          position: Math.max(0, Math.min(position, state.duration)),
        })),

      seekTo: (position: number) =>
        set((state) => {
          const clampedPosition = Math.max(
            0,
            Math.min(position, state.duration),
          );
          return {
            ...state,
            position: clampedPosition,
            isLoading: true,
          };
        }),

      seekForward: (seconds: number) =>
        set((state) => {
          const newPosition = Math.min(
            state.position + seconds,
            state.duration,
          );
          return {
            ...state,
            position: newPosition,
            isLoading: true,
          };
        }),

      seekBackward: (seconds: number) =>
        set((state) => {
          const newPosition = Math.max(state.position - seconds, 0);
          return {
            ...state,
            position: newPosition,
            isLoading: true,
          };
        }),

      // 播放设置
      setVolume: (volume: number) =>
        set((state) => ({
          ...state,
          volume: Math.max(0, Math.min(volume, 1.0)),
        })),

      setPlaybackRate: (rate: number) =>
        set((state) => ({
          ...state,
          playbackRate: Math.max(0.25, Math.min(rate, 4.0)),
        })),

      toggleMute: () =>
        set((state) => ({
          ...state,
          isMuted: !state.isMuted,
        })),

      setMuted: (muted: boolean) =>
        set((state) => ({
          ...state,
          isMuted: muted,
        })),

      toggleLooping: () =>
        set((state) => ({
          ...state,
          isLooping: !state.isLooping,
        })),

      setLooping: (looping: boolean) =>
        set((state) => ({
          ...state,
          isLooping: looping,
        })),

      // 缓冲状态
      setBuffering: (buffering: boolean) =>
        set((state) => ({
          ...state,
          isBuffering: buffering,
        })),

      setBufferedPosition: (position: number) =>
        set((state) => ({
          ...state,
          bufferedPosition: Math.max(0, Math.min(position, state.duration)),
        })),

      setDuration: (duration: number) =>
        set((state) => ({
          ...state,
          duration: Math.max(0, duration),
        })),

      // 错误处理
      setError: (error: string | null, code?: string) =>
        set((state) => ({
          ...state,
          error,
          errorCode: code || null,
          isPlaying: false,
          isPaused: true,
          isLoading: false,
        })),

      clearError: () =>
        set((state) => ({
          ...state,
          error: null,
          errorCode: null,
        })),

      // 队列管理
      setQueue: (queue: any[]) =>
        set((state) => ({
          ...state,
          queue,
          currentQueueIndex: queue.length > 0 ? 0 : -1,
        })),

      setCurrentQueueIndex: (index: number) =>
        set((state) => ({
          ...state,
          currentQueueIndex: Math.max(
            -1,
            Math.min(index, state.queue.length - 1),
          ),
        })),

      // 播放模式
      toggleShuffle: () =>
        set((state) => ({
          ...state,
          shuffleMode: !state.shuffleMode,
        })),

      setShuffle: (shuffle: boolean) =>
        set((state) => ({
          ...state,
          shuffleMode: shuffle,
        })),

      setRepeatMode: (mode: "none" | "single" | "all") =>
        set((state) => ({
          ...state,
          repeatMode: mode,
        })),

      cycleRepeatMode: () =>
        set((state) => {
          const modes: ("none" | "single" | "all")[] = [
            "none",
            "single",
            "all",
          ];
          const currentIndex = modes.indexOf(state.repeatMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          return {
            ...state,
            repeatMode: modes[nextIndex],
          };
        }),

      // 高级播放控制
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
              return {
                ...state,
                isPlaying: false,
                isPaused: true,
              };
            }
          }

          return {
            ...state,
            currentQueueIndex: nextIndex,
            position: 0,
            isLoading: true,
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
            position: 0,
            isLoading: true,
          };
        }),

      playAtIndex: (index: number) =>
        set((state) => ({
          ...state,
          currentQueueIndex: Math.max(
            0,
            Math.min(index, state.queue.length - 1),
          ),
          position: 0,
          isLoading: true,
        })),

      // 状态更新
      updatePlaybackState: (updates: Partial<PlaybackState>) =>
        set((state) => ({
          ...state,
          ...updates,
        })),

      // 进度更新
      updateProgress: (position: number, duration?: number) =>
        set((state) => ({
          ...state,
          position: Math.max(0, Math.min(position, state.duration)),
          duration:
            duration !== undefined ? Math.max(0, duration) : state.duration,
        })),

      // 缓冲更新
      updateBuffering: (isBuffering: boolean, bufferedPosition?: number) =>
        set((state) => ({
          ...state,
          isBuffering,
          bufferedPosition:
            bufferedPosition !== undefined
              ? Math.max(0, Math.min(bufferedPosition, state.duration))
              : state.bufferedPosition,
        })),

      // 状态重置
      resetPlaybackState: () => set(initialState),

      // 部分重置
      resetPlaybackControls: () =>
        set((state) => ({
          ...state,
          isPlaying: false,
          isPaused: false,
          isLoading: false,
          position: 0,
        })),

      resetQueue: () =>
        set((state) => ({
          ...state,
          queue: [],
          currentQueueIndex: -1,
        })),

      // 选择器
      select: (selector) => selector(get()),
    })),
  ),
);

// 导出预定义的选择器
export const playbackSelectors = {
  // 基础状态
  getIsPlaying: (state: PlaybackState) => state.isPlaying,
  getIsPaused: (state: PlaybackState) => state.isPaused,
  getIsLoading: (state: PlaybackState) => state.isLoading,
  getIsBuffering: (state: PlaybackState) => state.isBuffering,

  // 位置信息
  getPosition: (state: PlaybackState) => state.position,
  getDuration: (state: PlaybackState) => state.duration,
  getBufferedPosition: (state: PlaybackState) => state.bufferedPosition,

  // 进度计算
  getProgress: (state: PlaybackState) =>
    state.duration > 0 ? state.position / state.duration : 0,
  getBufferedProgress: (state: PlaybackState) =>
    state.duration > 0 ? state.bufferedPosition / state.duration : 0,
  getFormattedPosition: (state: PlaybackState) => {
    const position = Math.floor(state.position);
    const minutes = Math.floor(position / 60);
    const seconds = position % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },
  getFormattedDuration: (state: PlaybackState) => {
    const duration = Math.floor(state.duration);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },

  // 播放设置
  getVolume: (state: PlaybackState) => state.volume,
  getPlaybackRate: (state: PlaybackState) => state.playbackRate,
  getIsMuted: (state: PlaybackState) => state.isMuted,
  getIsLooping: (state: PlaybackState) => state.isLooping,

  // 队列状态
  getQueue: (state: PlaybackState) => state.queue,
  getCurrentQueueIndex: (state: PlaybackState) => state.currentQueueIndex,
  getCurrentQueueItem: (state: PlaybackState) =>
    state.currentQueueIndex >= 0 && state.currentQueueIndex < state.queue.length
      ? state.queue[state.currentQueueIndex]
      : null,
  getHasNext: (state: PlaybackState) => {
    const { queue, currentQueueIndex, repeatMode } = state;
    if (queue.length === 0) return false;
    if (repeatMode === "all") return true;
    return currentQueueIndex < queue.length - 1;
  },
  getHasPrevious: (state: PlaybackState) => {
    const { queue, currentQueueIndex } = state;
    if (queue.length === 0) return false;
    return currentQueueIndex > 0;
  },

  // 播放模式
  getRepeatMode: (state: PlaybackState) => state.repeatMode,
  getShuffleMode: (state: PlaybackState) => state.shuffleMode,

  // 错误状态
  getError: (state: PlaybackState) => state.error,
  getErrorCode: (state: PlaybackState) => state.errorCode,
  getHasError: (state: PlaybackState) => state.error !== null,

  // 复合状态
  getPlaybackStatus: (state: PlaybackState) => {
    if (state.isLoading) return "loading";
    if (state.isBuffering) return "buffering";
    if (state.error) return "error";
    if (state.isPlaying) return "playing";
    if (state.isPaused) return "paused";
    return "stopped";
  },

  // 控制状态
  getCanPlay: (state: PlaybackState) =>
    !state.isLoading && !state.error && state.queue.length > 0,
  getCanPause: (state: PlaybackState) => state.isPlaying && !state.isLoading,
  getCanSeek: (state: PlaybackState) => !state.isLoading && state.duration > 0,
  getCanSkipNext: (state: PlaybackState) => playbackSelectors.getHasNext(state),
  getCanSkipPrevious: (state: PlaybackState) =>
    playbackSelectors.getHasPrevious(state),

  // 时间计算
  getTimeRemaining: (state: PlaybackState) =>
    Math.max(0, state.duration - state.position),
  getFormattedTimeRemaining: (state: PlaybackState) => {
    const remaining = Math.floor(playbackSelectors.getTimeRemaining(state));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },

  // 音量相关
  getVolumePercentage: (state: PlaybackState) => Math.round(state.volume * 100),
  getIsVolumeMuted: (state: PlaybackState) =>
    state.volume === 0 || state.isMuted,

  // 播放速率相关
  getPlaybackRateOptions: () => [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
  getFormattedPlaybackRate: (state: PlaybackState) => {
    if (state.playbackRate === 1.0) return "正常";
    if (state.playbackRate < 1.0) return `${state.playbackRate}x`;
    return `${state.playbackRate}x`;
  },
};

// 创建记忆化 Hook
export const usePlaybackSelector = <T>(
  selector: (state: PlaybackState) => T,
): T => {
  return usePlaybackStore(StateUtils.createSelector(selector));
};

// 预定义的 Hook
export const useIsPlaying = () =>
  usePlaybackSelector(playbackSelectors.getIsPlaying);
export const usePlaybackProgress = () =>
  usePlaybackSelector(playbackSelectors.getProgress);
export const useFormattedTime = () =>
  usePlaybackSelector((state) => ({
    position: playbackSelectors.getFormattedPosition(state),
    duration: playbackSelectors.getFormattedDuration(state),
    remaining: playbackSelectors.getFormattedTimeRemaining(state),
  }));
export const usePlaybackControls = () =>
  usePlaybackSelector((state) => ({
    canPlay: playbackSelectors.getCanPlay(state),
    canPause: playbackSelectors.getCanPause(state),
    canSeek: playbackSelectors.getCanSeek(state),
    canSkipNext: playbackSelectors.getCanSkipNext(state),
    canSkipPrevious: playbackSelectors.getCanSkipPrevious(state),
    hasNext: playbackSelectors.getHasNext(state),
    hasPrevious: playbackSelectors.getHasPrevious(state),
  }));
export const usePlaybackSettings = () =>
  usePlaybackSelector((state) => ({
    volume: state.volume,
    playbackRate: state.playbackRate,
    isMuted: state.isMuted,
    isLooping: state.isLooping,
    repeatMode: state.repeatMode,
    shuffleMode: state.shuffleMode,
    volumePercentage: playbackSelectors.getVolumePercentage(state),
    formattedPlaybackRate: playbackSelectors.getFormattedPlaybackRate(state),
  }));
