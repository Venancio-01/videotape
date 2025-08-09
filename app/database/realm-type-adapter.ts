/**
 * Realm 类型适配器
 * 解决 Realm 对象与 TypeScript 类型之间的兼容性问题
 */

import Realm from 'realm';
import { Video, Playlist, Folder, PlayHistory, AppSettings } from './realm-schema';

/**
 * 类型安全的 Realm 对象转换器
 */
export class RealmTypeAdapter {
  /**
   * 将普通对象转换为 Realm 对象创建格式
   */
  static toRealmVideo(videoData: Partial<Video>): any {
    const now = new Date();
    return {
      title: videoData.title || '',
      description: videoData.description,
      uri: videoData.uri || '',
      thumbnailUri: videoData.thumbnailUri,
      duration: videoData.duration || 0,
      size: videoData.size || 0,
      mimeType: videoData.mimeType || '',
      playCount: videoData.playCount || 0,
      lastPlayedAt: videoData.lastPlayedAt,
      folderId: videoData.folderId,
      tags: videoData.tags || [],
      fileSize: videoData.fileSize || videoData.size || 0,
      format: videoData.format || videoData.mimeType?.split('/')[1] || 'unknown',
      quality: videoData.quality || 'medium',
      playbackProgress: videoData.playbackProgress || 0,
      viewCount: videoData.viewCount || 0,
      // 索引字段
      titleIndexed: videoData.title || '',
      folderIdIndexed: videoData.folderId || '',
      createdAtIndexed: now,
    };
  }

  /**
   * 将普通对象转换为 Realm 播放列表对象创建格式
   */
  static toRealmPlaylist(playlistData: Partial<Playlist>): any {
    const now = new Date();
    return {
      name: playlistData.name || '',
      description: playlistData.description,
      thumbnailUri: playlistData.thumbnailUri,
      videoIds: playlistData.videoIds || [],
      isPrivate: playlistData.isPrivate || false,
      // 索引字段
      nameIndexed: playlistData.name || '',
      createdAtIndexed: now,
    };
  }

  /**
   * 将普通对象转换为 Realm 文件夹对象创建格式
   */
  static toRealmFolder(folderData: Partial<Folder>): any {
    const now = new Date();
    return {
      name: folderData.name || '',
      description: folderData.description,
      parentId: folderData.parentId,
      videoCount: folderData.videoCount || 0,
      isPrivate: folderData.isPrivate || false,
      // 索引字段
      nameIndexed: folderData.name || '',
      parentIdIndexed: folderData.parentId || '',
      createdAtIndexed: now,
    };
  }

  /**
   * 将普通对象转换为 Realm 播放历史对象创建格式
   */
  static toRealmPlayHistory(historyData: Partial<PlayHistory>): any {
    return {
      videoId: historyData.videoId || '',
      playedAt: historyData.playedAt || new Date(),
      position: historyData.position || 0,
      duration: historyData.duration || 0,
      completed: historyData.completed || false,
      playbackSpeed: historyData.playbackSpeed || 1.0,
      volume: historyData.volume || 1.0,
      deviceInfo: historyData.deviceInfo || '',
      // 索引字段
      videoIdIndexed: historyData.videoId || '',
      playedAtIndexed: historyData.playedAt || new Date(),
    };
  }

  /**
   * 安全地将 Realm 对象转换为普通 TypeScript 对象
   */
  static fromRealmVideo(realmVideo: any): Video {
    return {
      id: realmVideo.id,
      title: realmVideo.title,
      description: realmVideo.description,
      uri: realmVideo.uri,
      thumbnailUri: realmVideo.thumbnailUri,
      duration: realmVideo.duration,
      size: realmVideo.size,
      mimeType: realmVideo.mimeType,
      playCount: realmVideo.playCount,
      lastPlayedAt: realmVideo.lastPlayedAt,
      folderId: realmVideo.folderId,
      tags: realmVideo.tags,
      fileSize: realmVideo.fileSize,
      format: realmVideo.format,
      quality: realmVideo.quality,
      playbackProgress: realmVideo.playbackProgress,
      viewCount: realmVideo.viewCount,
      createdAt: realmVideo.createdAt,
      updatedAt: realmVideo.updatedAt,
      // 添加缺失的 Realm 字段
      titleIndexed: realmVideo.titleIndexed || '',
      folderIdIndexed: realmVideo.folderIdIndexed || '',
      createdAtIndexed: realmVideo.createdAtIndexed || new Date(),
    } as Video;
  }

  /**
   * 安全地将 Realm 播放列表对象转换为普通 TypeScript 对象
   */
  static fromRealmPlaylist(realmPlaylist: any): Playlist {
    return {
      id: realmPlaylist.id,
      name: realmPlaylist.name,
      description: realmPlaylist.description,
      thumbnailUri: realmPlaylist.thumbnailUri,
      videoIds: realmPlaylist.videoIds,
      isPrivate: realmPlaylist.isPrivate,
      createdAt: realmPlaylist.createdAt,
      updatedAt: realmPlaylist.updatedAt,
      // 添加缺失的 Realm 字段
      nameIndexed: realmPlaylist.nameIndexed || '',
      createdAtIndexed: realmPlaylist.createdAtIndexed || new Date(),
    } as Playlist;
  }

  /**
   * 安全地将 Realm 文件夹对象转换为普通 TypeScript 对象
   */
  static fromRealmFolder(realmFolder: any): Folder {
    return {
      id: realmFolder.id,
      name: realmFolder.name,
      description: realmFolder.description,
      parentId: realmFolder.parentId,
      videoCount: realmFolder.videoCount,
      isPrivate: realmFolder.isPrivate,
      createdAt: realmFolder.createdAt,
      updatedAt: realmFolder.updatedAt,
      // 添加缺失的 Realm 字段
      nameIndexed: realmFolder.nameIndexed || '',
      parentIdIndexed: realmFolder.parentIdIndexed || '',
      createdAtIndexed: realmFolder.createdAtIndexed || new Date(),
    } as Folder;
  }

  /**
   * 安全地将 Realm 播放历史对象转换为普通 TypeScript 对象
   */
  static fromRealmPlayHistory(realmHistory: any): PlayHistory {
    return {
      id: realmHistory.id,
      videoId: realmHistory.videoId,
      playedAt: realmHistory.playedAt,
      position: realmHistory.position,
      duration: realmHistory.duration,
      completed: realmHistory.completed,
      playbackSpeed: realmHistory.playbackSpeed,
      volume: realmHistory.volume,
      deviceInfo: realmHistory.deviceInfo,
      // 添加缺失的 Realm 字段
      videoIdIndexed: realmHistory.videoIdIndexed || '',
      playedAtIndexed: realmHistory.playedAtIndexed || new Date(),
    } as PlayHistory;
  }

  /**
   * 安全地将 Realm 设置对象转换为普通 TypeScript 对象
   */
  static fromRealmAppSettings(realmSettings: any): AppSettings {
    return {
      id: realmSettings.id,
      theme: realmSettings.theme,
      language: realmSettings.language,
      autoPlay: realmSettings.autoPlay,
      loop: realmSettings.loop,
      shuffle: realmSettings.shuffle,
      volume: realmSettings.volume,
      playbackSpeed: realmSettings.playbackSpeed,
      quality: realmSettings.quality,
      dataSaver: realmSettings.dataSaver,
      backgroundPlay: realmSettings.backgroundPlay,
      syncEnabled: realmSettings.syncEnabled,
      analyticsEnabled: realmSettings.analyticsEnabled,
      crashReportingEnabled: realmSettings.crashReportingEnabled,
      lastUpdated: realmSettings.lastUpdated,
    } as AppSettings;
  }

  /**
   * 更新 Realm 对象的索引字段
   */
  static updateVideoIndexes(realmVideo: any, updates: Partial<Video>): void {
    if (updates.title) realmVideo.titleIndexed = updates.title;
    if (updates.folderId !== undefined) realmVideo.folderIdIndexed = updates.folderId || '';
  }

  /**
   * 更新播放列表索引字段
   */
  static updatePlaylistIndexes(realmPlaylist: any, updates: Partial<Playlist>): void {
    if (updates.name) realmPlaylist.nameIndexed = updates.name;
  }

  /**
   * 更新文件夹索引字段
   */
  static updateFolderIndexes(realmFolder: any, updates: Partial<Folder>): void {
    if (updates.name) realmFolder.nameIndexed = updates.name;
    if (updates.parentId !== undefined) realmFolder.parentIdIndexed = updates.parentId || '';
  }

  /**
   * 类型安全的 Realm 配置对象
   */
  static createRealmConfig(): Realm.Configuration {
    return {
      schema: [Video, Playlist, Folder, PlayHistory, AppSettings],
      schemaVersion: 1,
      path: 'videotape.realm',
      deleteRealmIfMigrationNeeded: false,
    } as Realm.Configuration;
  }
}
