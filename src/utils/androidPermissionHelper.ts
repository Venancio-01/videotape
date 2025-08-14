/**
 * Android 文件权限处理工具
 * 解决 Android 11+ Scoped Storage 问题
 */

import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface VideoAsset {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
  creationTime: number;
  modificationTime: number;
  albumId?: string;
  mediaType: 'video' | 'image' | 'audio';
}

export class AndroidPermissionHelper {
  private static instance: AndroidPermissionHelper;

  private constructor() {}

  static getInstance(): AndroidPermissionHelper {
    if (!AndroidPermissionHelper.instance) {
      AndroidPermissionHelper.instance = new AndroidPermissionHelper();
    }
    return AndroidPermissionHelper.instance;
  }

  /**
   * 请求媒体库权限
   */
  async requestMediaPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return true;
      }

      // Android 13+ 需要请求具体媒体权限
      if (Platform.Version >= 33) {
        const { status: videoStatus } = await MediaLibrary.requestPermissionsAsync({
          ios: false,
          android: {
            permission: MediaLibrary.PermissionAccessType.READ_WRITE,
            granularPermissions: {
              photo: false,
              video: true,
              audio: false,
              'read-external-storage': false,
              'write-external-storage': false,
            },
          },
        });

        return videoStatus === 'granted';
      }

      // Android 12 及以下
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('请求媒体权限失败:', error);
      return false;
    }
  }

  /**
   * 请求音频权限
   */
  async requestAudioPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
      }

      // Android 音频权限通过 expo-av 自动处理
      return true;
    } catch (error) {
      console.error('请求音频权限失败:', error);
      return false;
    }
  }

  /**
   * 请求所有必需权限
   */
  async requestAllPermissions(): Promise<boolean> {
    try {
      const [mediaPermission, audioPermission] = await Promise.all([
        this.requestMediaPermissions(),
        this.requestAudioPermissions(),
      ]);

      return mediaPermission && audioPermission;
    } catch (error) {
      console.error('请求权限失败:', error);
      return false;
    }
  }

  /**
   * 获取所有视频资源
   */
  async getVideoAssets(): Promise<VideoAsset[]> {
    try {
      const hasPermission = await this.requestMediaPermissions();
      if (!hasPermission) {
        throw new Error('缺少媒体访问权限');
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        first: 1000, // 限制数量避免内存问题
      });

      const videoAssets: VideoAsset[] = [];

      for (const asset of media.assets) {
        const videoAsset: VideoAsset = {
          id: asset.id,
          uri: asset.uri,
          filename: asset.filename,
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize || 0,
          creationTime: asset.creationTime,
          modificationTime: asset.modificationTime,
          albumId: asset.albumId,
          mediaType: 'video',
        };
        videoAssets.push(videoAsset);
      }

      return videoAssets;
    } catch (error) {
      console.error('获取视频资源失败:', error);
      throw error;
    }
  }

  /**
   * 通过 ID 获取视频资源
   */
  async getVideoAssetById(id: string): Promise<VideoAsset | null> {
    try {
      const asset = await MediaLibrary.getAssetInfoAsync(id);
      if (!asset) return null;

      return {
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize || 0,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        albumId: asset.albumId,
        mediaType: 'video',
      };
    } catch (error) {
      console.error('获取视频资源失败:', error);
      return null;
    }
  }

  /**
   * 获取可访问的 URI
   * 对于 Android 11+，返回本地缓存 URI
   */
  async getAccessibleUri(originalUri: string): Promise<string> {
    try {
      // 如果是 content:// URI，直接返回
      if (originalUri.startsWith('content://')) {
        return originalUri;
      }

      // 如果是 file:// URI，检查是否可访问
      if (originalUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(originalUri);
        if (fileInfo.exists && !fileInfo.isDirectory) {
          return originalUri;
        }

        // 如果文件不存在，尝试从媒体库查找
        const filename = originalUri.split('/').pop();
        if (filename) {
          const assets = await this.getVideoAssets();
          const matchingAsset = assets.find(asset => asset.filename === filename);
          if (matchingAsset) {
            return matchingAsset.uri;
          }
        }
      }

      return originalUri;
    } catch (error) {
      console.error('获取可访问 URI 失败:', error);
      return originalUri;
    }
  }

  /**
   * 缓存视频文件到应用私有目录
   */
  async cacheVideoFile(originalUri: string): Promise<string> {
    try {
      const accessibleUri = await this.getAccessibleUri(originalUri);
      
      // 生成缓存文件名
      const filename = accessibleUri.split('/').pop() || `video_${Date.now()}.mp4`;
      const cacheDir = `${FileSystem.cacheDirectory}videos/`;
      const cachePath = `${cacheDir}${filename}`;

      // 确保缓存目录存在
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

      // 检查文件是否已缓存
      const cacheInfo = await FileSystem.getInfoAsync(cachePath);
      if (cacheInfo.exists) {
        return cachePath;
      }

      // 复制文件到缓存目录
      await FileSystem.copyAsync({
        from: accessibleUri,
        to: cachePath,
      });

      return cachePath;
    } catch (error) {
      console.error('缓存视频文件失败:', error);
      throw error;
    }
  }

  /**
   * 清理缓存文件
   */
  async clearCache(): Promise<void> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}videos/`;
      const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (cacheInfo.exists && cacheInfo.isDirectory) {
        await FileSystem.deleteAsync(cacheDir);
      }
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  /**
   * 检查 URI 是否可访问
   */
  async isUriAccessible(uri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists && !fileInfo.isDirectory;
    } catch (error) {
      return false;
    }
  }
}