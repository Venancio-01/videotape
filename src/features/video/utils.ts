/**
 * 视频相关的工具函数
 */
import { VIDEO_CONSTANTS } from './constants';
import { VideoFile } from './types';

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * 格式化时长
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * 生成视频缩略图时间点
 */
export function generateThumbnailTimestamps(duration: number): number[] {
  const timestamps: number[] = [];
  const count = 3; // 生成3个缩略图

  for (let i = 0; i < count; i++) {
    timestamps.push((duration / (count + 1)) * (i + 1));
  }

  return timestamps;
}

/**
 * 验证视频文件类型
 */
export function isValidVideoType(mimeType: string): boolean {
  return VIDEO_CONSTANTS.SUPPORTED_FORMATS.includes(
    mimeType as (typeof VIDEO_CONSTANTS.SUPPORTED_FORMATS)[number]
  );
}

/**
 * 计算视频播放进度百分比
 */
export function calculateProgress(position: number, duration: number): number {
  if (duration === 0) return 0;
  return Math.min(100, Math.max(0, (position / duration) * 100));
}

/**
 * 获取合适的播放速度选项
 */
export function getPlaybackSpeedOptions(): number[] {
  const speeds: number[] = [];
  for (
    let speed = VIDEO_CONSTANTS.PLAYER.MIN_SPEED;
    speed <= VIDEO_CONSTANTS.PLAYER.MAX_SPEED;
    speed += VIDEO_CONSTANTS.PLAYER.SPEED_STEP
  ) {
    speeds.push(speed);
  }
  return speeds;
}

/**
 * 格式化播放速度显示
 */
export function formatPlaybackSpeed(speed: number): string {
  if (speed === 1) return '1x';
  if (speed < 1) return `${speed}x`;
  return `${speed}x`;
}

/**
 * 检查文件是否可访问
 */
export async function isFileAccessible(uri: string): Promise<boolean> {
  try {
    const response = await fetch(uri, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 提取文件名（不含扩展名）
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
}

/**
 * 提取文件扩展名
 */
export function getFileExtension(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1) : '';
}

/**
 * 规范化视频数据
 */
export function normalizeVideoData(video: Partial<VideoFile>): VideoFile {
  return {
    id: video.id || '',
    title: video.title || 'Unknown',
    uri: video.uri || '',
    thumbnailUri: video.thumbnailUri,
    duration: video.duration || 0,
    size: video.size || 0,
    mimeType: video.mimeType || 'video/mp4',
    playCount: video.playCount || 0,
    tags: video.tags || [],
    createdAt: video.createdAt || new Date(),
    updatedAt: video.updatedAt || new Date(),
    filePath: video.filePath || '',
    fileSize: video.fileSize || 0,
    lastModified: video.lastModified || new Date(),
    isAvailable: video.isAvailable ?? true,
  };
}
