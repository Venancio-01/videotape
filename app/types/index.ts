/**
 * 视频数据类型定义
 */
export interface Video {
  id: string;
  title: string;
  description?: string;
  uri: string;
  thumbnailUri?: string;
  duration: number;
  size: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  playCount: number;
  likeCount: number;
  lastPlayedAt?: Date;
  folderId?: string;
  tags: string[];
}

/**
 * 播放列表类型定义
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  thumbnailUri?: string;
  createdAt: Date;
  updatedAt: Date;
  videoIds: string[];
  isPrivate: boolean;
}

/**
 * 文件夹类型定义
 */
export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  videoCount: number;
  isPrivate: boolean;
}

/**
 * 播放历史记录
 */
export interface PlayHistory {
  id: string;
  videoId: string;
  playedAt: Date;
  position: number;
  duration: number;
  completed: boolean;
}

/**
 * 应用设置
 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoPlay: boolean;
  loop: boolean;
  shuffle: boolean;
  volume: number;
  playbackSpeed: number;
  quality: 'auto' | 'low' | 'medium' | 'high';
  dataSaver: boolean;
  backgroundPlay: boolean;
}

/**
 * 播放器状态
 */
export interface PlayerState {
  currentVideo: Video | null;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isLooping: boolean;
  isShuffle: boolean;
  isMuted: boolean;
  playlist: Playlist | null;
  playlistIndex: number;
  queue: Video[];
  currentIndex: number;
}

/**
 * 筛选和排序选项
 */
export interface FilterOptions {
  sortBy: 'date' | 'name' | 'duration' | 'size' | 'playCount';
  sortOrder: 'asc' | 'desc';
  filterBy: 'all' | 'favorites' | 'recent' | 'folder';
  folderId?: string;
  searchQuery?: string;
  tags?: string[];
  mimeType?: string;
}

/**
 * 数据库操作结果
 */
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 分页数据
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
