/**
 * 仓库接口定义
 * 基于 Repository Pattern 的数据访问层抽象
 */

// 查询器接口 - 代表任何可以被 useLiveQuery 执行的查询
export interface IQuerier<T> {
  toSQL(): { sql: string; params: any[] };
}

// 基础仓库接口
export interface IBaseRepository<T, ID = string> {
  // 查询方法 - 返回可被 useLiveQuery 订阅的查询对象
  getAllQuery(): IQuerier<T[]>;
  findByIdQuery(id: ID): IQuerier<T | undefined>;

  // 写操作方法 - 直接执行并返回 Promise
  create(data: Omit<T, "id">): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
}

// 视频仓库接口
export interface IVideoRepository extends IBaseRepository<Video, string> {
  // 高级查询方法
  searchVideosQuery(params: VideoSearchParams): IQuerier<SearchResult<Video>>;
  getVideosByCategoryQuery(category: string): IQuerier<Video[]>;
  getFavoriteVideosQuery(): IQuerier<Video[]>;
  getRecentVideosQuery(limit?: number): IQuerier<Video[]>;
  getRecommendedVideosQuery(limit?: number): IQuerier<Video[]>;

  // 关联查询
  getVideoWithRelationsQuery(
    id: string,
  ): IQuerier<VideoWithRelations | undefined>;
  getVideosByTagQuery(tag: string): IQuerier<Video[]>;

  // 批量操作
  batchCreate(videos: Omit<Video, "id">[]): Promise<Video[]>;
  updateWatchProgress(id: string, progress: number): Promise<void>;
  incrementPlayCount(id: string): Promise<void>;

  // 统计查询
  getVideoStatsQuery(): IQuerier<VideoStats>;
}

// 播放历史仓库接口
export interface IWatchHistoryRepository
  extends IBaseRepository<WatchHistory, string> {
  // 查询方法
  getVideoHistoryQuery(videoId: string): IQuerier<WatchHistory[]>;
  getUserHistoryQuery(limit?: number): IQuerier<WatchHistory[]>;
  getRecentHistoryQuery(limit?: number): IQuerier<WatchHistory[]>;

  // 特殊操作
  recordWatch(history: Omit<WatchHistory, "id">): Promise<WatchHistory>;
  updateProgress(id: string, position: number, duration: number): Promise<void>;
  markAsCompleted(id: string): Promise<void>;

  // 统计查询
  getUserStatsQuery(): IQuerier<UserStats>;
}

// 播放列表仓库接口
export interface IPlaylistRepository extends IBaseRepository<Playlist, string> {
  // 查询方法
  getPlaylistWithVideosQuery(
    playlistId: string,
  ): IQuerier<PlaylistWithVideos | undefined>;
  getAllPlaylistsQuery(): IQuerier<Playlist[]>;
  getPublicPlaylistsQuery(): IQuerier<Playlist[]>;

  // 视频管理
  addVideoToPlaylist(
    playlistId: string,
    videoId: string,
    options?: PlaylistVideoOptions,
  ): Promise<void>;
  removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<void>;
  reorderVideos(playlistId: string, videoIds: string[]): Promise<void>;

  // 播放列表统计
  updatePlaylistStats(playlistId: string): Promise<void>;
  incrementPlayCount(playlistId: string): Promise<void>;
}

// 标签仓库接口
export interface ITagRepository extends IBaseRepository<Tag, string> {
  // 查询方法
  getAllTagsQuery(): IQuerier<Tag[]>;
  getPopularTagsQuery(limit?: number): IQuerier<Tag[]>;
  getTagsByVideoQuery(videoId: string): IQuerier<Tag[]>;

  // 标签管理
  addTagToVideo(videoId: string, tagId: string): Promise<void>;
  removeTagFromVideo(videoId: string, tagId: string): Promise<void>;
  createTagIfNotExists(name: string, options?: TagOptions): Promise<Tag>;

  // 搜索建议
  getTagSuggestionsQuery(query: string): IQuerier<Tag[]>;
}

// 文件夹仓库接口
export interface IFolderRepository extends IBaseRepository<Folder, string> {
  // 查询方法
  getFolderWithContentsQuery(
    folderId: string,
  ): IQuerier<FolderWithVideos | undefined>;
  getRootFoldersQuery(): IQuerier<Folder[]>;
  getChildFoldersQuery(parentId: string): IQuerier<Folder[]>;

  // 文件夹操作
  addVideoToFolder(folderId: string, videoId: string): Promise<void>;
  removeVideoFromFolder(folderId: string, videoId: string): Promise<void>;
  moveFolder(folderId: string, newParentId: string | null): Promise<void>;

  // 统计更新
  updateFolderStats(folderId: string): Promise<void>;
}

// 书签仓库接口
export interface IBookmarkRepository extends IBaseRepository<Bookmark, string> {
  // 查询方法
  getVideoBookmarksQuery(videoId: string): IQuerier<Bookmark[]>;
  getAllBookmarksQuery(): IQuerier<Bookmark[]>;

  // 书签操作
  createBookmark(bookmark: Omit<Bookmark, "id">): Promise<Bookmark>;
  updatePosition(id: string, position: number): Promise<void>;

  // 批量操作
  importBookmarks(
    videoId: string,
    bookmarks: Omit<Bookmark, "id">[],
  ): Promise<Bookmark[]>;
}

// 设置仓库接口
export interface ISettingsRepository {
  // 查询方法
  getSettingsQuery(): IQuerier<Settings>;

  // 设置操作
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;
  resetToDefaults(): Promise<Settings>;

  // 特定设置
  getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]>;
  setSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ): Promise<void>;
}

// 搜索仓库接口
export interface ISearchRepository {
  // 搜索查询
  searchVideosQuery(
    query: string,
    options?: SearchOptions,
  ): IQuerier<SearchResult<Video>>;
  searchPlaylistsQuery(query: string): IQuerier<SearchResult<Playlist>>;
  searchFoldersQuery(query: string): IQuerier<SearchResult<Folder>>;

  // 全局搜索
  globalSearchQuery(
    query: string,
    options?: GlobalSearchOptions,
  ): IQuerier<GlobalSearchResult>;

  // 搜索建议
  getSearchSuggestionsQuery(query: string): IQuerier<SearchSuggestion[]>;

  // 索引管理
  updateSearchIndex(
    contentType: string,
    contentId: string,
    text: string,
  ): Promise<void>;
  clearSearchIndex(contentType?: string): Promise<void>;
}

// 类型定义（从 schema 导入的简化版本）
export interface Video {
  id: string;
  title: string;
  filePath: string;
  thumbnailPath?: string;
  duration: number;
  fileSize: number;
  format: string;
  resolutionWidth?: number;
  resolutionHeight?: number;
  tags: string[];
  category: string;
  watchProgress: number;
  isFavorite: boolean;
  playCount: number;
  lastWatchedAt?: string;
  description?: string;
  rating: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchHistory {
  id: string;
  videoId: string;
  position: number;
  duration: number;
  watchedAt: string;
  completed: boolean;
  watchTime: number;
  sessionId?: string;
  deviceId?: string;
  playbackSpeed: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  thumbnailPath?: string;
  videoCount: number;
  totalDuration: number;
  isPublic: boolean;
  isDefault: boolean;
  sortOrder: number;
  playCount: number;
  lastPlayedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistVideo {
  playlistId: string;
  videoId: string;
  position: number;
  addedAt: string;
  customTitle?: string;
  customThumbnailPath?: string;
  notes?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  usageCount: number;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  thumbnailPath?: string;
  description?: string;
  sortOrder: string;
  viewMode: string;
  isSystemFolder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  videoId: string;
  title: string;
  position: number;
  thumbnailPath?: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  theme: string;
  language: string;
  defaultPlaybackSpeed: number;
  defaultVolume: number;
  autoPlay: boolean;
  loopMode: string;
  showControls: boolean;
  enableGestures: boolean;
  enableHaptics: boolean;
  skipIntros: boolean;
  skipCredits: boolean;
  preferredQuality: string;
  subtitleLanguage: string;
  audioLanguage: string;
  maxCacheSize: number;
  autoCleanupCache: boolean;
  cacheRetentionDays: number;
  dataBackupEnabled: boolean;
  lastBackupAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 扩展类型
export interface VideoWithRelations extends Video {
  tags: Tag[];
  playlists: Playlist[];
  folder?: Folder;
  bookmarks: Bookmark[];
  watchHistory: WatchHistory[];
}

export interface PlaylistWithVideos extends Playlist {
  videos: (Video & PlaylistVideo)[];
}

export interface FolderWithVideos extends Folder {
  videos: Video[];
  children?: Folder[];
}

export interface VideoSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: "created_at" | "title" | "duration" | "rating" | "play_count";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface VideoStats {
  totalVideos: number;
  totalDuration: number;
  totalSize: number;
  totalPlayCount: number;
  averageRating: number;
  categories: Record<string, number>;
}

export interface UserStats {
  totalWatchTime: number;
  videosWatched: number;
  playlistsCreated: number;
  bookmarksCreated: number;
  favoriteVideos: number;
}

// 选项类型
export interface PlaylistVideoOptions {
  customTitle?: string;
  customThumbnailPath?: string;
  notes?: string;
}

export interface TagOptions {
  color?: string;
  description?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: "relevance" | "created_at" | "title";
  sortOrder?: "asc" | "desc";
  filters?: Record<string, any>;
}

export interface GlobalSearchOptions {
  limit?: number;
  types?: ("videos" | "playlists" | "folders")[];
}

export interface GlobalSearchResult {
  videos: SearchResult<Video>;
  playlists: SearchResult<Playlist>;
  folders: SearchResult<Folder>;
}

export interface SearchSuggestion {
  text: string;
  type: "video" | "playlist" | "folder" | "tag";
  count?: number;
}

// 统一数据库服务接口
export interface IDatabaseService {
  // 仓库访问器
  get video(): IVideoRepository;
  get watchHistory(): IWatchHistoryRepository;
  get playlist(): IPlaylistRepository;
  get tag(): ITagRepository;
  get folder(): IFolderRepository;
  get bookmark(): IBookmarkRepository;
  get settings(): ISettingsRepository;
  get search(): ISearchRepository;

  // 连接管理
  initialize(): Promise<void>;
  close(): Promise<void>;
  isHealthy(): Promise<boolean>;

  // 事务支持
  transaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;

  // 迁移和清理
  runMigrations(): Promise<void>;
  cleanup(): Promise<void>;
}
