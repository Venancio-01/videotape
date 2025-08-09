/**
 * 视频播放相关的自定义 Hook
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoFile } from '../types';
import { formatDuration, calculateProgress } from '../utils';

interface UseVideoPlayerProps {
  video: VideoFile;
  autoPlay?: boolean;
  initialPosition?: number;
}

interface VideoPlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
}

export function useVideoPlayer({
  video,
  autoPlay = false,
  initialPosition = 0,
}: UseVideoPlayerProps) {
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: autoPlay,
    isBuffering: true,
    position: initialPosition,
    duration: 0,
    playbackRate: 1.0,
    volume: 1.0,
    isMuted: false,
    error: null,
  });

  const videoRef = useRef<any>(null);
  const progressUpdateInterval = useRef<number | null>(null);

  // 播放控制
  const play = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const seekTo = useCallback((position: number) => {
    if (videoRef.current) {
      videoRef.current.seek(position);
      setState((prev) => ({ ...prev, position }));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState((prev) => ({ ...prev, volume: clampedVolume, isMuted: clampedVolume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
      volume: prev.isMuted ? 1 : 0,
    }));
  }, []);

  // 事件处理
  const handleLoad = useCallback((load: any) => {
    setState((prev) => ({
      ...prev,
      duration: load.duration,
      isBuffering: false,
      error: null,
    }));
  }, []);

  const handleProgress = useCallback((progress: any) => {
    setState((prev) => ({
      ...prev,
      position: progress.currentTime,
      isBuffering: false,
    }));
  }, []);

  const handleEnd = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      position: 0,
    }));
  }, []);

  const handleError = useCallback((error: any) => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isBuffering: false,
      error: error?.error?.errorString || '播放失败',
    }));
  }, []);

  const handleBuffer = useCallback((isBuffering: boolean) => {
    setState((prev) => ({ ...prev, isBuffering }));
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, []);

  // 计算属性
  const progress = calculateProgress(state.position, state.duration);
  const formattedPosition = formatDuration(state.position);
  const formattedDuration = formatDuration(state.duration);

  return {
    // Ref
    videoRef,

    // State
    state,
    progress,
    formattedPosition,
    formattedDuration,

    // Actions
    play,
    pause,
    togglePlay,
    seekTo,
    setPlaybackRate,
    setVolume,
    toggleMute,

    // Event handlers
    handleLoad,
    handleProgress,
    handleEnd,
    handleError,
    handleBuffer,
  };
}
