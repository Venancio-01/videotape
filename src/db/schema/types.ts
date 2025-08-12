/**
 * 数据库类型定义
 * 从 tables.ts 导出的类型定义
 */

export type {
  Video,
  WatchHistory,
  Playlist,
  PlaylistVideo,
  Tag,
  VideoTag,
  Settings,
  Folder,
  FolderVideo,
  Bookmark,
  SearchIndex,
  VideoWithHistory,
  PlaylistWithVideos,
  FolderWithVideos,
  VideoWithRelations,
  VideoSearchParams,
  SearchResult,
  VideoStats,
  UserStats,
} from './tables';

// 重新导出基础实体类型
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Timestamps {
  created_at: Date;
  updated_at: Date;
}

// 查询参数类型
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchOptions extends QueryOptions {
  query?: string;
  filters?: Record<string, any>;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  total?: number;
}

// 操作结果类型
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
}