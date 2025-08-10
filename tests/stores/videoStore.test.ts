/**
 * 视频状态管理测试用例
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useVideoStore, videoSelectors, useVideoSelector } from '@/stores/videoStore';
import { type Video } from '@/db/schema';

// 模拟视频数据
const mockVideo: Video = {
  id: 'test-video-1',
  title: '测试视频',
  filePath: '/path/to/video.mp4',
  duration: 120,
  fileSize: 1024000,
  format: 'mp4',
  category: 'general',
  watchProgress: 0,
  isFavorite: false,
  playCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockVideo2: Video = {
  id: 'test-video-2',
  title: '测试视频2',
  filePath: '/path/to/video2.mp4',
  duration: 180,
  fileSize: 2048000,
  format: 'mp4',
  category: 'entertainment',
  watchProgress: 0,
  isFavorite: false,
  playCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('VideoStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useVideoStore.getState().reset();
  });

  describe('初始状态', () => {
    it('应该具有正确的初始状态', () => {
      const { result } = renderHook(() => useVideoStore());
      
      expect(result.current.videos).toEqual([]);
      expect(result.current.currentVideo).toBeNull();
      expect(result.current.favorites.size).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('视频管理', () => {
    it('应该能够添加视频', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
      });
      
      expect(result.current.videos).toHaveLength(1);
      expect(result.current.videos[0]).toEqual(mockVideo);
    });

    it('应该能够更新现有视频', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
      });
      
      act(() => {
        result.current.updateVideo(mockVideo.id, { title: '更新后的标题' });
      });
      
      expect(result.current.videos[0].title).toBe('更新后的标题');
    });

    it('应该能够删除视频', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
      });
      
      act(() => {
        result.current.removeVideo(mockVideo.id);
      });
      
      expect(result.current.videos).toHaveLength(0);
    });

    it('应该能够批量设置视频', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setVideos([mockVideo, mockVideo2]);
      });
      
      expect(result.current.videos).toHaveLength(2);
      expect(result.current.pagination.total).toBe(2);
    });
  });

  describe('播放控制', () => {
    it('应该能够设置当前视频', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.setCurrentVideo(mockVideo);
      });
      
      expect(result.current.currentVideo).toEqual(mockVideo);
    });

    it('应该能够播放指定视频', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.playVideo(mockVideo.id);
      });
      
      expect(result.current.currentVideo).toEqual(mockVideo);
      expect(result.current.playbackState.isPlaying).toBe(true);
    });

    it('应该能够暂停视频', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.playVideo(mockVideo.id);
      });
      
      act(() => {
        result.current.pauseVideo();
      });
      
      expect(result.current.playbackState.isPlaying).toBe(false);
      expect(result.current.playbackState.isPaused).toBe(true);
    });

    it('应该能够恢复播放', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.playVideo(mockVideo.id);
      });
      
      act(() => {
        result.current.pauseVideo();
      });
      
      act(() => {
        result.current.resumeVideo();
      });
      
      expect(result.current.playbackState.isPlaying).toBe(true);
      expect(result.current.playbackState.isPaused).toBe(false);
    });
  });

  describe('收藏管理', () => {
    it('应该能够添加收藏', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.addToFavorites(mockVideo.id);
      });
      
      expect(result.current.favorites.has(mockVideo.id)).toBe(true);
    });

    it('应该能够移除收藏', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.addToFavorites(mockVideo.id);
      });
      
      act(() => {
        result.current.removeFromFavorites(mockVideo.id);
      });
      
      expect(result.current.favorites.has(mockVideo.id)).toBe(false);
    });

    it('应该能够切换收藏状态', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.toggleFavorite(mockVideo.id);
      });
      
      expect(result.current.favorites.has(mockVideo.id)).toBe(true);
      
      act(() => {
        result.current.toggleFavorite(mockVideo.id);
      });
      
      expect(result.current.favorites.has(mockVideo.id)).toBe(false);
    });

    it('应该能够批量设置收藏', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.addVideo(mockVideo2);
        result.current.setFavorites([mockVideo.id, mockVideo2.id]);
      });
      
      expect(result.current.favorites.has(mockVideo.id)).toBe(true);
      expect(result.current.favorites.has(mockVideo2.id)).toBe(true);
    });
  });

  describe('观看历史', () => {
    it('应该能够添加观看历史', () => {
      const { result } = renderHook(() => useVideoStore());
      
      const historyEntry = {
        id: 'history-1',
        videoId: mockVideo.id,
        position: 60,
        duration: 120,
        watchedAt: '2024-01-01T00:00:00Z',
        completed: false,
        watchTime: 60,
        sessionId: 'session-1',
        deviceId: 'device-1',
        playbackSpeed: 1.0,
      };
      
      act(() => {
        result.current.addToWatchHistory(historyEntry);
      });
      
      expect(result.current.watchHistory).toHaveLength(1);
      expect(result.current.watchHistory[0]).toEqual(historyEntry);
    });

    it('应该能够更新观看进度', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.updateWatchProgress(mockVideo.id, 60, 120);
      });
      
      expect(result.current.watchHistory).toHaveLength(1);
      expect(result.current.watchHistory[0].position).toBe(60);
    });

    it('应该能够清除观看历史', () => {
      const { result } = renderHook(() => useVideoStore());
      
      const historyEntry = {
        id: 'history-1',
        videoId: mockVideo.id,
        position: 60,
        duration: 120,
        watchedAt: '2024-01-01T00:00:00Z',
        completed: false,
        watchTime: 60,
        sessionId: 'session-1',
        deviceId: 'device-1',
        playbackSpeed: 1.0,
      };
      
      act(() => {
        result.current.addToWatchHistory(historyEntry);
      });
      
      act(() => {
        result.current.clearWatchHistory();
      });
      
      expect(result.current.watchHistory).toHaveLength(0);
    });
  });

  describe('搜索和过滤', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setVideos([mockVideo, mockVideo2]);
      });
    });

    it('应该能够设置搜索查询', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setSearchQuery('测试');
      });
      
      expect(result.current.searchQuery).toBe('测试');
    });

    it('应该能够设置过滤器', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setFilter({ category: 'general' });
      });
      
      expect(result.current.currentFilter.category).toBe('general');
    });

    it('应该能够清除过滤器', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setFilter({ category: 'general' });
        result.current.setSearchQuery('测试');
      });
      
      act(() => {
        result.current.clearFilters();
      });
      
      expect(result.current.searchQuery).toBe('');
      expect(result.current.currentFilter).toEqual({});
    });
  });

  describe('分页', () => {
    it('应该能够设置分页信息', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setPagination({ page: 2, pageSize: 10 });
      });
      
      expect(result.current.pagination.page).toBe(2);
      expect(result.current.pagination.pageSize).toBe(10);
    });

    it('应该能够加载更多视频', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setPagination({ page: 1, pageSize: 10, total: 25, hasMore: true });
      });
      
      act(() => {
        result.current.loadMoreVideos();
      });
      
      expect(result.current.pagination.page).toBe(2);
    });
  });

  describe('加载状态', () => {
    it('应该能够设置加载状态', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
    });

    it('应该能够设置错误状态', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setError('测试错误');
      });
      
      expect(result.current.error).toBe('测试错误');
    });

    it('应该能够清除错误', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setError('测试错误');
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('选择器', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.setVideos([mockVideo, mockVideo2]);
        result.current.addToFavorites(mockVideo.id);
      });
    });

    it('应该能够获取所有视频', () => {
      const { result } = renderHook(() => useVideoSelector(videoSelectors.getAllVideos));
      
      expect(result.current).toHaveLength(2);
    });

    it('应该能够获取收藏视频', () => {
      const { result } = renderHook(() => useVideoSelector(videoSelectors.getFavoriteVideos));
      
      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe(mockVideo.id);
    });

    it('应该能够获取视频统计', () => {
      const { result } = renderHook(() => useVideoSelector(videoSelectors.getVideoStats));
      
      expect(result.current.totalVideos).toBe(2);
      expect(result.current.totalDuration).toBe(300); // 120 + 180
      expect(result.current.totalSize).toBe(3072000); // 1024000 + 2048000
    });

    it('应该能够获取过滤后的视频', () => {
      const { result } = renderHook(() => useVideoSelector(videoSelectors.getFilteredVideos));
      
      expect(result.current).toHaveLength(2);
      
      // 设置过滤器
      act(() => {
        result.current.setFilter({ category: 'general' });
      });
      
      const { result: filteredResult } = renderHook(() => useVideoSelector(videoSelectors.getFilteredVideos));
      
      expect(filteredResult.current).toHaveLength(1);
      expect(filteredResult.current[0].category).toBe('general');
    });
  });

  describe('状态重置', () => {
    it('应该能够重置状态', () => {
      const { result } = renderHook(() => useVideoStore());
      
      act(() => {
        result.current.addVideo(mockVideo);
        result.current.addToFavorites(mockVideo.id);
        result.current.setSearchQuery('测试');
      });
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.videos).toEqual([]);
      expect(result.current.favorites.size).toBe(0);
      expect(result.current.searchQuery).toBe('');
    });
  });
});