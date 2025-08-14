# 状态管理模块 PRD 文档

## 1. 功能概述

### 1.1 模块简介

状态管理模块是本地视频播放应用的核心数据管理层，负责应用内所有状态的统一管理、持久化和同步。该模块基于 Zustand 状态管理库构建，提供高效、轻量级的状态管理解决方案。

### 1.2 业务价值

- **数据一致性**: 确保应用内数据的一致性和同步
- **性能优化**: 通过状态选择器优化渲染性能
- **开发效率**: 简化状态管理逻辑，提高开发效率
- **用户体验**: 通过状态持久化提供连贯的用户体验

### 1.3 目标用户

- **主要用户**: 应用开发者
- **使用场景**: 应用状态管理、数据持久化、跨组件通信

## 2. 功能需求

### 2.1 核心状态管理

#### 2.1.1 视频状态管理

**功能描述**: 管理视频相关的状态数据

**详细功能**:

- **视频列表**: 管理所有视频的列表数据
- **当前视频**: 管理当前播放的视频信息
- **播放状态**: 管理视频播放状态（播放、暂停、加载等）
- **收藏状态**: 管理用户收藏的视频列表
- **观看历史**: 管理用户的观看历史记录
- **播放进度**: 管理每个视频的观看进度

**技术要求**:

- 使用 Zustand 进行状态管理
- 支持状态选择器优化渲染
- 状态变更响应时间 < 50ms
- 支持状态订阅和取消订阅

**验收标准**:

- [ ] 状态管理功能完整可用
- [ ] 状态变更响应及时
- [ ] 状态选择器优化有效
- [ ] 状态订阅机制正常

#### 2.1.2 用户设置状态管理

**功能描述**: 管理用户设置和偏好

**详细功能**:

- **界面设置**: 主题、字体大小、界面缩放等设置
- **播放设置**: 默认播放速度、音量、画质等设置
- **隐私设置**: 数据收集、隐私保护等设置
- **通知设置**: 推送通知、提醒等设置
- **缓存设置**: 缓存大小、清理策略等设置
- **开发者设置**: 调试模式、日志级别等设置

**技术要求**:

- 设置变更实时生效
- 支持设置导入导出
- 设置数据加密存储
- 设置变更事件通知

**验收标准**:

- [ ] 用户设置功能完整
- [ ] 设置变更及时生效
- [ ] 设置数据安全存储
- [ ] 设置导入导出正常

#### 2.1.3 播放队列状态管理

**功能描述**: 管理播放队列和播放列表

**详细功能**:

- **播放队列**: 管理当前播放队列
- **播放历史**: 管理播放历史记录
- **播放列表**: 管理用户创建的播放列表
- **队列操作**: 添加、删除、排序播放队列
- **循环模式**: 管理播放循环模式
- **随机播放**: 管理随机播放状态

**技术要求**:

- 队列操作响应时间 < 100ms
- 支持大规模播放列表（1000+ 视频）
- 队列状态持久化
- 队列操作可撤销

**验收标准**:

- [ ] 播放队列管理功能完整
- [ ] 队列操作响应及时
- [ ] 队列状态持久化正常
- [ ] 大规模队列性能良好

### 2.2 状态持久化

#### 2.2.1 本地存储

**功能描述**: 实现状态的本地持久化存储

**详细功能**:

- **自动保存**: 状态变更自动保存到本地
- **增量更新**: 只保存变更的状态数据
- **数据压缩**: 对存储数据进行压缩优化
- **存储配额**: 管理本地存储空间使用
- **数据备份**: 支持状态数据备份
- **数据恢复**: 支持状态数据恢复

**技术要求**:

- 使用 AsyncStorage 进行本地存储
- 存储操作异步处理
- 存储性能优化
- 存储空间管理

**验收标准**:

- [ ] 状态持久化功能正常
- [ ] 存储性能良好
- [ ] 存储空间管理合理
- [ ] 数据备份恢复正常

#### 2.2.2 数据同步

**功能描述**: 实现状态数据的同步机制

**详细功能**:

- **实时同步**: 状态变更实时同步
- **冲突解决**: 解决状态同步冲突
- **离线支持**: 离线状态下的数据管理
- **网络恢复**: 网络恢复后的数据同步
- **同步策略**: 可配置的同步策略
- **同步监控**: 监控同步状态和进度

**技术要求**:

- 同步机制高效可靠
- 冲突解决算法合理
- 离线支持完整
- 网络恢复自动同步

**验收标准**:

- [ ] 数据同步功能完整
- [ ] 冲突解决合理
- [ ] 离线支持正常
- [ ] 网络恢复自动同步

### 2.3 状态监控

#### 2.3.1 状态监控

**功能描述**: 监控状态变更和性能

**详细功能**:

- **状态变更监听**: 监听状态变更事件
- **性能监控**: 监控状态管理性能
- **错误监控**: 监控状态管理错误
- **内存监控**: 监控状态管理内存使用
- **调试工具**: 提供状态调试工具
- **性能报告**: 生成性能监控报告

**技术要求**:

- 监控机制高效
- 性能数据准确
- 错误信息详细
- 调试工具完善

**验收标准**:

- [ ] 状态监控功能完整
- [ ] 性能监控准确
- [ ] 错误监控有效
- [ ] 调试工具完善

#### 2.3.2 状态调试

**功能描述**: 提供状态调试和开发工具

**详细功能**:

- **状态查看**: 查看当前状态数据
- **状态修改**: 修改状态数据进行调试
- **状态历史**: 查看状态变更历史
- **状态回放**: 回放状态变更过程
- **性能分析**: 分析状态管理性能
- **错误追踪**: 追踪状态管理错误

**技术要求**:

- 调试工具易用
- 状态历史完整
- 性能分析准确
- 错误追踪详细

**验收标准**:

- [ ] 状态调试工具完善
- [ ] 状态历史记录完整
- [ ] 性能分析准确
- [ ] 错误追踪详细

## 3. 技术规格

### 3.1 系统架构

#### 3.1.1 状态管理架构

```
StateManagementModule/
├── Stores/
│   ├── VideoStore.ts             # 视频状态管理
│   ├── PlaybackStore.ts          # 播放状态管理
│   ├── QueueStore.ts              # 队列状态管理
│   ├── SettingsStore.ts           # 设置状态管理
│   ├── UIStore.ts                 # 界面状态管理
│   └── UserStore.ts               # 用户状态管理
├── Middleware/
│   ├── PersistMiddleware.ts       # 持久化中间件
│   ├── LoggerMiddleware.ts        # 日志中间件
│   ├── SyncMiddleware.ts          # 同步中间件
│   └── DevToolsMiddleware.ts      # 开发工具中间件
├── Utils/
│   ├── StateUtils.ts             # 状态工具函数
│   ├── PersistUtils.ts           # 持久化工具
│   ├── SyncUtils.ts              # 同步工具
│   └── DebugUtils.ts             # 调试工具
├── Types/
│   ├── StateTypes.ts             # 状态类型定义
│   ├── StoreTypes.ts             # Store 类型定义
│   └── MiddlewareTypes.ts         # 中间件类型定义
└── Hooks/
    ├── useVideoStore.ts          # 视频 Store Hook
    ├── usePlaybackStore.ts       # 播放 Store Hook
    ├── useQueueStore.ts          # 队列 Store Hook
    └── useSettingsStore.ts        # 设置 Store Hook
```

#### 3.1.2 数据流设计

```
用户操作 → 组件 → Store → 中间件 → 持久化/同步
    ↑                                      ↓
    └────────── 状态更新 ← 中间件处理 ←───────┘
```

### 3.2 接口设计

#### 3.2.1 Store 接口

```typescript
interface BaseStore<T> {
  // 状态访问
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

  // 状态订阅
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;

  // 状态选择器
  select: <U>(selector: (state: T) => U) => U;

  // 状态重置
  reset: () => void;

  // 状态销毁
  destroy: () => void;
}

interface VideoStore extends BaseStore<VideoState> {
  // 视频管理
  addVideo: (video: Video) => void;
  removeVideo: (videoId: string) => void;
  updateVideo: (videoId: string, updates: Partial<Video>) => void;

  // 播放控制
  setCurrentVideo: (video: Video | null) => void;
  playVideo: (videoId: string) => void;
  pauseVideo: () => void;

  // 收藏管理
  toggleFavorite: (videoId: string) => void;
  addToFavorites: (videoId: string) => void;
  removeFromFavorites: (videoId: string) => void;

  // 搜索和过滤
  setSearchQuery: (query: string) => void;
  setFilter: (filter: VideoFilter) => void;
  clearFilters: () => void;
}
```

#### 3.2.2 中间件接口

```typescript
interface StoreMiddleware<T> {
  (store: BaseStore<T>): BaseStore<T>;
}

interface PersistMiddlewareConfig {
  name: string;
  storage: AsyncStorage;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => void;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
}

interface LoggerMiddlewareConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  predicate?: (state: any, action: string) => boolean;
}

interface SyncMiddlewareConfig {
  enabled: boolean;
  syncInterval: number;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}
```

#### 3.2.3 持久化接口

```typescript
interface PersistenceService {
  // 基础操作
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;

  // 批量操作
  getItems<T>(keys: string[]): Promise<Record<string, T>>;
  setItems<T>(items: Record<string, T>): Promise<void>;

  // 存储信息
  getStorageInfo(): Promise<{
    used: number;
    total: number;
    available: number;
  }>;

  // 数据清理
  clearOldItems(maxAge: number): Promise<number>;
  clearCache(): Promise<void>;
}
```

### 3.3 数据模型

#### 3.3.1 视频状态模型

```typescript
interface VideoState {
  // 视频数据
  videos: Video[];
  currentVideo: Video | null;

  // 播放状态
  playbackState: PlaybackState;

  // 收藏管理
  favorites: Set<string>;

  // 搜索和过滤
  searchQuery: string;
  currentFilter: VideoFilter;

  // 观看历史
  watchHistory: WatchHistory[];

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // 分页
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

interface VideoFilter {
  category?: string;
  tags?: string[];
  duration?: { min: number; max: number };
  size?: { min: number; max: number };
  isFavorite?: boolean;
  isWatched?: boolean;
  sortBy?: 'created_at' | 'title' | 'duration' | 'size';
  sortOrder?: 'asc' | 'desc';
}
```

#### 3.3.2 播放状态模型

```typescript
interface PlaybackState {
  // 基础状态
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;

  // 位置信息
  position: number;
  duration: number;
  bufferedPosition: number;

  // 播放设置
  volume: number;
  playbackRate: number;
  isLooping: boolean;
  isMuted: boolean;

  // 播放队列
  queue: Video[];
  currentQueueIndex: number;
  repeatMode: 'none' | 'single' | 'all';
  shuffleMode: boolean;

  // 错误状态
  error: string | null;
  errorCode: string | null;
}
```

#### 3.3.3 设置状态模型

```typescript
interface SettingsState {
  // 界面设置
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';

  // 播放设置
  defaultPlaybackSpeed: number;
  defaultVolume: number;
  defaultQuality: 'auto' | 'low' | 'medium' | 'high';
  autoPlay: boolean;
  autoNext: boolean;

  // 缓存设置
  maxCacheSize: number;
  cacheRetentionDays: number;
  autoClearCache: boolean;

  // 隐私设置
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;

  // 开发者设置
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  // 加载状态
  isLoading: boolean;
  error: string | null;
}
```

### 3.4 性能要求

#### 3.4.1 状态管理性能

- **状态更新**: 状态更新响应时间 < 50ms
- **选择器优化**: 选择器计算时间 < 10ms
- **内存使用**: 状态管理内存使用 < 20MB
- **持久化性能**: 状态保存时间 < 100ms

#### 3.4.2 同步性能

- **同步速度**: 状态同步响应时间 < 200ms
- **冲突解决**: 冲突解决时间 < 100ms
- **离线操作**: 离线操作响应时间 < 50ms
- **网络恢复**: 网络恢复同步时间 < 1s

### 3.5 可靠性要求

#### 3.5.1 数据完整性

- **数据一致性**: 确保状态数据的一致性
- **数据完整性**: 确保状态数据的完整性
- **数据恢复**: 支持状态数据的恢复
- **数据备份**: 支持状态数据的备份

#### 3.5.2 错误处理

- **错误恢复**: 状态管理错误的恢复机制
- **错误重试**: 状态操作的自动重试机制
- **错误日志**: 状态管理错误的详细日志
- **错误通知**: 状态管理错误的用户通知

## 4. 实现方案

### 4.1 状态管理实现

#### 4.1.1 Store 实现

```typescript
// 使用 Zustand 创建 Store
const createVideoStore = () => create<VideoState>()(
  persist(
    (set, get) => ({
      videos: [],
      currentVideo: null,
      playbackState: {
        isPlaying: false,
        position: 0,
        duration: 0,
        volume: 1.0,
        playbackRate: 1.0,
        isLooping: false,
        isMuted: false,
      },
      favorites: new Set(),
      searchQuery: '',
      currentFilter: {},
      watchHistory: [],
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: true,
      },

      // Actions
      addVideo: (video) => set((state) => ({
        videos: [...state.videos, video]
      })),

      removeVideo: (videoId) => set((state) => ({
        videos: state.videos.filter(v => v.id !== videoId)
      })),

      setCurrentVideo: (video) => set({ currentVideo: video }),

      toggleFavorite: (videoId) => set((state) => {
        const newFavorites = new Set(state.favorites);
        if (newFavorites.has(videoId)) {
          newFavorites.delete(videoId);
        } else {
          newFavorites.add(videoId);
        }
        return { favorites: newFavorites };
      }),
    }),
    {
      name: 'video-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favorites: Array.from(state.favorites),
        searchQuery: state.searchQuery,
      }),
    }
  )
);
```

#### 4.1.2 中间件实现

```typescript
// 日志中间件
const loggerMiddleware = (config: LoggerMiddlewareConfig) =>
  (store: BaseStore<any>) =>
  (next: (state: any) => void) =>
  (action: any) => {
    if (!config.enabled) return next(action);

    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();

    if (config.predicate?.(prevState, action) ?? true) {
      console.log(`[${config.level.toUpperCase()}] State Update:`, {
        action,
        prevState,
        nextState,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  };

// 同步中间件
const syncMiddleware = (config: SyncMiddlewareConfig) =>
  (store: BaseStore<any>) =>
  (next: (state: any) => void) =>
  (action: any) => {
    const result = next(action);

    if (config.enabled) {
      config.onSyncStart?.();

      // 异步同步状态
      syncState(store.getState())
        .then(() => config.onSyncComplete?.())
        .catch((error) => config.onSyncError?.(error));
    }

    return result;
  };
```

### 4.2 状态选择器实现

#### 4.2.1 基础选择器

```typescript
// 使用选择器优化渲染
const useCurrentVideo = () => useVideoStore((state) => state.currentVideo);
const useIsPlaying = () => useVideoStore((state) => state.playbackState.isPlaying);
const useFavoriteVideos = () => useVideoStore((state) =>
  state.videos.filter(video => state.favorites.has(video.id))
);

// 复杂选择器
const useFilteredVideos = () => useVideoStore((state) => {
  const { videos, searchQuery, currentFilter } = state;

  return videos.filter(video => {
    const matchesSearch = !searchQuery ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = Object.entries(currentFilter).every(([key, value]) => {
      if (value === undefined || value === null) return true;
      return video[key as keyof Video] === value;
    });

    return matchesSearch && matchesFilter;
  });
});
```

#### 4.2.2 记忆化选择器

```typescript
// 使用记忆化优化选择器性能
const useMemoizedVideoStats = () => {
  const videos = useVideoStore((state) => state.videos);
  const favorites = useVideoStore((state) => state.favorites);

  return useMemo(() => {
    const totalVideos = videos.length;
    const totalDuration = videos.reduce((sum, video) => sum + video.duration, 0);
    const totalSize = videos.reduce((sum, video) => sum + video.fileSize, 0);
    const favoriteCount = favorites.size;

    return {
      totalVideos,
      totalDuration,
      totalSize,
      favoriteCount,
    };
  }, [videos, favorites]);
};
```

## 5. 测试计划

### 5.1 单元测试

- Store 功能测试
- 中间件功能测试
- 选择器功能测试
- 持久化功能测试

### 5.2 集成测试

- 状态与 UI 集成测试
- 状态与数据库集成测试
- 状态同步集成测试
- 状态恢复集成测试

### 5.3 性能测试

- 状态更新性能测试
- 选择器性能测试
- 持久化性能测试
- 同步性能测试

### 5.4 可靠性测试

- 数据完整性测试
- 错误恢复测试
- 并发访问测试
- 数据备份恢复测试

## 6. 风险评估

### 6.1 技术风险

- **性能问题**: 复杂状态可能导致性能问题
- **内存泄漏**: 状态管理可能出现内存泄漏
- **数据丢失**: 持久化失败可能导致数据丢失
- **同步冲突**: 状态同步可能出现冲突

### 6.2 业务风险

- **开发复杂性**: 状态管理逻辑复杂
- **维护成本**: 状态管理维护成本高
- **调试困难**: 状态调试困难
- **测试复杂性**: 状态测试复杂

### 6.3 风险缓解措施

- 实现性能监控和优化
- 使用内存管理工具
- 实现数据备份机制
- 实现冲突解决算法

## 7. 成功标准

### 7.1 功能标准

- [ ] 状态管理功能完整可用
- [ ] 状态持久化功能正常
- [ ] 状态同步功能正常
- [ ] 状态监控功能完整

### 7.2 性能标准

- [ ] 状态更新响应时间 < 50ms
- [ ] 选择器计算时间 < 10ms
- [ ] 持久化保存时间 < 100ms
- [ ] 同步响应时间 < 200ms

### 7.3 可靠性标准

- [ ] 数据完整性保证
- [ ] 错误恢复机制有效
- [ ] 并发访问稳定性
- [ ] 数据备份恢复正常

## 8. 附录

### 8.1 术语表

- **State**: 应用状态数据
- **Store**: 状态管理容器
- **Middleware**: 中间件
- **Selector**: 状态选择器
- **Persistence**: 持久化

### 8.2 参考资料

- [Zustand 文档](https://github.com/pmndrs/zustand)
- [React 状态管理最佳实践](https://react.dev/learn/state-management)
- [AsyncStorage 文档](https://react-native-async-storage.github.io/async-storage/)

### 8.3 相关工具

- **状态管理**: Zustand
- **持久化**: AsyncStorage
- **调试工具**: Redux DevTools
- **性能监控**: React DevTools

---

**文档版本**: 1.0
**创建日期**: 2025-08-10
**最后更新**: 2025-08-10
**负责人**: 蜂群思维系统
**状态**: 草案
