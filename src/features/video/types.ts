/**
 * 视频功能模块的类型定义
 */
import { Video as BaseVideo } from '@/types';

export interface VideoFile extends BaseVideo {
  // 扩展的文件属性
  filePath: string;
  fileSize: number;
  lastModified: Date;
  isAvailable: boolean;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  codec: string;
  format: string;
  createdAt: Date;
}

export interface VideoThumbnail {
  uri: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface VideoFilter {
  query?: string;
  tags?: string[];
  duration?: {
    min: number;
    max: number;
  };
  size?: {
    min: number;
    max: number;
  };
  sortBy?: 'date' | 'title' | 'duration' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface VideoSearchResult {
  videos: VideoFile[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export interface VideoUploadOptions {
  generateThumbnail: boolean;
  extractMetadata: boolean;
  addToLibrary: boolean;
  playlistId?: string;
  tags?: string[];
}

export interface VideoProgress {
  videoId: string;
  position: number;
  duration: number;
  lastPlayed: Date;
  completed: boolean;
}

export interface VideoStats {
  totalVideos: number;
  totalSize: number;
  totalDuration: number;
  averageDuration: number;
  mostPlayed: VideoFile[];
  recentlyAdded: VideoFile[];
}
