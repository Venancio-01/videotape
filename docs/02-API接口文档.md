# API 接口文档

## 1. 概述

本文档定义了本地视频播放应用的核心 API 接口，包括视频管理、播放控制、状态管理等模块的接口规范。

### 1.1 技术栈
- **状态管理**: Zustand + TypeScript
- **数据库**: Drizzle ORM + SQLite
- **文件操作**: Expo File System
- **视频播放**: Expo AV

### 1.2 接口设计原则
- 类型安全：使用 TypeScript 确保接口类型安全
- 一致性：统一的错误处理和响应格式
- 可扩展：支持未来功能扩展
- 性能：异步操作和错误恢复机制

## 2. 数据类型定义

### 2.1 基础类型

```typescript
// 视频信息
interface Video {
  id: string;
  title: string;
  filePath: string;
  thumbnailPath?: string;
  duration: number; // 毫秒
  fileSize: number; // 字节
  format: string;
  resolution: {
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: string;
  watchProgress: number; // 秒
  isFavorite: boolean;
  playCount: number;
}

// 播放状态
interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  position: number; // 当前播放位置（秒）
  duration: number; // 总时长（秒）
  volume: number; // 0-1
  playbackRate: number; // 播放速度
  isLooping: boolean;
  error: string | null;
}

// 用户设置
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultPlaybackSpeed: number;
  defaultVolume: number;
  autoPlay: boolean;
  loopMode: 'none' | 'single' | 'all';
  showControls: boolean;
  enableGestures: boolean;
  enableHaptics: boolean;
}

// 播放列表
interface Playlist {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

// 观看记录
interface WatchHistory {
  id: string;
  videoId: string;
  position: number;
  duration: number;
  watchedAt: Date;
  completed: boolean;
  watchTime: number; // 观看时长（秒）
}
```

### 2.2 请求/响应类型

```typescript
// API 响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// 分页响应
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 文件上传进度
interface UploadProgress {
  id: string;
  fileName: string;
  progress: number; // 0-100
  speed: number; // KB/s
  loaded: number; // 已上传字节数
  total: number; // 总字节数
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}
```

## 3. 视频管理 API

### 3.1 视频文件操作

#### 上传视频文件
```typescript
interface UploadVideoOptions {
  files: FileList | File[];
  onProgress?: (progress: UploadProgress) => void;
  onCompleted?: (videos: Video[]) => void;
  onError?: (error: Error) => void;
}

interface VideoUploadService {
  uploadVideos(options: UploadVideoOptions): Promise<void>;
  cancelUpload(uploadId: string): Promise<void>;
  getUploadStatus(uploadId: string): Promise<UploadProgress>;
}
```

#### 扫描视频文件
```typescript
interface ScanOptions {
  directories: string[];
  recursive?: boolean;
  includeSubfolders?: boolean;
  fileTypes?: string[];
}

interface VideoScannerService {
  scanVideos(options: ScanOptions): Promise<Video[]>;
  getScanProgress(): Promise<{ processed: number; total: number }>;
  cancelScan(): Promise<void>;
}
```

#### 删除视频文件
```typescript
interface VideoDeleteService {
  deleteVideo(videoId: string): Promise<boolean>;
  deleteMultipleVideos(videoIds: string[]): Promise<number>;
  moveToTrash(videoId: string): Promise<boolean>;
  restoreFromTrash(videoId: string): Promise<boolean>;
  emptyTrash(): Promise<boolean>;
}
```

### 3.2 视频信息管理

#### 获取视频信息
```typescript
interface VideoInfoService {
  getVideoById(videoId: string): Promise<Video | null>;
  getVideosByIds(videoIds: string[]): Promise<Video[]>;
  getAllVideos(): Promise<Video[]>;
  getVideosByCategory(category: string): Promise<Video[]>;
  searchVideos(query: string): Promise<Video[]>;
  getFavoriteVideos(): Promise<Video[]>;
  getRecentVideos(limit?: number): Promise<Video[]>;
}
```

#### 更新视频信息
```typescript
interface UpdateVideoOptions {
  title?: string;
  category?: string;
  tags?: string[];
  thumbnailPath?: string;
}

interface VideoUpdateService {
  updateVideo(videoId: string, options: UpdateVideoOptions): Promise<Video>;
  updateVideoMetadata(videoId: string): Promise<Video>;
  generateThumbnail(videoId: string): Promise<string>;
  addToFavorites(videoId: string): Promise<boolean>;
  removeFromFavorites(videoId: string): Promise<boolean>;
}
```

## 4. 播放控制 API

### 4.1 播放器控制

#### 基础播放控制
```typescript
interface PlaybackService {
  // 播放控制
  play(videoId: string): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  
  // 位置控制
  seekTo(position: number): Promise<void>;
  seekForward(seconds: number): Promise<void>;
  seekBackward(seconds: number): Promise<void>;
  
  // 音量控制
  setVolume(volume: number): Promise<void>;
  getVolume(): Promise<number>;
  
  // 播放速度控制
  setPlaybackRate(rate: number): Promise<void>;
  getPlaybackRate(): Promise<number>;
  
  // 循环控制
  setLooping(enabled: boolean): Promise<void>;
  getLooping(): Promise<boolean>;
}
```

#### 播放状态监听
```typescript
interface PlaybackEvent {
  type: 'play' | 'pause' | 'stop' | 'seek' | 'complete' | 'error';
  videoId: string;
  position: number;
  duration: number;
  timestamp: Date;
}

interface PlaybackListener {
  onPlaybackStateChange(callback: (state: PlaybackState) => void): () => void;
  onPlaybackEvent(callback: (event: PlaybackEvent) => void): () => void;
  onProgress(callback: (progress: { position: number; duration: number }) => void): () => void;
}
```

### 4.2 播放列表管理

#### 播放列表操作
```typescript
interface PlaylistService {
  // 播放列表管理
  createPlaylist(name: string, description?: string): Promise<Playlist>;
  deletePlaylist(playlistId: string): Promise<boolean>;
  updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<Playlist>;
  
  // 视频添加/移除
  addToPlaylist(playlistId: string, videoId: string): Promise<boolean>;
  removeFromPlaylist(playlistId: string, videoId: string): Promise<boolean>;
  reorderPlaylist(playlistId: string, fromIndex: number, toIndex: number): Promise<boolean>;
  
  // 播放列表查询
  getPlaylists(): Promise<Playlist[]>;
  getPlaylistById(playlistId: string): Promise<Playlist | null>;
  getPlaylistVideos(playlistId: string): Promise<Video[]>;
}
```

#### 队列控制
```typescript
interface QueueService {
  // 队列管理
  addToQueue(videoId: string): Promise<void>;
  addToQueueNext(videoId: string): Promise<void>;
  removeFromQueue(videoId: string): Promise<void>;
  clearQueue(): Promise<void>;
  
  // 队列查询
  getQueue(): Promise<Video[]>;
  getCurrentQueueIndex(): Promise<number>;
  getNextVideo(): Promise<Video | null>;
  getPreviousVideo(): Promise<Video | null>;
  
  // 队列控制
  playNext(): Promise<void>;
  playPrevious(): Promise<void>;
  shuffleQueue(): Promise<void>;
  repeatQueue(mode: 'off' | 'one' | 'all'): Promise<void>;
}
```

## 5. 状态管理 API

### 5.1 Zustand Store 接口

#### 视频状态 Store
```typescript
interface VideoStore {
  // 状态
  videos: Video[];
  currentVideo: Video | null;
  playbackState: PlaybackState;
  favorites: Set<string>;
  watchHistory: WatchHistory[];
  searchQuery: string;
  currentCategory: string;
  
  // Actions
  // 视频管理
  addVideo: (video: Video) => void;
  removeVideo: (videoId: string) => void;
  updateVideo: (videoId: string, updates: Partial<Video>) => void;
  setCurrentVideo: (video: Video | null) => void;
  
  // 播放控制
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  playVideo: (videoId: string) => void;
  pauseVideo: () => void;
  updateProgress: (position: number) => void;
  
  // 收藏管理
  toggleFavorite: (videoId: string) => void;
  addToFavorites: (videoId: string) => void;
  removeFromFavorites: (videoId: string) => void;
  
  // 搜索和过滤
  setSearchQuery: (query: string) => void;
  setCurrentCategory: (category: string) => void;
  clearFilters: () => void;
  
  // 数据持久化
  loadPersistedData: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}
```

#### 用户设置 Store
```typescript
interface SettingsStore {
  // 状态
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
  
  // 主题管理
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  getEffectiveTheme: () => 'light' | 'dark';
}
```

### 5.2 数据持久化

#### 存储接口
```typescript
interface StorageService {
  // 基础存储操作
  setItem<T>(key: string, value: T): Promise<void>;
  getItem<T>(key: string): Promise<T | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // 批量操作
  setItems(items: Record<string, any>): Promise<void>;
  getItems(keys: string[]): Promise<Record<string, any>>;
  
  // 存储统计
  getStorageInfo(): Promise<{
    used: number;
    total: number;
    available: number;
  }>;
  
  // 数据清理
  clearCache(): Promise<void>;
  clearOldData(maxAge: number): Promise<number>;
}
```

## 6. 数据库 API

### 6.1 数据库操作接口

#### 查询操作
```typescript
interface DatabaseService {
  // 视频查询
  findVideoById(id: string): Promise<Video | null>;
  findAllVideos(): Promise<Video[]>;
  findVideosByCategory(category: string): Promise<Video[]>;
  searchVideos(query: string): Promise<Video[]>;
  findFavoriteVideos(): Promise<Video[]>;
  
  // 分页查询
  getVideosPaginated(
    page: number,
    pageSize: number,
    options?: {
      category?: string;
      sortBy?: 'createdAt' | 'title' | 'duration';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<Video>>;
  
  // 统计查询
  getVideoStats(): Promise<{
    totalVideos: number;
    totalDuration: number;
    totalSize: number;
    categoriesCount: Record<string, number>;
  }>;
}
```

#### 写入操作
```typescript
interface DatabaseWriteService {
  // 视频写入
  insertVideo(video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video>;
  deleteVideo(id: string): Promise<boolean>;
  batchInsertVideos(videos: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Video[]>;
  
  // 观看历史
  addWatchHistory(record: Omit<WatchHistory, 'id' | 'watchedAt'>): Promise<WatchHistory>;
  updateWatchProgress(videoId: string, position: number): Promise<void>;
  getWatchHistory(videoId: string): Promise<WatchHistory[]>;
  
  // 事务操作
  transaction<T>(operation: () => Promise<T>): Promise<T>;
  backupDatabase(): Promise<string>;
  restoreDatabase(backupPath: string): Promise<boolean>;
}
```

### 6.2 数据库迁移

#### 迁移接口
```typescript
interface MigrationService {
  getCurrentVersion(): Promise<number>;
  runMigrations(): Promise<void>;
  rollbackToVersion(version: number): Promise<void>;
  getMigrationHistory(): Promise<Array<{
    version: number;
    name: string;
    appliedAt: Date;
    description: string;
  }>>;
}
```

## 7. 文件系统 API

### 7.1 文件操作

#### 文件管理
```typescript
interface FileSystemService {
  // 文件信息
  getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size: number;
    lastModified: Date;
    isDirectory: boolean;
  }>;
  
  // 文件操作
  copyFile(source: string, destination: string): Promise<void>;
  moveFile(source: string, destination: string): Promise<void>;
  deleteFile(filePath: string): Promise<boolean>;
  fileExists(filePath: string): Promise<boolean>;
  
  // 目录操作
  createDirectory(path: string): Promise<void>;
  readDirectory(path: string): Promise<string[]>;
  deleteDirectory(path: string, recursive?: boolean): Promise<boolean>;
  
  // 存储空间
  getFreeDiskSpace(): Promise<number>;
  getTotalDiskSpace(): Promise<number>;
}
```

### 7.2 媒体文件处理

#### 视频文件处理
```typescript
interface MediaService {
  // 视频信息提取
  extractVideoMetadata(filePath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    format: string;
    bitrate: number;
    codec: string;
  }>;
  
  // 缩略图生成
  generateThumbnail(
    videoPath: string,
    options?: {
      time?: number;
      width?: number;
      height?: number;
      quality?: number;
    }
  ): Promise<string>;
  
  // 视频格式转换
  convertVideo(
    inputPath: string,
    outputPath: string,
    options?: {
      format?: string;
      quality?: string;
      resolution?: { width: number; height: number };
    }
  ): Promise<void>;
}
```

## 8. 错误处理 API

### 8.1 错误类型

```typescript
// 错误码定义
enum ErrorCode {
  // 文件错误
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  INSUFFICIENT_STORAGE = 'INSUFFICIENT_STORAGE',
  
  // 视频播放错误
  VIDEO_LOAD_FAILED = 'VIDEO_LOAD_FAILED',
  VIDEO_PLAYBACK_ERROR = 'VIDEO_PLAYBACK_ERROR',
  VIDEO_FORMAT_UNSUPPORTED = 'VIDEO_FORMAT_UNSUPPORTED',
  
  // 数据库错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // 权限错误
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
}

// 应用错误类
class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### 8.2 错误处理服务

#### 错误处理
```typescript
interface ErrorService {
  // 错误报告
  reportError(error: Error, context?: any): Promise<void>;
  reportErrorManually(
    title: string,
    description: string,
    stack?: string
  ): Promise<void>;
  
  // 错误日志
  getErrorLogs(limit?: number): Promise<Array<{
    id: string;
    error: string;
    timestamp: Date;
    context: any;
  }>>;
  clearErrorLogs(): Promise<void>;
  
  // 错误恢复
  canRecoverFromError(error: AppError): boolean;
  getRecoveryActions(error: AppError): Array<{
    label: string;
    action: () => Promise<void>;
  }>;
}
```

## 9. 性能监控 API

### 9.1 性能指标

#### 性能数据收集
```typescript
interface PerformanceMetrics {
  // 应用性能
  startupTime: number;
  memoryUsage: {
    used: number;
    peak: number;
    limit: number;
  };
  cpuUsage: number;
  
  // 视频性能
  videoLoadTime: number;
  playbackStutterCount: number;
  averageFrameRate: number;
  bufferingTime: number;
  
  // 文件操作性能
  fileReadSpeed: number;
  fileWriteSpeed: number;
  databaseQueryTime: number;
}

interface PerformanceService {
  // 性能数据收集
  recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
  getMetrics(timeRange: { start: Date; end: Date }): Promise<PerformanceMetrics>;
  
  // 性能分析
  analyzePerformance(): Promise<{
    bottlenecks: Array<{
      component: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      suggestions: string[];
    }>;
    recommendations: string[];
  }>;
  
  // 性能报告
  generatePerformanceReport(): Promise<string>;
  exportMetrics(format: 'json' | 'csv'): Promise<string>;
}
```

## 10. 使用示例

### 10.1 基本使用

```typescript
// 初始化服务
const videoService = new VideoService();
const playbackService = new PlaybackService();
const dbService = new DatabaseService();

// 上传视频
async function uploadVideo() {
  const files = await pickVideoFiles();
  const result = await videoService.uploadVideos({
    files,
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress.progress}%`);
    },
    onCompleted: (videos) => {
      console.log('Videos uploaded:', videos);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });
}

// 播放视频
async function playVideo(videoId: string) {
  try {
    await playbackService.play(videoId);
    const state = await playbackService.getPlaybackState();
    console.log('Playing video:', state.currentVideo?.title);
  } catch (error) {
    console.error('Failed to play video:', error);
  }
}

// 搜索视频
async function searchVideos(query: string) {
  const videos = await videoService.searchVideos(query);
  return videos.filter(video => 
    video.title.toLowerCase().includes(query.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );
}
```

### 10.2 高级使用

```typescript
// 批量操作
async function batchVideoOperations() {
  // 批量导入
  const videos = await videoService.scanVideos({
    directories: ['/Videos', '/Downloads'],
    recursive: true,
  });
  
  // 批量添加到播放列表
  const playlist = await playlistService.createPlaylist('My Videos');
  await Promise.all(
    videos.map(video => 
      playlistService.addToPlaylist(playlist.id, video.id)
    )
  );
  
  // 批量更新元数据
  await dbService.transaction(async () => {
    for (const video of videos) {
      await videoService.updateVideoMetadata(video.id);
    }
  });
}

// 播放列表管理
async function managePlaylist() {
  const playlist = await playlistService.createPlaylist('Study Playlist', {
    description: 'Videos for learning',
  });
  
  // 添加视频
  await playlistService.addToPlaylist(playlist.id, 'video-1');
  await playlistService.addToPlaylist(playlist.id, 'video-2');
  
  // 重新排序
  await playlistService.reorderPlaylist(playlist.id, 0, 1);
  
  // 获取播放列表视频
  const videos = await playlistService.getPlaylistVideos(playlist.id);
  return videos;
}
```

---

**文档版本**: 1.0  
**创建日期**: 2025-08-10  
**最后更新**: 2025-08-10