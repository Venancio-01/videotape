import * as FileSystem from 'expo-file-system';
import * as Asset from 'expo-asset';
import { Platform } from 'react-native';
import { Video } from '../types';

/**
 * 存储管理服务
 */
export class StorageService {
  private static instance: StorageService;
  private readonly videoDirectory = `${FileSystem.documentDirectory}videos/`;
  private readonly thumbnailDirectory = `${FileSystem.documentDirectory}thumbnails/`;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * 初始化存储目录
   */
  async initialize(): Promise<void> {
    try {
      await this.ensureDirectoryExists(this.videoDirectory);
      await this.ensureDirectoryExists(this.thumbnailDirectory);
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(directory: string): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
  }

  /**
   * 保存视频文件
   */
  async saveVideoFile(sourceUri: string, fileName: string): Promise<string> {
    try {
      const destinationUri = `${this.videoDirectory}${fileName}`;
      
      // 如果是 asset URI，先下载到本地
      if (sourceUri.startsWith('asset://')) {
        const asset = await Asset.fromURI(sourceUri);
        await asset.downloadAsync();
        sourceUri = asset.localUri || sourceUri;
      }

      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri,
      });

      return destinationUri;
    } catch (error) {
      console.error('Failed to save video file:', error);
      throw error;
    }
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(videoUri: string): Promise<string> {
    try {
      const thumbnailFileName = `thumbnail_${Date.now()}.jpg`;
      const thumbnailUri = `${this.thumbnailDirectory}${thumbnailFileName}`;
      
      // 这里需要使用 react-native-ffmpeg 来生成缩略图
      // 暂时返回一个占位符
      return thumbnailUri;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      throw error;
    }
  }

  /**
   * 删除视频文件
   */
  async deleteVideoFile(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Failed to delete video file:', error);
      throw error;
    }
  }

  /**
   * 删除缩略图
   */
  async deleteThumbnail(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Failed to delete thumbnail:', error);
      throw error;
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(uri: string): Promise<FileSystem.FileInfo> {
    try {
      return await FileSystem.getInfoAsync(uri);
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  /**
   * 获取文件大小
   */
  async getFileSize(uri: string): Promise<number> {
    try {
      const fileInfo = await this.getFileInfo(uri);
      return fileInfo.exists ? fileInfo.size || 0 : 0;
    } catch (error) {
      console.error('Failed to get file size:', error);
      return 0;
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(uri: string): Promise<boolean> {
    try {
      const fileInfo = await this.getFileInfo(uri);
      return fileInfo.exists;
    } catch (error) {
      console.error('Failed to check file existence:', error);
      return false;
    }
  }

  /**
   * 清理存储空间
   */
  async cleanupStorage(): Promise<void> {
    try {
      // 清理临时文件
      const tempDir = `${FileSystem.cacheDirectory}temp/`;
      const tempDirInfo = await FileSystem.getInfoAsync(tempDir);
      
      if (tempDirInfo.exists) {
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
      throw error;
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<{
    totalSpace: number;
    usedSpace: number;
    freeSpace: number;
    videoCount: number;
  }> {
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const totalSpace = 1024 * 1024 * 1024; // 1GB 假设
      
      // 计算视频目录使用空间
      const videoFiles = await FileSystem.readDirectoryAsync(this.videoDirectory);
      let usedSpace = 0;
      
      for (const file of videoFiles) {
        const fileInfo = await FileSystem.getInfoAsync(`${this.videoDirectory}${file}`);
        if (fileInfo.exists && fileInfo.size) {
          usedSpace += fileInfo.size;
        }
      }

      return {
        totalSpace,
        usedSpace,
        freeSpace,
        videoCount: videoFiles.length,
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      throw error;
    }
  }

  /**
   * 导出视频文件
   */
  async exportVideoFile(videoUri: string, destinationUri: string): Promise<void> {
    try {
      await FileSystem.copyAsync({
        from: videoUri,
        to: destinationUri,
      });
    } catch (error) {
      console.error('Failed to export video file:', error);
      throw error;
    }
  }

  /**
   * 导入视频文件
   */
  async importVideoFile(sourceUri: string): Promise<string> {
    try {
      const fileName = `video_${Date.now()}.mp4`;
      return await this.saveVideoFile(sourceUri, fileName);
    } catch (error) {
      console.error('Failed to import video file:', error);
      throw error;
    }
  }
}

export const storageService = StorageService.getInstance();