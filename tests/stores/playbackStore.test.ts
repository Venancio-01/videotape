/**
 * 播放状态管理测试用例
 */

import { act, renderHook } from '@testing-library/react-native';
import { usePlaybackStore, playbackSelectors, usePlaybackSelector } from '@/stores/playbackStore';

// 模拟队列数据
const mockQueue = [
  { id: 'video-1', title: '视频1', duration: 120 },
  { id: 'video-2', title: '视频2', duration: 180 },
  { id: 'video-3', title: '视频3', duration: 240 },
];

describe('PlaybackStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    usePlaybackStore.getState().resetPlaybackState();
  });

  describe('初始状态', () => {
    it('应该具有正确的初始状态', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isBuffering).toBe(false);
      expect(result.current.position).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.volume).toBe(1.0);
      expect(result.current.playbackRate).toBe(1.0);
      expect(result.current.isLooping).toBe(false);
      expect(result.current.isMuted).toBe(false);
      expect(result.current.queue).toEqual([]);
      expect(result.current.currentQueueIndex).toBe(-1);
      expect(result.current.repeatMode).toBe('none');
      expect(result.current.shuffleMode).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('播放控制', () => {
    it('应该能够开始播放', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.play();
      });
      
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });

    it('应该能够暂停播放', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.play();
      });
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(true);
    });

    it('应该能够切换播放/暂停', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.togglePlayPause();
      });
      
      expect(result.current.isPlaying).toBe(true);
      
      act(() => {
        result.current.togglePlayPause();
      });
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(true);
    });

    it('应该能够停止播放', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.play();
      });
      
      act(() => {
        result.current.stop();
      });
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.position).toBe(0);
    });
  });

  describe('位置控制', () => {
    it('应该能够设置播放位置', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setDuration(120);
      });
      
      act(() => {
        result.current.setPosition(60);
      });
      
      expect(result.current.position).toBe(60);
    });

    it('应该能够限制播放位置在有效范围内', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setDuration(120);
      });
      
      act(() => {
        result.current.setPosition(150); // 超过时长
      });
      
      expect(result.current.position).toBe(120);
      
      act(() => {
        result.current.setPosition(-10); // 负值
      });
      
      expect(result.current.position).toBe(0);
    });

    it('应该能够跳转到指定位置', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setDuration(120);
      });
      
      act(() => {
        result.current.seekTo(60);
      });
      
      expect(result.current.position).toBe(60);
      expect(result.current.isLoading).toBe(true);
    });

    it('应该能够快进', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setDuration(120);
        result.current.setPosition(30);
      });
      
      act(() => {
        result.current.seekForward(10);
      });
      
      expect(result.current.position).toBe(40);
      expect(result.current.isLoading).toBe(true);
    });

    it('应该能够快退', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setDuration(120);
        result.current.setPosition(50);
      });
      
      act(() => {
        result.current.seekBackward(10);
      });
      
      expect(result.current.position).toBe(40);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('播放设置', () => {
    it('应该能够设置音量', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setVolume(0.5);
      });
      
      expect(result.current.volume).toBe(0.5);
    });

    it('应该能够限制音量在有效范围内', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setVolume(1.5); // 超过最大值
      });
      
      expect(result.current.volume).toBe(1.0);
      
      act(() => {
        result.current.setVolume(-0.5); // 负值
      });
      
      expect(result.current.volume).toBe(0);
    });

    it('应该能够设置播放速率', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setPlaybackRate(1.5);
      });
      
      expect(result.current.playbackRate).toBe(1.5);
    });

    it('应该能够限制播放速率在有效范围内', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setPlaybackRate(0.1); // 低于最小值
      });
      
      expect(result.current.playbackRate).toBe(0.25);
      
      act(() => {
        result.current.setPlaybackRate(5.0); // 超过最大值
      });
      
      expect(result.current.playbackRate).toBe(4.0);
    });

    it('应该能够切换静音状态', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.toggleMute();
      });
      
      expect(result.current.isMuted).toBe(true);
      
      act(() => {
        result.current.toggleMute();
      });
      
      expect(result.current.isMuted).toBe(false);
    });

    it('应该能够设置静音状态', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setMuted(true);
      });
      
      expect(result.current.isMuted).toBe(true);
    });

    it('应该能够切换循环播放', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.toggleLooping();
      });
      
      expect(result.current.isLooping).toBe(true);
    });

    it('应该能够设置循环播放', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setLooping(true);
      });
      
      expect(result.current.isLooping).toBe(true);
    });
  });

  describe('队列管理', () => {
    it('应该能够设置播放队列', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setQueue(mockQueue);
      });
      
      expect(result.current.queue).toEqual(mockQueue);
      expect(result.current.currentQueueIndex).toBe(0);
    });

    it('应该能够设置当前队列索引', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setQueue(mockQueue);
      });
      
      act(() => {
        result.current.setCurrentQueueIndex(1);
      });
      
      expect(result.current.currentQueueIndex).toBe(1);
    });

    it('应该能够限制队列索引在有效范围内', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setQueue(mockQueue);
      });
      
      act(() => {
        result.current.setCurrentQueueIndex(5); // 超过范围
      });
      
      expect(result.current.currentQueueIndex).toBe(2); // 最后一个索引
    });

    it('应该能够播放下一个', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setQueue(mockQueue);
        result.current.setCurrentQueueIndex(0);
      });
      
      act(() => {
        result.current.playNext();
      });
      
      expect(result.current.currentQueueIndex).toBe(1);
      expect(result.current.position).toBe(0);
    });

    it('应该能够播放上一个', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setQueue(mockQueue);
        result.current.setCurrentQueueIndex(1);
      });
      
      act(() => {
        result.current.playPrevious();
      });
      
      expect(result.current.currentQueueIndex).toBe(0);
      expect(result.current.position).toBe(0);
    });

    it('应该能够在队列为空时正确处理播放控制', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.playNext();
      });
      
      expect(result.current.currentQueueIndex).toBe(-1);
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('播放模式', () => {
    it('应该能够切换随机播放', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.toggleShuffle();
      });
      
      expect(result.current.shuffleMode).toBe(true);
    });

    it('应该能够设置随机播放', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setShuffle(true);
      });
      
      expect(result.current.shuffleMode).toBe(true);
    });

    it('应该能够设置重复模式', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setRepeatMode('all');
      });
      
      expect(result.current.repeatMode).toBe('all');
    });

    it('应该能够循环切换重复模式', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      expect(result.current.repeatMode).toBe('none');
      
      act(() => {
        result.current.cycleRepeatMode();
      });
      
      expect(result.current.repeatMode).toBe('single');
      
      act(() => {
        result.current.cycleRepeatMode();
      });
      
      expect(result.current.repeatMode).toBe('all');
      
      act(() => {
        result.current.cycleRepeatMode();
      });
      
      expect(result.current.repeatMode).toBe('none');
    });
  });

  describe('缓冲状态', () => {
    it('应该能够设置缓冲状态', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setBuffering(true);
      });
      
      expect(result.current.isBuffering).toBe(true);
    });

    it('应该能够设置缓冲位置', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setDuration(120);
      });
      
      act(() => {
        result.current.setBufferedPosition(60);
      });
      
      expect(result.current.bufferedPosition).toBe(60);
    });

    it('应该能够更新缓冲状态', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setDuration(120);
      });
      
      act(() => {
        result.current.updateBuffering(true, 60);
      });
      
      expect(result.current.isBuffering).toBe(true);
      expect(result.current.bufferedPosition).toBe(60);
    });
  });

  describe('错误处理', () => {
    it('应该能够设置错误', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setError('播放错误', 'ERROR_CODE');
      });
      
      expect(result.current.error).toBe('播放错误');
      expect(result.current.errorCode).toBe('ERROR_CODE');
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(true);
    });

    it('应该能够清除错误', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setError('播放错误');
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.errorCode).toBeNull();
    });
  });

  describe('状态更新', () => {
    it('应该能够批量更新播放状态', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.updatePlaybackState({
          isPlaying: true,
          position: 60,
          duration: 120,
        });
      });
      
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.position).toBe(60);
      expect(result.current.duration).toBe(120);
    });

    it('应该能够更新进度', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.updateProgress(60, 120);
      });
      
      expect(result.current.position).toBe(60);
      expect(result.current.duration).toBe(120);
    });
  });

  describe('选择器', () => {
    beforeEach(() => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setQueue(mockQueue);
        result.current.setCurrentQueueIndex(0);
        result.current.setDuration(120);
        result.current.setPosition(60);
        result.current.play();
      });
    });

    it('应该能够获取播放状态', () => {
      const { result } = renderHook(() => usePlaybackSelector(playbackSelectors.getIsPlaying));
      
      expect(result.current).toBe(true);
    });

    it('应该能够获取播放进度', () => {
      const { result } = renderHook(() => usePlaybackSelector(playbackSelectors.getProgress));
      
      expect(result.current).toBe(0.5); // 60 / 120
    });

    it('应该能够获取格式化时间', () => {
      const { result } = renderHook(() => usePlaybackSelector(playbackSelectors.getFormattedPosition));
      
      expect(result.current).toBe('1:00');
    });

    it('应该能够获取队列状态', () => {
      const { result } = renderHook(() => usePlaybackSelector(playbackSelectors.getCurrentQueueItem));
      
      expect(result.current).toEqual(mockQueue[0]);
    });

    it('应该能够获取播放控制状态', () => {
      const { result } = renderHook(() => usePlaybackSelector(playbackSelectors.getPlaybackControls));
      
      expect(result.current.canPlay).toBe(true);
      expect(result.current.canPause).toBe(true);
      expect(result.current.canSeek).toBe(true);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.hasPrevious).toBe(false);
    });

    it('应该能够获取播放设置', () => {
      const { result } = renderHook(() => usePlaybackSelector(playbackSelectors.getPlaybackSettings));
      
      expect(result.current.volume).toBe(1.0);
      expect(result.current.playbackRate).toBe(1.0);
      expect(result.current.isMuted).toBe(false);
      expect(result.current.isLooping).toBe(false);
    });
  });

  describe('状态重置', () => {
    it('应该能够重置播放状态', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setQueue(mockQueue);
        result.current.play();
        result.current.setPosition(60);
        result.current.setVolume(0.5);
      });
      
      act(() => {
        result.current.resetPlaybackState();
      });
      
      expect(result.current).toEqual({
        ...initialState,
      });
    });

    it('应该能够重置播放控制', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.play();
        result.current.setPosition(60);
      });
      
      act(() => {
        result.current.resetPlaybackControls();
      });
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.position).toBe(0);
    });

    it('应该能够重置队列', () => {
      const { result } = renderHook(() => usePlaybackStore());
      
      act(() => {
        result.current.setQueue(mockQueue);
        result.current.setCurrentQueueIndex(1);
      });
      
      act(() => {
        result.current.resetQueue();
      });
      
      expect(result.current.queue).toEqual([]);
      expect(result.current.currentQueueIndex).toBe(-1);
    });
  });
});