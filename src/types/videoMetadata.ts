/**
 * 视频元数据接口定义
 */
export interface VideoMetadata {
  duration: number; // 视频时长（毫秒）
  width: number; // 视频宽度
  height: number; // 视频高度
  bitrate: number; // 比特率（bps）
  rotation: number; // 视频旋转角度
  mimeType?: string; // MIME类型
  hasAudio: boolean; // 是否包含音频
  hasVideo: boolean; // 是否包含视频
  frameRate?: string; // 帧率
  fileSize: number; // 文件大小（字节）
  creationTime: number; // 创建时间
  modificationTime: number; // 修改时间
  errorMessage?: string; // 错误信息
}

/**
 * 视频元数据模块接口
 */
export interface VideoMetadataModule {
  /**
   * 获取单个视频文件的元数据
   */
  getVideoMetadata(filePath: string): Promise<VideoMetadata>;

  /**
   * 获取单个视频文件的元数据（带缓存）
   */
  getVideoMetadataWithCache(filePath: string): Promise<VideoMetadata>;

  /**
   * 批量获取视频元数据
   */
  getBatchVideoMetadata(filePaths: string[]): Promise<VideoMetadata[]>;

  /**
   * 批量获取视频元数据（带缓存）
   */
  getBatchVideoMetadataWithCache(filePaths: string[]): Promise<VideoMetadata[]>;

  /**
   * 检查文件是否为有效的视频文件
   */
  isValidVideoFile(filePath: string): Promise<boolean>;

  /**
   * 获取视频缩略图（Base64格式）
   */
  getVideoThumbnail(filePath: string, timeUs?: number): Promise<string | null>;

  /**
   * 清除元数据缓存
   */
  clearCache(): Promise<void>;

  /**
   * 移除特定文件的缓存
   */
  removeFromCache(filePath: string): Promise<void>;

  /**
   * 获取缓存大小
   */
  getCacheSize(): Promise<number>;
}

/**
 * 原生模块常量
 */
export interface VideoMetadataConstants {
  METADATA_KEY_DURATION: number;
  METADATA_KEY_WIDTH: number;
  METADATA_KEY_HEIGHT: number;
  METADATA_KEY_BITRATE: number;
  METADATA_KEY_ROTATION: number;
  METADATA_KEY_MIMETYPE: number;
  METADATA_KEY_FRAMERATE: number;
}

/**
 * 视频元数据工具类
 */
export class VideoMetadataUtils {
  private static instance: VideoMetadataUtils;
  private module: VideoMetadataModule;

  constructor(module: VideoMetadataModule) {
    this.module = module;
  }

  static getInstance(module?: VideoMetadataModule): VideoMetadataUtils {
    if (!VideoMetadataUtils.instance) {
      if (!module) {
        throw new Error("VideoMetadataModule not provided");
      }
      VideoMetadataUtils.instance = new VideoMetadataUtils(module);
    }
    return VideoMetadataUtils.instance;
  }

  /**
   * 获取视频基本信息
   */
  async getVideoBasicInfo(filePath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fileSize: number;
    isValid: boolean;
  }> {
    try {
      const [metadata, isValid] = await Promise.all([
        this.module.getVideoMetadata(filePath),
        this.module.isValidVideoFile(filePath),
      ]);

      return {
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        fileSize: metadata.fileSize,
        isValid,
      };
    } catch (error) {
      throw new Error(`获取视频基本信息失败: ${error}`);
    }
  }

  /**
   * 格式化时长
   */
  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * 获取视频方向
   */
  getVideoOrientation(
    width: number,
    height: number,
    rotation: number,
  ): "portrait" | "landscape" {
    const effectiveRotation = rotation % 360;
    if (effectiveRotation === 90 || effectiveRotation === 270) {
      return width > height ? "portrait" : "landscape";
    }
    return width > height ? "landscape" : "portrait";
  }

  /**
   * 计算视频比特率（简化版）
   */
  calculateBitrate(fileSize: number, duration: number): number {
    if (duration === 0) return 0;
    return Math.round((fileSize * 8) / (duration / 1000)); // bps
  }

  /**
   * 批量处理视频元数据（带进度回调）
   */
  async processBatchWithProgress(
    filePaths: string[],
    onProgress?: (processed: number, total: number) => void,
  ): Promise<VideoMetadata[]> {
    const total = filePaths.length;
    const results: VideoMetadata[] = [];

    // 分批处理以避免内存问题
    const batchSize = 10;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults = await this.module.getBatchVideoMetadata(batch);
      results.push(...batchResults);

      if (onProgress) {
        onProgress(Math.min(i + batchSize, total), total);
      }

      // 避免过于频繁的UI更新
      if (i % 20 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    return results;
  }

  /**
   * 过滤有效视频文件
   */
  async filterValidVideos(filePaths: string[]): Promise<string[]> {
    const results = await Promise.all(
      filePaths.map(async (path) => {
        try {
          const isValid = await this.module.isValidVideoFile(path);
          return isValid ? path : null;
        } catch {
          return null;
        }
      }),
    );

    return results.filter((path): path is string => path !== null);
  }

  /**
   * 获取视频统计信息
   */
  async getVideoStats(filePaths: string[]): Promise<{
    totalFiles: number;
    validFiles: number;
    totalSize: number;
    totalDuration: number;
    averageBitrate: number;
  }> {
    const validPaths = await this.filterValidVideos(filePaths);
    const metadataList = await this.module.getBatchVideoMetadata(validPaths);

    const stats = {
      totalFiles: filePaths.length,
      validFiles: validPaths.length,
      totalSize: 0,
      totalDuration: 0,
      averageBitrate: 0,
    };

    let totalBitrate = 0;
    let bitrateCount = 0;

    for (const metadata of metadataList) {
      stats.totalSize += metadata.fileSize;
      stats.totalDuration += metadata.duration;

      if (metadata.bitrate > 0) {
        totalBitrate += metadata.bitrate;
        bitrateCount++;
      }
    }

    stats.averageBitrate = bitrateCount > 0 ? totalBitrate / bitrateCount : 0;

    return stats;
  }
}

/**
 * 视频元数据缓存管理器
 */
export class VideoMetadataCache {
  private cache = new Map<string, VideoMetadata>();
  private module: VideoMetadataModule;

  constructor(module: VideoMetadataModule) {
    this.module = module;
  }

  /**
   * 获取视频元数据（优先从缓存）
   */
  async getMetadata(filePath: string): Promise<VideoMetadata> {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    const metadata = await this.module.getVideoMetadata(filePath);
    this.cache.set(filePath, metadata);
    return metadata;
  }

  /**
   * 预加载视频元数据
   */
  async preloadMetadata(filePaths: string[]): Promise<void> {
    const uncachedPaths = filePaths.filter((path) => !this.cache.has(path));

    if (uncachedPaths.length > 0) {
      const metadataList =
        await this.module.getBatchVideoMetadata(uncachedPaths);

      uncachedPaths.forEach((path, index) => {
        if (metadataList[index]) {
          this.cache.set(path, metadataList[index]);
        }
      });
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 移除特定文件的缓存
   */
  removeFromCache(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 获取所有缓存的元数据
   */
  getAllCachedMetadata(): VideoMetadata[] {
    return Array.from(this.cache.values());
  }
}
