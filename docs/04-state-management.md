# 状态管理模块开发文档

## 1. 模块概述

### 1.1 功能描述
状态管理模块负责管理应用的所有状态和数据流，包括播放状态、用户设置、视频数据、播放列表等。该模块是整个应用的数据管理中心。

### 1.2 技术栈
- **状态管理**: Zustand
- **持久化**: Zustand persist + MMKV
- **数据同步**: 自定义事件总线
- **类型安全**: TypeScript

### 1.3 依赖关系
- 为所有其他模块提供状态管理服务
- 依赖存储管理模块进行数据持久化
- 依赖数据库模块进行数据操作

## 2. 功能需求

### 2.1 核心状态管理

#### 2.1.1 视频状态管理
```typescript
// src/stores/video.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Video } from '../database/schema';
import { db } from '../database/schema';
import { mmkv } from '../utils/storage';

interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  sortBy: 'date' | 'title' | 'duration' | 'size' | 'views';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  filters: {
    duration?: { min: number; max: number };
    quality?: ('high' | 'medium' | 'low')[];
    format?: string[];
  };
  
  // Actions
  loadVideos: () => Promise<void>;
  addVideo: (video: Video) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  removeVideo: (id: string) => void;
  setCurrentVideo: (video: Video | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedTags: (tags: string[]) => void;
  setSortBy: (sortBy: VideoState['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setFilters: (filters: VideoState['filters']) => void;
  getFilteredVideos: () => Video[];
  searchVideos: (query: string) => Promise<Video[]>;
  refreshVideos: () => Promise<void>;
  clearFilters: () => void;
}

// 自定义存储适配器
const storage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: any) => {
    mmkv.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    mmkv.delete(name);
  }
};

export const useVideoStore = create<VideoState>()(
  persist(
    (set, get) => ({
      videos: [],
      currentVideo: null,
      loading: false,
      error: null,
      searchQuery: '',
      selectedCategory: null,
      selectedTags: [],
      sortBy: 'date',
      sortOrder: 'desc',
      viewMode: 'grid',
      filters: {},

      // 加载视频列表
      loadVideos: async () => {
        set({ loading: true, error: null });
        
        try {
          const videos = await db.videos.toArray();
          set({ videos, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '加载视频失败',
            loading: false 
          });
        }
      },

      // 添加视频
      addVideo: (video) => {
        set((state) => ({
          videos: [video, ...state.videos]
        }));
      },

      // 更新视频
      updateVideo: (id, updates) => {
        set((state) => ({
          videos: state.videos.map((video) =>
            video.id === id ? { ...video, ...updates, updatedAt: new Date() } : video
          ),
          currentVideo: state.currentVideo?.id === id
            ? { ...state.currentVideo, ...updates, updatedAt: new Date() }
            : state.currentVideo
        }));
      },

      // 删除视频
      removeVideo: (id) => {
        set((state) => ({
          videos: state.videos.filter((video) => video.id !== id),
          currentVideo: state.currentVideo?.id === id ? null : state.currentVideo
        }));
      },

      // 设置当前视频
      setCurrentVideo: (video) => {
        set({ currentVideo: video });
      },

      // 设置加载状态
      setLoading: (loading) => set({ loading }),

      // 设置错误状态
      setError: (error) => set({ error }),

      // 设置搜索查询
      setSearchQuery: (query) => set({ searchQuery: query }),

      // 设置选中分类
      setSelectedCategory: (category) => set({ selectedCategory: category }),

      // 设置选中标签
      setSelectedTags: (tags) => set({ selectedTags: tags }),

      // 设置排序方式
      setSortBy: (sortBy) => set({ sortBy }),

      // 设置排序顺序
      setSortOrder: (sortOrder) => set({ sortOrder }),

      // 设置视图模式
      setViewMode: (viewMode) => set({ viewMode }),

      // 设置过滤器
      setFilters: (filters) => set({ filters }),

      // 获取过滤后的视频
      getFilteredVideos: () => {
        const { 
          videos, 
          searchQuery, 
          selectedCategory, 
          selectedTags, 
          sortBy, 
          sortOrder, 
          filters 
        } = get();

        let filtered = videos.filter((video) => {
          // 搜索过滤
          const matchesSearch = !searchQuery ||
            video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

          // 分类过滤
          const matchesCategory = !selectedCategory || video.category === selectedCategory;

          // 标签过滤
          const matchesTags = selectedTags.length === 0 ||
            selectedTags.some((tag) => video.tags.includes(tag));

          // 时长过滤
          const matchesDuration = !filters.duration ||
            (video.duration >= filters.duration.min && video.duration <= filters.duration.max);

          // 质量过滤
          const matchesQuality = !filters.quality ||
            filters.quality.includes(video.quality);

          // 格式过滤
          const matchesFormat = !filters.format ||
            filters.format.includes(video.format);

          return (
            matchesSearch &&
            matchesCategory &&
            matchesTags &&
            matchesDuration &&
            matchesQuality &&
            matchesFormat
          );
        });

        // 排序
        filtered.sort((a, b) => {
          let comparison = 0;

          switch (sortBy) {
            case 'title':
              comparison = a.title.localeCompare(b.title);
              break;
            case 'duration':
              comparison = a.duration - b.duration;
              break;
            case 'size':
              comparison = a.fileSize - b.fileSize;
              break;
            case 'views':
              comparison = a.viewCount - b.viewCount;
              break;
            case 'date':
            default:
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
          }

          return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
      },

      // 搜索视频
      searchVideos: async (query: string) => {
        try {
          const videos = await db.videos
            .filter((video) =>
              video.title.toLowerCase().includes(query.toLowerCase()) ||
              video.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
            )
            .toArray();

          return videos;
        } catch (error) {
          console.error('搜索视频失败:', error);
          return [];
        }
      },

      // 刷新视频列表
      refreshVideos: async () => {
        await get().loadVideos();
      },

      // 清除过滤器
      clearFilters: () => {
        set({
          searchQuery: '',
          selectedCategory: null,
          selectedTags: [],
          filters: {}
        });
      }
    }),
    {
      name: 'video-store',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        selectedCategory: state.selectedCategory,
        selectedTags: state.selectedTags
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        console.log('Video store rehydrated:', state);
      }
    }
  )
);
```

#### 2.1.2 播放状态管理
```typescript
// src/stores/playback.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '../database/schema';
import { mmkv } from '../utils/storage';

interface PlaybackState {
  currentVideoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  volume: number;
  playbackRate: number;
  quality: 'high' | 'medium' | 'low';
  isFullscreen: boolean;
  isMuted: boolean;
  subtitles: {
    enabled: boolean;
    language: string;
    tracks: Array<{
      language: string;
      label: string;
      src: string;
    }>;
  };
  audioTracks: {
    enabled: boolean;
    tracks: Array<{
      language: string;
      label: string;
    }>;
  };
  playbackMode: 'normal' | 'loop' | 'shuffle';
  playlist: {
    currentPlaylistId: string | null;
    currentIndex: number;
    videoIds: string[];
    repeatMode: 'off' | 'one' | 'all';
    shuffleMode: boolean;
  };
  history: Array<{
    videoId: string;
    watchedAt: Date;
    duration: number;
    progress: number;
  }>;
  
  // Actions
  setCurrentVideoId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBufferedTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setQuality: (quality: 'high' | 'medium' | 'low') => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setSubtitles: (subtitles: PlaybackState['subtitles']) => void;
  setAudioTracks: (audioTracks: PlaybackState['audioTracks']) => void;
  setPlaybackMode: (mode: 'normal' | 'loop' | 'shuffle') => void;
  setPlaylist: (playlist: PlaybackState['playlist']) => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  toggleSubtitles: () => void;
  seekTo: (time: number) => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  addToHistory: (videoId: string, duration: number, progress: number) => void;
  getPlaybackHistory: (limit?: number) => Promise<Array<any>>;
  saveProgress: () => Promise<void>;
  reset: () => void;
  exportState: () => any;
  importState: (state: any) => void;
}

export const usePlaybackStore = create<PlaybackState>()(
  persist(
    (set, get) => ({
      currentVideoId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      bufferedTime: 0,
      volume: 1,
      playbackRate: 1,
      quality: 'high',
      isFullscreen: false,
      isMuted: false,
      subtitles: {
        enabled: false,
        language: 'zh',
        tracks: []
      },
      audioTracks: {
        enabled: false,
        tracks: []
      },
      playbackMode: 'normal',
      playlist: {
        currentPlaylistId: null,
        currentIndex: 0,
        videoIds: [],
        repeatMode: 'off',
        shuffleMode: false
      },
      history: [],

      // 设置当前视频ID
      setCurrentVideoId: (id) => set({ currentVideoId: id }),

      // 设置播放状态
      setIsPlaying: (playing) => set({ isPlaying: playing }),

      // 设置当前时间
      setCurrentTime: (time) => set({ currentTime: time }),

      // 设置总时长
      setDuration: (duration) => set({ duration }),

      // 设置缓冲时间
      setBufferedTime: (time) => set({ bufferedTime: time }),

      // 设置音量
      setVolume: (volume) => set({ volume }),

      // 设置播放速度
      setPlaybackRate: (rate) => set({ playbackRate: rate }),

      // 设置视频质量
      setQuality: (quality) => set({ quality }),

      // 设置全屏状态
      setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

      // 设置静音状态
      setIsMuted: (muted) => set({ isMuted: muted }),

      // 设置字幕
      setSubtitles: (subtitles) => set({ subtitles }),

      // 设置音轨
      setAudioTracks: (audioTracks) => set({ audioTracks }),

      // 设置播放模式
      setPlaybackMode: (mode) => set({ playbackMode: mode }),

      // 设置播放列表
      setPlaylist: (playlist) => set({ playlist }),

      // 切换播放/暂停
      togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),

      // 切换静音
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      // 切换全屏
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

      // 切换字幕
      toggleSubtitles: () => set((state) => ({
        subtitles: {
          ...state.subtitles,
          enabled: !state.subtitles.enabled
        }
      })),

      // 跳转到指定时间
      seekTo: (time) => set({ currentTime: time }),

      // 快进
      seekForward: (seconds = 10) => set((state) => ({
        currentTime: Math.min(state.duration, state.currentTime + seconds)
      })),

      // 快退
      seekBackward: (seconds = 10) => set((state) => ({
        currentTime: Math.max(0, state.currentTime - seconds)
      })),

      // 播放下一个
      playNext: async () => {
        const { playlist, currentVideoId } = get();
        
        if (playlist.videoIds.length === 0) {
          return;
        }

        let nextIndex = playlist.currentIndex + 1;

        // 处理重复模式
        if (nextIndex >= playlist.videoIds.length) {
          if (playlist.repeatMode === 'all') {
            nextIndex = 0;
          } else {
            // 播放结束
            set({ isPlaying: false });
            return;
          }
        }

        // 更新播放列表状态
        set({
          playlist: {
            ...playlist,
            currentIndex: nextIndex
          }
        });

        // 设置当前视频
        const nextVideoId = playlist.videoIds[nextIndex];
        set({ currentVideoId: nextVideoId });
      },

      // 播放上一个
      playPrevious: async () => {
        const { playlist } = get();
        
        if (playlist.videoIds.length === 0) {
          return;
        }

        let prevIndex = playlist.currentIndex - 1;

        // 处理边界情况
        if (prevIndex < 0) {
          if (playlist.repeatMode === 'all') {
            prevIndex = playlist.videoIds.length - 1;
          } else {
            prevIndex = 0;
          }
        }

        // 更新播放列表状态
        set({
          playlist: {
            ...playlist,
            currentIndex: prevIndex
          }
        });

        // 设置当前视频
        const prevVideoId = playlist.videoIds[prevIndex];
        set({ currentVideoId: prevVideoId });
      },

      // 添加到历史记录
      addToHistory: (videoId, duration, progress) => {
        set((state) => {
          const newHistory = [
            {
              videoId,
              watchedAt: new Date(),
              duration,
              progress
            },
            ...state.history.filter(item => item.videoId !== videoId)
          ].slice(0, 100); // 保留最近100条记录

          return { history: newHistory };
        });
      },

      // 获取播放历史
      getPlaybackHistory: async (limit = 20) => {
        const { history } = get();
        return history.slice(0, limit);
      },

      // 保存播放进度
      saveProgress: async () => {
        const { currentVideoId, currentTime } = get();
        
        if (currentVideoId) {
          try {
            await db.videos.update(currentVideoId, {
              playbackProgress: currentTime,
              lastWatchedAt: new Date()
            });
          } catch (error) {
            console.error('保存播放进度失败:', error);
          }
        }
      },

      // 重置状态
      reset: () => set({
        currentVideoId: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        bufferedTime: 0,
        volume: 1,
        playbackRate: 1,
        quality: 'high',
        isFullscreen: false,
        isMuted: false,
        subtitles: {
          enabled: false,
          language: 'zh',
          tracks: []
        },
        audioTracks: {
          enabled: false,
          tracks: []
        },
        playbackMode: 'normal',
        playlist: {
          currentPlaylistId: null,
          currentIndex: 0,
          videoIds: [],
          repeatMode: 'off',
          shuffleMode: false
        },
        history: []
      }),

      // 导出状态
      exportState: () => {
        const state = get();
        return {
          ...state,
          // 移除不需要持久化的数据
          isPlaying: false,
          currentTime: 0,
          bufferedTime: 0
        };
      },

      // 导入状态
      importState: (importedState) => {
        set({
          ...importedState,
          isPlaying: false,
          currentTime: 0,
          bufferedTime: 0
        });
      }
    }),
    {
      name: 'playback-store',
      storage: createJSONStorage(() => mmkv),
      partialize: (state) => ({
        volume: state.volume,
        playbackRate: state.playbackRate,
        quality: state.quality,
        subtitles: state.subtitles,
        audioTracks: state.audioTracks,
        playbackMode: state.playbackMode
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        console.log('Playback store rehydrated:', state);
      }
    }
  )
);
```

### 2.2 设置状态管理

#### 2.2.1 用户设置管理
```typescript
// src/stores/settings.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkv } from '../utils/storage';

interface SettingsState {
  // 通用设置
  language: string;
  theme: 'light' | 'dark' | 'system';
  autoRotate: boolean;
  hardwareAcceleration: boolean;
  
  // 播放设置
  defaultPlaybackSpeed: number;
  defaultQuality: 'high' | 'medium' | 'low';
  autoPlay: boolean;
  loopVideo: boolean;
  rememberPosition: boolean;
  skipIntro: boolean;
  skipCredits: boolean;
  
  // 界面设置
  showControls: boolean;
  autoHideControls: boolean;
  controlsTimeout: number;
  showProgress: boolean;
  showTimeRemaining: boolean;
  doubleTapToSeek: boolean;
  gesturesEnabled: boolean;
  
  // 字幕设置
  subtitlesEnabled: boolean;
  defaultSubtitleLanguage: string;
  subtitleFontSize: number;
  subtitleFontColor: string;
  subtitleBackgroundColor: string;
  subtitlePosition: 'bottom' | 'top' | 'center';
  
  // 音频设置
  defaultAudioLanguage: string;
  audioNormalization: boolean;
  volumeBoost: number;
  
  // 存储设置
  downloadLocation: string;
  cacheSize: number;
  autoClearCache: boolean;
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  
  // 隐私设置
  analyticsEnabled: boolean;
  crashReporting: boolean;
  telemetryEnabled: boolean;
  
  // 高级设置
  debugMode: boolean;
  developerOptions: boolean;
  experimentalFeatures: boolean;
  
  // Actions
  updateSettings: (settings: Partial<SettingsState>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => boolean;
  resetToDefaults: () => void;
}

const defaultSettings: SettingsState = {
  // 通用设置
  language: 'zh',
  theme: 'system',
  autoRotate: true,
  hardwareAcceleration: true,
  
  // 播放设置
  defaultPlaybackSpeed: 1,
  defaultQuality: 'high',
  autoPlay: true,
  loopVideo: false,
  rememberPosition: true,
  skipIntro: false,
  skipCredits: false,
  
  // 界面设置
  showControls: true,
  autoHideControls: true,
  controlsTimeout: 3000,
  showProgress: true,
  showTimeRemaining: false,
  doubleTapToSeek: true,
  gesturesEnabled: true,
  
  // 字幕设置
  subtitlesEnabled: false,
  defaultSubtitleLanguage: 'zh',
  subtitleFontSize: 16,
  subtitleFontColor: '#FFFFFF',
  subtitleBackgroundColor: 'rgba(0, 0, 0, 0.7)',
  subtitlePosition: 'bottom',
  
  // 音频设置
  defaultAudioLanguage: 'zh',
  audioNormalization: true,
  volumeBoost: 0,
  
  // 存储设置
  downloadLocation: 'default',
  cacheSize: 1024, // MB
  autoClearCache: true,
  backupEnabled: true,
  backupFrequency: 'weekly',
  
  // 隐私设置
  analyticsEnabled: false,
  crashReporting: true,
  telemetryEnabled: false,
  
  // 高级设置
  debugMode: false,
  developerOptions: false,
  experimentalFeatures: false
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      // 更新设置
      updateSettings: (newSettings) => {
        set((state) => ({ ...state, ...newSettings }));
      },

      // 重置设置
      resetSettings: () => {
        set(defaultSettings);
      },

      // 导出设置
      exportSettings: () => {
        const state = get();
        return JSON.stringify(state, null, 2);
      },

      // 导入设置
      importSettings: (settingsString) => {
        try {
          const importedSettings = JSON.parse(settingsString);
          set({ ...defaultSettings, ...importedSettings });
          return true;
        } catch (error) {
          console.error('导入设置失败:', error);
          return false;
        }
      },

      // 重置为默认设置
      resetToDefaults: () => {
        set(defaultSettings);
      }
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkv),
      version: 1,
      onRehydrateStorage: () => (state) => {
        console.log('Settings store rehydrated:', state);
      }
    }
  )
);
```

### 2.3 播放列表状态管理

#### 2.3.1 播放列表管理
```typescript
// src/stores/playlist.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '../database/schema';
import { mmkv } from '../utils/storage';

interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail?: string;
  duration: number;
  addedAt: Date;
  order: number;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  videoCount: number;
  totalDuration: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: PlaylistItem[];
  currentPlayingIndex: number;
  isPlaying: boolean;
  repeatMode: 'off' | 'one' | 'all';
  shuffleMode: boolean;
}

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<string>;
  deletePlaylist: (id: string) => Promise<boolean>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<boolean>;
  addVideoToPlaylist: (playlistId: string, videoId: string) => Promise<boolean>;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => Promise<boolean>;
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => Promise<boolean>;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  setCurrentPlayingIndex: (index: number) => void;
  setPlaylistPlaying: (playing: boolean) => void;
  setRepeatMode: (playlistId: string, mode: 'off' | 'one' | 'all') => Promise<boolean>;
  setShuffleMode: (playlistId: string, shuffle: boolean) => Promise<boolean>;
  playNextInPlaylist: () => Promise<void>;
  playPreviousInPlaylist: () => Promise<void>;
  getPlaylistById: (id: string) => Playlist | null;
  getPlaylistsByVideo: (videoId: string) => Playlist[];
  exportPlaylist: (id: string) => string;
  importPlaylist: (playlistData: string) => Promise<boolean>;
  clearAll: () => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      currentPlaylist: null,
      loading: false,
      error: null,

      // 加载播放列表
      loadPlaylists: async () => {
        set({ loading: true, error: null });
        
        try {
          const playlists = await db.playlists.toArray();
          const enrichedPlaylists = await Promise.all(
            playlists.map(async (playlist) => {
              const items = await db.playlistItems
                .where('playlistId')
                .equals(playlist.id)
                .toArray();
              
              const videoIds = items.map(item => item.videoId);
              const videos = await db.videos
                .where('id')
                .anyOf(videoIds)
                .toArray();
              
              const playlistItems: PlaylistItem[] = items.map(item => {
                const video = videos.find(v => v.id === item.videoId);
                return {
                  id: item.id,
                  videoId: item.videoId,
                  title: video?.title || 'Unknown',
                  thumbnail: video?.thumbnailPath,
                  duration: video?.duration || 0,
                  addedAt: item.addedAt,
                  order: item.order
                };
              });

              const totalDuration = playlistItems.reduce((sum, item) => sum + item.duration, 0);

              return {
                ...playlist,
                videoCount: playlistItems.length,
                totalDuration,
                items: playlistItems,
                currentPlayingIndex: 0,
                isPlaying: false
              };
            })
          );

          set({ playlists: enrichedPlaylists, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '加载播放列表失败',
            loading: false 
          });
        }
      },

      // 创建播放列表
      createPlaylist: async (name, description) => {
        try {
          const playlistId = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const playlist: Omit<Playlist, 'id' | 'videoCount' | 'totalDuration' | 'items' | 'currentPlayingIndex' | 'isPlaying'> = {
            name,
            description,
            thumbnail: undefined,
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            repeatMode: 'off',
            shuffleMode: false
          };

          await db.playlists.add({
            id: playlistId,
            ...playlist
          });

          // 更新状态
          set((state) => ({
            playlists: [
              {
                id: playlistId,
                videoCount: 0,
                totalDuration: 0,
                items: [],
                currentPlayingIndex: 0,
                isPlaying: false,
                ...playlist
              },
              ...state.playlists
            ]
          }));

          return playlistId;
        } catch (error) {
          console.error('创建播放列表失败:', error);
          throw error;
        }
      },

      // 删除播放列表
      deletePlaylist: async (id) => {
        try {
          // 删除播放列表项
          await db.playlistItems
            .where('playlistId')
            .equals(id)
            .delete();

          // 删除播放列表
          await db.playlists.delete(id);

          // 更新状态
          set((state) => ({
            playlists: state.playlists.filter(p => p.id !== id),
            currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist
          }));

          return true;
        } catch (error) {
          console.error('删除播放列表失败:', error);
          return false;
        }
      },

      // 更新播放列表
      updatePlaylist: async (id, updates) => {
        try {
          await db.playlists.update(id, {
            ...updates,
            updatedAt: new Date()
          });

          // 更新状态
          set((state) => ({
            playlists: state.playlists.map(p =>
              p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
            ),
            currentPlaylist: state.currentPlaylist?.id === id 
              ? { ...state.currentPlaylist, ...updates, updatedAt: new Date() }
              : state.currentPlaylist
          }));

          return true;
        } catch (error) {
          console.error('更新播放列表失败:', error);
          return false;
        }
      },

      // 添加视频到播放列表
      addVideoToPlaylist: async (playlistId, videoId) => {
        try {
          const playlist = get().playlists.find(p => p.id === playlistId);
          if (!playlist) {
            throw new Error('播放列表不存在');
          }

          // 检查视频是否已存在
          if (playlist.items.some(item => item.videoId === videoId)) {
            return false;
          }

          // 获取视频信息
          const video = await db.videos.get(videoId);
          if (!video) {
            throw new Error('视频不存在');
          }

          // 添加到数据库
          const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.playlistItems.add({
            id: itemId,
            playlistId,
            videoId,
            addedAt: new Date(),
            order: playlist.items.length
          });

          // 更新状态
          const newItem: PlaylistItem = {
            id: itemId,
            videoId,
            title: video.title,
            thumbnail: video.thumbnailPath,
            duration: video.duration,
            addedAt: new Date(),
            order: playlist.items.length
          };

          set((state) => ({
            playlists: state.playlists.map(p =>
              p.id === playlistId
                ? {
                    ...p,
                    videoCount: p.videoCount + 1,
                    totalDuration: p.totalDuration + video.duration,
                    items: [...p.items, newItem],
                    updatedAt: new Date()
                  }
                : p
            ),
            currentPlaylist: state.currentPlaylist?.id === playlistId
              ? {
                  ...state.currentPlaylist,
                  videoCount: state.currentPlaylist.videoCount + 1,
                  totalDuration: state.currentPlaylist.totalDuration + video.duration,
                  items: [...state.currentPlaylist.items, newItem],
                  updatedAt: new Date()
                }
              : state.currentPlaylist
          }));

          return true;
        } catch (error) {
          console.error('添加视频到播放列表失败:', error);
          return false;
        }
      },

      // 从播放列表移除视频
      removeVideoFromPlaylist: async (playlistId, videoId) => {
        try {
          const playlist = get().playlists.find(p => p.id === playlistId);
          if (!playlist) {
            throw new Error('播放列表不存在');
          }

          const itemToRemove = playlist.items.find(item => item.videoId === videoId);
          if (!itemToRemove) {
            return false;
          }

          // 从数据库删除
          await db.playlistItems.delete(itemToRemove.id);

          // 更新状态
          const updatedItems = playlist.items.filter(item => item.videoId !== videoId);
          const removedItem = playlist.items.find(item => item.videoId === videoId);

          set((state) => ({
            playlists: state.playlists.map(p =>
              p.id === playlistId
                ? {
                    ...p,
                    videoCount: p.videoCount - 1,
                    totalDuration: p.totalDuration - (removedItem?.duration || 0),
                    items: updatedItems,
                    updatedAt: new Date()
                  }
                : p
            ),
            currentPlaylist: state.currentPlaylist?.id === playlistId
              ? {
                  ...state.currentPlaylist,
                  videoCount: state.currentPlaylist.videoCount - 1,
                  totalDuration: state.currentPlaylist.totalDuration - (removedItem?.duration || 0),
                  items: updatedItems,
                  updatedAt: new Date()
                }
              : state.currentPlaylist
          }));

          return true;
        } catch (error) {
          console.error('从播放列表移除视频失败:', error);
          return false;
        }
      },

      // 重新排序播放列表
      reorderPlaylist: async (playlistId, fromIndex, toIndex) => {
        try {
          const playlist = get().playlists.find(p => p.id === playlistId);
          if (!playlist) {
            throw new Error('播放列表不存在');
          }

          const newItems = [...playlist.items];
          const [movedItem] = newItems.splice(fromIndex, 1);
          newItems.splice(toIndex, 0, movedItem);

          // 更新数据库中的顺序
          await Promise.all(
            newItems.map((item, index) =>
              db.playlistItems.update(item.id, { order: index })
            )
          );

          // 更新状态
          set((state) => ({
            playlists: state.playlists.map(p =>
              p.id === playlistId
                ? { ...p, items: newItems, updatedAt: new Date() }
                : p
            ),
            currentPlaylist: state.currentPlaylist?.id === playlistId
              ? { ...state.currentPlaylist, items: newItems, updatedAt: new Date() }
              : state.currentPlaylist
          }));

          return true;
        } catch (error) {
          console.error('重新排序播放列表失败:', error);
          return false;
        }
      },

      // 设置当前播放列表
      setCurrentPlaylist: (playlist) => {
        set({ currentPlaylist: playlist });
      },

      // 设置当前播放索引
      setCurrentPlayingIndex: (index) => {
        set((state) => ({
          currentPlaylist: state.currentPlaylist
            ? { ...state.currentPlaylist, currentPlayingIndex: index }
            : null
        }));
      },

      // 设置播放列表播放状态
      setPlaylistPlaying: (playing) => {
        set((state) => ({
          currentPlaylist: state.currentPlaylist
            ? { ...state.currentPlaylist, isPlaying: playing }
            : null
        }));
      },

      // 设置重复模式
      setRepeatMode: async (playlistId, mode) => {
        try {
          await db.playlists.update(playlistId, { repeatMode: mode });

          set((state) => ({
            playlists: state.playlists.map(p =>
              p.id === playlistId
                ? { ...p, repeatMode: mode, updatedAt: new Date() }
                : p
            ),
            currentPlaylist: state.currentPlaylist?.id === playlistId
              ? { ...state.currentPlaylist, repeatMode: mode, updatedAt: new Date() }
              : state.currentPlaylist
          }));

          return true;
        } catch (error) {
          console.error('设置重复模式失败:', error);
          return false;
        }
      },

      // 设置随机播放模式
      setShuffleMode: async (playlistId, shuffle) => {
        try {
          const playlist = get().playlists.find(p => p.id === playlistId);
          if (!playlist) {
            return false;
          }

          let newItems = [...playlist.items];
          
          if (shuffle) {
            // 打乱顺序
            for (let i = newItems.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newItems[i], newItems[j]] = [newItems[j], newItems[i]];
            }
          } else {
            // 恢复原始顺序
            newItems.sort((a, b) => a.order - b.order);
          }

          // 更新数据库
          await Promise.all(
            newItems.map((item, index) =>
              db.playlistItems.update(item.id, { order: index })
            )
          );

          // 更新状态
          set((state) => ({
            playlists: state.playlists.map(p =>
              p.id === playlistId
                ? { ...p, shuffleMode: shuffle, items: newItems, updatedAt: new Date() }
                : p
            ),
            currentPlaylist: state.currentPlaylist?.id === playlistId
              ? { ...state.currentPlaylist, shuffleMode: shuffle, items: newItems, updatedAt: new Date() }
              : state.currentPlaylist
          }));

          return true;
        } catch (error) {
          console.error('设置随机播放模式失败:', error);
          return false;
        }
      },

      // 播放下一个
      playNextInPlaylist: async () => {
        const { currentPlaylist } = get();
        if (!currentPlaylist || currentPlaylist.items.length === 0) {
          return;
        }

        let nextIndex = currentPlaylist.currentPlayingIndex + 1;

        // 处理重复模式
        if (nextIndex >= currentPlaylist.items.length) {
          if (currentPlaylist.repeatMode === 'all') {
            nextIndex = 0;
          } else {
            // 播放结束
            set((state) => ({
              currentPlaylist: state.currentPlaylist
                ? { ...state.currentPlaylist, isPlaying: false }
                : null
            }));
            return;
          }
        }

        set((state) => ({
          currentPlaylist: state.currentPlaylist
            ? { ...state.currentPlaylist, currentPlayingIndex: nextIndex }
            : null
        }));
      },

      // 播放上一个
      playPreviousInPlaylist: async () => {
        const { currentPlaylist } = get();
        if (!currentPlaylist || currentPlaylist.items.length === 0) {
          return;
        }

        let prevIndex = currentPlaylist.currentPlayingIndex - 1;

        // 处理边界情况
        if (prevIndex < 0) {
          if (currentPlaylist.repeatMode === 'all') {
            prevIndex = currentPlaylist.items.length - 1;
          } else {
            prevIndex = 0;
          }
        }

        set((state) => ({
          currentPlaylist: state.currentPlaylist
            ? { ...state.currentPlaylist, currentPlayingIndex: prevIndex }
            : null
        }));
      },

      // 根据ID获取播放列表
      getPlaylistById: (id) => {
        return get().playlists.find(p => p.id === id) || null;
      },

      // 获取包含指定视频的播放列表
      getPlaylistsByVideo: (videoId) => {
        return get().playlists.filter(playlist =>
          playlist.items.some(item => item.videoId === videoId)
        );
      },

      // 导出播放列表
      exportPlaylist: (id) => {
        const playlist = get().playlists.find(p => p.id === id);
        if (!playlist) {
          throw new Error('播放列表不存在');
        }

        return JSON.stringify({
          name: playlist.name,
          description: playlist.description,
          items: playlist.items.map(item => ({
            videoId: item.videoId,
            title: item.title,
            order: item.order
          }))
        }, null, 2);
      },

      // 导入播放列表
      importPlaylist: async (playlistData) => {
        try {
          const data = JSON.parse(playlistData);
          const playlistId = await get().createPlaylist(data.name, data.description);

          // 添加视频到播放列表
          for (const item of data.items) {
            await get().addVideoToPlaylist(playlistId, item.videoId);
          }

          return true;
        } catch (error) {
          console.error('导入播放列表失败:', error);
          return false;
        }
      },

      // 清空所有
      clearAll: () => {
        set({ playlists: [], currentPlaylist: null });
      }
    }),
    {
      name: 'playlist-store',
      storage: createJSONStorage(() => mmkv),
      partialize: (state) => ({
        currentPlaylist: state.currentPlaylist
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        console.log('Playlist store rehydrated:', state);
      }
    }
  )
);
```

## 3. 事件总线系统

### 3.1 事件总线实现
```typescript
// src/utils/event-bus.ts
type EventHandler<T = any> = (data: T) => void;

interface EventBusConfig {
  maxListeners?: number;
  enableLogging?: boolean;
}

interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
  once: boolean;
}

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private subscriptions: Map<string, EventSubscription> = new Map();
  private config: EventBusConfig;
  private subscriptionCounter = 0;

  constructor(config: EventBusConfig = {}) {
    this.config = {
      maxListeners: 100,
      enableLogging: false,
      ...config
    };
  }

  static getInstance(config?: EventBusConfig): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  // 订阅事件
  subscribe<T>(event: string, handler: EventHandler<T>, once = false): string {
    const subscriptionId = `sub_${this.subscriptionCounter++}`;
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event)!;
    
    // 检查监听器数量限制
    if (listeners.size >= this.config.maxListeners!) {
      console.warn(`Event listener limit reached for event: ${event}`);
    }

    listeners.add(handler);

    // 记录订阅
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      event,
      handler,
      once
    });

    if (this.config.enableLogging!) {
      console.log(`Event subscribed: ${event} (ID: ${subscriptionId})`);
    }

    return subscriptionId;
  }

  // 订阅一次性事件
  once<T>(event: string, handler: EventHandler<T>): string {
    return this.subscribe(event, handler, true);
  }

  // 取消订阅
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      if (this.config.enableLogging!) {
        console.warn(`Subscription not found: ${subscriptionId}`);
      }
      return false;
    }

    const { event, handler } = subscription;
    const listeners = this.listeners.get(event);
    
    if (listeners) {
      listeners.delete(handler);
      
      // 如果没有监听器了，删除事件
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }

    this.subscriptions.delete(subscriptionId);

    if (this.config.enableLogging!) {
      console.log(`Event unsubscribed: ${event} (ID: ${subscriptionId})`);
    }

    return true;
  }

  // 发布事件
  publish<T>(event: string, data?: T): void {
    const listeners = this.listeners.get(event);
    
    if (this.config.enableLogging!) {
      console.log(`Event published: ${event}`, data);
    }

    if (listeners) {
      // 创建副本以避免在迭代过程中修改
      const listenersCopy = Array.from(listeners);
      
      listenersCopy.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // 移除所有监听器
  removeAllListeners(event?: string): void {
    if (event) {
      // 移除特定事件的所有监听器
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.clear();
        this.listeners.delete(event);
      }
      
      // 移除相关订阅
      for (const [id, subscription] of this.subscriptions) {
        if (subscription.event === event) {
          this.subscriptions.delete(id);
        }
      }
    } else {
      // 移除所有事件的所有监听器
      this.listeners.clear();
      this.subscriptions.clear();
    }
  }

  // 获取事件监听器数量
  listenerCount(event: string): number {
    const listeners = this.listeners.get(event);
    return listeners ? listeners.size : 0;
  }

  // 获取所有事件名称
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  // 获取订阅信息
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }
}

// 事件类型定义
export const AppEvents = {
  // 视频相关事件
  VIDEO_SELECTED: 'video:selected',
  VIDEO_PLAYBACK_STARTED: 'video:playback:started',
  VIDEO_PLAYBACK_PAUSED: 'video:playback:paused',
  VIDEO_PLAYBACK_ENDED: 'video:playback:ended',
  VIDEO_PROGRESS_UPDATED: 'video:progress:updated',
  VIDEO_LOADED: 'video:loaded',
  VIDEO_ERROR: 'video:error',
  
  // 播放列表相关事件
  PLAYLIST_CREATED: 'playlist:created',
  PLAYLIST_UPDATED: 'playlist:updated',
  PLAYLIST_DELETED: 'playlist:deleted',
  PLAYLIST_ITEM_ADDED: 'playlist:item:added',
  PLAYLIST_ITEM_REMOVED: 'playlist:item:removed',
  PLAYLIST_ITEM_REORDERED: 'playlist:item:reordered',
  
  // 用户界面相关事件
  UI_THEME_CHANGED: 'ui:theme:changed',
  UI_VIEW_MODE_CHANGED: 'ui:view_mode:changed',
  UI_NAVIGATION_CHANGED: 'ui:navigation:changed',
  
  // 设置相关事件
  SETTINGS_UPDATED: 'settings:updated',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_IMPORTED: 'settings:imported',
  SETTINGS_EXPORTED: 'settings:exported',
  
  // 应用状态相关事件
  APP_FOREGROUND: 'app:foreground',
  APP_BACKGROUND: 'app:background',
  APP_ACTIVE: 'app:active',
  APP_INACTIVE: 'app:inactive',
  
  // 网络相关事件
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',
  NETWORK_SLOW: 'network:slow',
  
  // 存储相关事件
  STORAGE_UPDATE: 'storage:update',
  STORAGE_ERROR: 'storage:error',
  STORAGE_BACKUP_COMPLETE: 'storage:backup:complete',
  STORAGE_RESTORE_COMPLETE: 'storage:restore:complete',
  
  // 错误相关事件
  ERROR_OCCURRED: 'error:occurred',
  ERROR_HANDLED: 'error:handled',
  ERROR_REPORTED: 'error:reported'
} as const;

// 全局事件总线实例
export const eventBus = EventBus.getInstance({
  maxListeners: 50,
  enableLogging: process.env.NODE_ENV === 'development'
});
```

## 4. 状态同步服务

### 4.1 状态同步管理
```typescript
// src/services/state-sync.service.ts
import { useVideoStore } from '../stores/video.store';
import { usePlaybackStore } from '../stores/playback.store';
import { useSettingsStore } from '../stores/settings.store';
import { usePlaylistStore } from '../stores/playlist.store';
import { eventBus, AppEvents } from '../utils/event-bus';
import { db } from '../database/schema';

export interface SyncOptions {
  autoSync: boolean;
  syncInterval: number;
  syncOnAppStateChange: boolean;
  syncOnNetworkChange: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export class StateSyncService {
  private static instance: StateSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private config: SyncOptions;

  constructor(config: SyncOptions) {
    this.config = config;
    this.initializeEventListeners();
  }

  static getInstance(config?: SyncOptions): StateSyncService {
    if (!StateSyncService.instance) {
      StateSyncService.instance = new StateSyncService(config || {
        autoSync: true,
        syncInterval: 30000, // 30秒
        syncOnAppStateChange: true,
        syncOnNetworkChange: true,
        retryAttempts: 3,
        retryDelay: 1000
      });
    }
    return StateSyncService.instance;
  }

  // 初始化事件监听器
  private initializeEventListeners(): void {
    // 网络状态监听
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.config.syncOnNetworkChange) {
        this.startSync();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // 应用状态监听
    document.addEventListener('visibilitychange', () => {
      if (this.config.syncOnAppStateChange) {
        if (document.hidden) {
          this.pauseSync();
        } else {
          this.resumeSync();
        }
      }
    });

    // 监听状态变化事件
    eventBus.subscribe(AppEvents.VIDEO_PROGRESS_UPDATED, () => {
      this.addToSyncQueue(() => this.syncPlaybackProgress());
    });

    eventBus.subscribe(AppEvents.VIDEO_PLAYBACK_ENDED, () => {
      this.addToSyncQueue(() => this.syncPlaybackHistory());
    });

    eventBus.subscribe(AppEvents.SETTINGS_UPDATED, () => {
      this.addToSyncQueue(() => this.syncSettings());
    });
  }

  // 启动同步
  startSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.config.autoSync) {
      this.syncInterval = setInterval(() => {
        this.performSync();
      }, this.config.syncInterval);
    }
  }

  // 暂停同步
  pauseSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // 恢复同步
  resumeSync(): void {
    this.startSync();
  }

  // 添加到同步队列
  addToSyncQueue(syncFunction: () => Promise<void>): void {
    this.syncQueue.push(syncFunction);
    this.processSyncQueue();
  }

  // 处理同步队列
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    while (this.syncQueue.length > 0) {
      const syncFunction = this.syncQueue.shift()!;
      
      try {
        await syncFunction();
      } catch (error) {
        console.error('Sync queue item failed:', error);
      }
    }

    this.isSyncing = false;
  }

  // 执行同步
  async performSync(): Promise<SyncResult> {
    if (!this.isOnline || this.isSyncing) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Offline or already syncing'],
        duration: 0,
        timestamp: new Date()
      };
    }

    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      errors: [],
      duration: 0,
      timestamp: new Date()
    };

    this.isSyncing = true;

    try {
      // 同步播放进度
      await this.syncPlaybackProgress();
      result.syncedItems++;
      
      // 同步播放历史
      await this.syncPlaybackHistory();
      result.syncedItems++;
      
      // 同步设置
      await this.syncSettings();
      result.syncedItems++;
      
      // 同步播放列表
      await this.syncPlaylists();
      result.syncedItems++;
      
      // 同步视频数据
      await this.syncVideoData();
      result.syncedItems++;
      
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
    } finally {
      this.isSyncing = false;
      result.duration = Date.now() - startTime;
    }

    // 发布同步完成事件
    eventBus.publish(AppEvents.STORAGE_UPDATE, result);

    return result;
  }

  // 同步播放进度
  private async syncPlaybackProgress(): Promise<void> {
    const { currentVideoId, currentTime } = usePlaybackStore.getState();
    
    if (currentVideoId && currentTime > 0) {
      try {
        await db.videos.update(currentVideoId, {
          playbackProgress: currentTime,
          lastWatchedAt: new Date()
        });
      } catch (error) {
        console.error('Sync playback progress failed:', error);
        throw error;
      }
    }
  }

  // 同步播放历史
  private async syncPlaybackHistory(): Promise<void> {
    const { currentVideoId, duration, currentTime } = usePlaybackStore.getState();
    
    if (currentVideoId && duration > 0) {
      try {
        const progress = (currentTime / duration) * 100;
        
        // 检查是否已经存在今天的观看记录
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingHistory = await db.watchHistory
          .where('videoId')
          .equals(currentVideoId)
          .and(item => item.watchedAt >= today)
          .first();

        if (existingHistory) {
          // 更新现有记录
          await db.watchHistory.update(existingHistory.id, {
            duration: Math.max(existingHistory.duration, duration),
            progress: Math.max(existingHistory.progress, progress),
            completed: progress >= 95
          });
        } else {
          // 创建新记录
          await db.watchHistory.add({
            id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            videoId: currentVideoId,
            watchedAt: new Date(),
            duration,
            progress,
            completed: progress >= 95,
            playbackRate: 1
          });
        }
      } catch (error) {
        console.error('Sync playback history failed:', error);
        throw error;
      }
    }
  }

  // 同步设置
  private async syncSettings(): Promise<void> {
    try {
      const settings = useSettingsStore.getState();
      
      // 保存设置到数据库
      const existingSettings = await db.settings.get('user_settings');
      
      if (existingSettings) {
        await db.settings.update('user_settings', {
          ...settings,
          updatedAt: new Date()
        });
      } else {
        await db.settings.add({
          id: 'user_settings',
          ...settings,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Sync settings failed:', error);
      throw error;
    }
  }

  // 同步播放列表
  private async syncPlaylists(): Promise<void> {
    try {
      const { playlists } = usePlaylistStore.getState();
      
      // 这里可以实现播放列表的同步逻辑
      // 例如：同步播放列表的修改时间、播放次数等
      
    } catch (error) {
      console.error('Sync playlists failed:', error);
      throw error;
    }
  }

  // 同步视频数据
  private async syncVideoData(): Promise<void> {
    try {
      const { videos } = useVideoStore.getState();
      
      // 批量更新视频数据
      for (const video of videos) {
        // 检查是否需要更新
        const existingVideo = await db.videos.get(video.id);
        if (existingVideo && existingVideo.updatedAt < video.updatedAt) {
          await db.videos.update(video.id, video);
        }
      }
    } catch (error) {
      console.error('Sync video data failed:', error);
      throw error;
    }
  }

  // 手动触发同步
  async forceSync(): Promise<SyncResult> {
    return await this.performSync();
  }

  // 获取同步状态
  getSyncStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    queueLength: number;
    lastSync?: Date;
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSync: undefined // 可以在这里记录上次同步时间
    };
  }

  // 清理同步队列
  clearSyncQueue(): void {
    this.syncQueue = [];
  }

  // 销毁服务
  destroy(): void {
    this.pauseSync();
    this.clearSyncQueue();
  }
}

// 全局状态同步服务实例
export const stateSyncService = StateSyncService.getInstance();
```

## 5. 状态管理工具

### 5.1 状态选择器
```typescript
// src/utils/state-selectors.ts
import { useVideoStore } from '../stores/video.store';
import { usePlaybackStore } from '../stores/playback.store';
import { useSettingsStore } from '../stores/settings.store';
import { usePlaylistStore } from '../stores/playlist.store';

// 视频相关选择器
export const videoSelectors = {
  // 获取所有视频
  getAllVideos: () => useVideoStore.getState().videos,
  
  // 获取当前视频
  getCurrentVideo: () => useVideoStore.getState().currentVideo,
  
  // 获取过滤后的视频
  getFilteredVideos: () => useVideoStore.getState().getFilteredVideos(),
  
  // 获取视频数量
  getVideoCount: () => useVideoStore.getState().videos.length,
  
  // 获取加载状态
  isLoading: () => useVideoStore.getState().loading,
  
  // 获取错误信息
  getError: () => useVideoStore.getState().error,
  
  // 检查是否有视频
  hasVideos: () => useVideoStore.getState().videos.length > 0,
  
  // 获取搜索结果
  getSearchResults: (query: string) => {
    const { videos, searchQuery } = useVideoStore.getState();
    if (!query.trim()) return videos;
    
    return videos.filter(video =>
      video.title.toLowerCase().includes(query.toLowerCase()) ||
      video.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  },
  
  // 获取分类列表
  getCategories: () => {
    const { videos } = useVideoStore.getState();
    const categories = new Set<string>();
    
    videos.forEach(video => {
      if (video.category) {
        categories.add(video.category);
      }
    });
    
    return Array.from(categories);
  },
  
  // 获取标签列表
  getTags: () => {
    const { videos } = useVideoStore.getState();
    const tags = new Set<string>();
    
    videos.forEach(video => {
      video.tags.forEach(tag => tags.add(tag));
    });
    
    return Array.from(tags);
  }
};

// 播放相关选择器
export const playbackSelectors = {
  // 获取播放状态
  getIsPlaying: () => usePlaybackStore.getState().isPlaying,
  
  // 获取当前时间
  getCurrentTime: () => usePlaybackStore.getState().currentTime,
  
  // 获取总时长
  getDuration: () => usePlaybackStore.getState().duration,
  
  // 获取播放进度百分比
  getProgress: () => {
    const { currentTime, duration } = usePlaybackStore.getState();
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  },
  
  // 获取音量
  getVolume: () => usePlaybackStore.getState().volume,
  
  // 获取播放速度
  getPlaybackRate: () => usePlaybackStore.getState().playbackRate,
  
  // 获取视频质量
  getQuality: () => usePlaybackStore.getState().quality,
  
  // 获取全屏状态
  getIsFullscreen: () => usePlaybackStore.getState().isFullscreen,
  
  // 获取静音状态
  getIsMuted: () => usePlaybackStore.getState().isMuted,
  
  // 获取字幕状态
  getSubtitles: () => usePlaybackStore.getState().subtitles,
  
  // 获取播放模式
  getPlaybackMode: () => usePlaybackStore.getState().playbackMode,
  
  // 获取当前播放列表
  getCurrentPlaylist: () => usePlaybackStore.getState().playlist,
  
  // 获取缓冲进度
  getBufferedProgress: () => {
    const { bufferedTime, duration } = usePlaybackStore.getState();
    return duration > 0 ? (bufferedTime / duration) * 100 : 0;
  },
  
  // 检查是否可以播放
  canPlay: () => {
    const { currentVideoId, duration } = usePlaybackStore.getState();
    return currentVideoId !== null && duration > 0;
  },
  
  // 获取剩余时间
  getRemainingTime: () => {
    const { currentTime, duration } = usePlaybackStore.getState();
    return Math.max(0, duration - currentTime);
  },
  
  // 格式化当前时间
  getFormattedCurrentTime: () => {
    const { currentTime } = usePlaybackStore.getState();
    return formatTime(currentTime);
  },
  
  // 格式化总时长
  getFormattedDuration: () => {
    const { duration } = usePlaybackStore.getState();
    return formatTime(duration);
  },
  
  // 格式化剩余时间
  getFormattedRemainingTime: () => {
    const remaining = playbackSelectors.getRemainingTime();
    return formatTime(remaining);
  }
};

// 设置相关选择器
export const settingsSelectors = {
  // 获取语言设置
  getLanguage: () => useSettingsStore.getState().language,
  
  // 获取主题设置
  getTheme: () => useSettingsStore.getState().theme,
  
  // 获取默认播放速度
  getDefaultPlaybackSpeed: () => useSettingsStore.getState().defaultPlaybackSpeed,
  
  // 获取默认视频质量
  getDefaultQuality: () => useSettingsStore.getState().defaultQuality,
  
  // 获取自动播放设置
  getAutoPlay: () => useSettingsStore.getState().autoPlay,
  
  // 获取记住播放位置设置
  getRememberPosition: () => useSettingsStore.getState().rememberPosition,
  
  // 获取字幕设置
  getSubtitlesSettings: () => {
    const { subtitlesEnabled, defaultSubtitleLanguage } = useSettingsStore.getState();
    return { enabled: subtitlesEnabled, language: defaultSubtitleLanguage };
  },
  
  // 获取手势设置
  getGesturesEnabled: () => useSettingsStore.getState().gesturesEnabled,
  
  // 获取控制设置
  getControlsSettings: () => {
    const { showControls, autoHideControls, controlsTimeout } = useSettingsStore.getState();
    return { showControls, autoHideControls, controlsTimeout };
  },
  
  // 获取存储设置
  getStorageSettings: () => {
    const { cacheSize, autoClearCache, backupEnabled } = useSettingsStore.getState();
    return { cacheSize, autoClearCache, backupEnabled };
  }
};

// 播放列表相关选择器
export const playlistSelectors = {
  // 获取所有播放列表
  getAllPlaylists: () => usePlaylistStore.getState().playlists,
  
  // 获取当前播放列表
  getCurrentPlaylist: () => usePlaylistStore.getState().currentPlaylist,
  
  // 获取播放列表数量
  getPlaylistCount: () => usePlaylistStore.getState().playlists.length,
  
  // 获取指定播放列表
  getPlaylistById: (id: string) => usePlaylistStore.getState().getPlaylistById(id),
  
  // 获取包含指定视频的播放列表
  getPlaylistsByVideo: (videoId: string) => usePlaylistStore.getState().getPlaylistsByVideo(videoId),
  
  // 检查是否有播放列表
  hasPlaylists: () => usePlaylistStore.getState().playlists.length > 0,
  
  // 获取当前播放项
  getCurrentPlaylistItem: () => {
    const { currentPlaylist } = usePlaylistStore.getState();
    if (!currentPlaylist || currentPlaylist.items.length === 0) {
      return null;
    }
    return currentPlaylist.items[currentPlaylist.currentPlayingIndex];
  },
  
  // 获取下一个播放项
  getNextPlaylistItem: () => {
    const { currentPlaylist } = usePlaylistStore.getState();
    if (!currentPlaylist || currentPlaylist.items.length === 0) {
      return null;
    }
    
    let nextIndex = currentPlaylist.currentPlayingIndex + 1;
    if (nextIndex >= currentPlaylist.items.length) {
      if (currentPlaylist.repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return null;
      }
    }
    
    return currentPlaylist.items[nextIndex];
  },
  
  // 获取上一个播放项
  getPreviousPlaylistItem: () => {
    const { currentPlaylist } = usePlaylistStore.getState();
    if (!currentPlaylist || currentPlaylist.items.length === 0) {
      return null;
    }
    
    let prevIndex = currentPlaylist.currentPlayingIndex - 1;
    if (prevIndex < 0) {
      if (currentPlaylist.repeatMode === 'all') {
        prevIndex = currentPlaylist.items.length - 1;
      } else {
        prevIndex = 0;
      }
    }
    
    return currentPlaylist.items[prevIndex];
  }
};

// 工具函数
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
```

## 6. 测试计划

### 6.1 状态管理测试
```typescript
// src/__tests__/stores/video.store.test.ts
import { useVideoStore } from '../../stores/video.store';
import { db } from '../../database/schema';

// Mock database
jest.mock('../../database/schema', () => ({
  db: {
    videos: {
      toArray: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('VideoStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置store状态
    useVideoStore.setState({
      videos: [],
      currentVideo: null,
      loading: false,
      error: null,
      searchQuery: '',
      selectedCategory: null,
      selectedTags: [],
      sortBy: 'date',
      sortOrder: 'desc',
      viewMode: 'grid',
      filters: {}
    });
  });

  describe('loadVideos', () => {
    it('应该成功加载视频列表', async () => {
      const mockVideos = [
        {
          id: '1',
          title: 'Test Video 1',
          filePath: '/path/to/video1.mp4',
          fileSize: 1024 * 1024,
          duration: 120,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          viewCount: 0,
          playbackProgress: 0,
          quality: 'high' as const
        }
      ];

      (db.videos.toArray as jest.Mock).mockResolvedValue(mockVideos);

      await useVideoStore.getState().loadVideos();

      expect(useVideoStore.getState().videos).toEqual(mockVideos);
      expect(useVideoStore.getState().loading).toBe(false);
      expect(useVideoStore.getState().error).toBeNull();
    });

    it('应该处理加载错误', async () => {
      const errorMessage = 'Database error';
      (db.videos.toArray as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await useVideoStore.getState().loadVideos();

      expect(useVideoStore.getState().videos).toEqual([]);
      expect(useVideoStore.getState().loading).toBe(false);
      expect(useVideoStore.getState().error).toBe(errorMessage);
    });
  });

  describe('addVideo', () => {
    it('应该添加视频到列表', () => {
      const newVideo = {
        id: '2',
        title: 'New Video',
        filePath: '/path/to/new.mp4',
        fileSize: 2 * 1024 * 1024,
        duration: 180,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        viewCount: 0,
        playbackProgress: 0,
        quality: 'high' as const
      };

      useVideoStore.getState().addVideo(newVideo);

      expect(useVideoStore.getState().videos).toHaveLength(1);
      expect(useVideoStore.getState().videos[0]).toEqual(newVideo);
    });
  });

  describe('updateVideo', () => {
    it('应该更新视频信息', () => {
      const initialVideo = {
        id: '1',
        title: 'Test Video',
        filePath: '/path/to/video.mp4',
        fileSize: 1024 * 1024,
        duration: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        viewCount: 0,
        playbackProgress: 0,
        quality: 'high' as const
      };

      useVideoStore.setState({ videos: [initialVideo] });

      const updates = {
        title: 'Updated Video',
        viewCount: 5
      };

      useVideoStore.getState().updateVideo('1', updates);

      const updatedVideo = useVideoStore.getState().videos[0];
      expect(updatedVideo.title).toBe('Updated Video');
      expect(updatedVideo.viewCount).toBe(5);
      expect(updatedVideo.updatedAt).not.toEqual(initialVideo.updatedAt);
    });
  });

  describe('removeVideo', () => {
    it('应该从列表中移除视频', () => {
      const video = {
        id: '1',
        title: 'Test Video',
        filePath: '/path/to/video.mp4',
        fileSize: 1024 * 1024,
        duration: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        viewCount: 0,
        playbackProgress: 0,
        quality: 'high' as const
      };

      useVideoStore.setState({ videos: [video], currentVideo: video });

      useVideoStore.getState().removeVideo('1');

      expect(useVideoStore.getState().videos).toHaveLength(0);
      expect(useVideoStore.getState().currentVideo).toBeNull();
    });
  });

  describe('getFilteredVideos', () => {
    it('应该根据搜索查询过滤视频', () => {
      const videos = [
        {
          id: '1',
          title: 'React Native Tutorial',
          filePath: '/path/to/video1.mp4',
          fileSize: 1024 * 1024,
          duration: 120,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['react', 'native'],
          viewCount: 0,
          playbackProgress: 0,
          quality: 'high' as const
        },
        {
          id: '2',
          title: 'Vue.js Guide',
          filePath: '/path/to/video2.mp4',
          fileSize: 2 * 1024 * 1024,
          duration: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['vue', 'javascript'],
          viewCount: 0,
          playbackProgress: 0,
          quality: 'high' as const
        }
      ];

      useVideoStore.setState({ videos });

      useVideoStore.getState().setSearchQuery('react');

      const filteredVideos = useVideoStore.getState().getFilteredVideos();

      expect(filteredVideos).toHaveLength(1);
      expect(filteredVideos[0].title).toBe('React Native Tutorial');
    });

    it('应该根据分类过滤视频', () => {
      const videos = [
        {
          id: '1',
          title: 'React Native Tutorial',
          filePath: '/path/to/video1.mp4',
          fileSize: 1024 * 1024,
          duration: 120,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['react', 'native'],
          category: 'tutorials',
          viewCount: 0,
          playbackProgress: 0,
          quality: 'high' as const
        },
        {
          id: '2',
          title: 'Vue.js Guide',
          filePath: '/path/to/video2.mp4',
          fileSize: 2 * 1024 * 1024,
          duration: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['vue', 'javascript'],
          category: 'guides',
          viewCount: 0,
          playbackProgress: 0,
          quality: 'high' as const
        }
      ];

      useVideoStore.setState({ videos });

      useVideoStore.getState().setSelectedCategory('tutorials');

      const filteredVideos = useVideoStore.getState().getFilteredVideos();

      expect(filteredVideos).toHaveLength(1);
      expect(filteredVideos[0].category).toBe('tutorials');
    });
  });
});
```

## 7. 总结

状态管理模块提供了完整的状态管理解决方案，包括：

1. **核心状态**: 视频状态、播放状态、设置状态、播放列表状态
2. **持久化**: MMKV + Zustand persist 实现数据持久化
3. **事件系统**: 事件总线实现组件间通信
4. **状态同步**: 自动同步机制确保数据一致性
5. **选择器**: 高效的状态选择器工具
6. **类型安全**: TypeScript 提供完整的类型支持

该模块设计考虑了性能、可维护性和扩展性，为整个应用提供了可靠的状态管理基础。