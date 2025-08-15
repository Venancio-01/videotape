/**
 * 播放 Store Hook - 提供播放状态管理的便捷接口
 */

import {
  usePlaybackStore as baseUsePlaybackStore,
  playbackSelectors,
} from "@/stores/playbackStore";
import { usePlaybackSelector } from "@/stores/playbackStore";

// 基础 Hook
export const usePlaybackStore = baseUsePlaybackStore;

// 常用选择器 Hooks
export const useIsMuted = () =>
  usePlaybackSelector(playbackSelectors.getIsMuted);

// 操作 Hooks - 只导出实际使用的操作
export const usePlaybackActions = () => {
  const play = usePlaybackStore((state) => state.play);
  const pause = usePlaybackStore((state) => state.pause);
  const setMuted = usePlaybackStore((state) => state.setMuted);

  return {
    play,
    pause,
    setMuted,
  };
};
