/**
 * 数据迁移工具
 * 从 Dexie.js 数据库迁移到 Realm 数据库
 */

import Dexie, { Table } from 'dexie';
import { getDatabase } from './realm-service';
import { Video, Playlist, Folder, PlayHistory, AppSettings } from '@/types';

/**
 * 迁移进度接口
 */
export interface MigrationProgress {
  stage: 'preparing' | 'videos' | 'playlists' | 'folders' | 'history' | 'settings' | 'validating' | 'completed';
  progress: number;
  total: number;
  current: number;
  message: string;
  errors: string[];
}

/**
 * 迁移结果接口
 */
export interface MigrationResult {
  success: boolean;
  duration: number;
  stats: {
    videos: { migrated: number; failed: number };
    playlists: { migrated: number; failed: number };
    folders: { migrated: number; failed: number };
    history: { migrated: number; failed: number };
    settings: { migrated: number; failed: number };
  };
  errors: string[];
  warnings: string[];
}

/**
 * 数据迁移服务
 */
export class DataMigrationService {
  private onProgress?: (progress: MigrationProgress) => void;
  private startTime: number = 0;

  constructor(onProgress?: (progress: MigrationProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * 执行完整的数据迁移
   */
  async migrate(): Promise<MigrationResult> {
    this.startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 更新进度：准备阶段
      this.updateProgress({
        stage: 'preparing',
        progress: 0,
        total: 100,
        current: 0,
        message: '准备迁移...',
        errors: []
      });

      // 检查旧数据库是否存在
      const oldDb = await this.openOldDatabase();
      if (!oldDb) {
        errors.push('未找到旧数据库');
        return {
          success: false,
          duration: Date.now() - this.startTime,
          stats: {
            videos: { migrated: 0, failed: 0 },
            playlists: { migrated: 0, failed: 0 },
            folders: { migrated: 0, failed: 0 },
            history: { migrated: 0, failed: 0 },
            settings: { migrated: 0, failed: 0 },
          },
          errors,
          warnings
        };
      }

      // 获取数据统计
      const stats = await this.getDataStats(oldDb);
      
      // 更新进度：开始迁移
      this.updateProgress({
        stage: 'videos',
        progress: 0,
        total: stats.total,
        current: 0,
        message: '开始迁移视频数据...',
        errors: []
      });

      // 迁移视频数据
      const videoResult = await this.migrateVideos(oldDb);
      errors.push(...videoResult.errors);
      warnings.push(...videoResult.warnings);

      // 迁移播放列表
      this.updateProgress({
        stage: 'playlists',
        progress: 20,
        total: stats.total,
        current: stats.videos,
        message: '迁移播放列表...',
        errors
      });
      const playlistResult = await this.migratePlaylists(oldDb);
      errors.push(...playlistResult.errors);
      warnings.push(...playlistResult.warnings);

      // 迁移文件夹
      this.updateProgress({
        stage: 'folders',
        progress: 40,
        total: stats.total,
        current: stats.videos + stats.playlists,
        message: '迁移文件夹...',
        errors
      });
      const folderResult = await this.migrateFolders(oldDb);
      errors.push(...folderResult.errors);
      warnings.push(...folderResult.warnings);

      // 迁移播放历史
      this.updateProgress({
        stage: 'history',
        progress: 60,
        total: stats.total,
        current: stats.videos + stats.playlists + stats.folders,
        message: '迁移播放历史...',
        errors
      });
      const historyResult = await this.migrateHistory(oldDb);
      errors.push(...historyResult.errors);
      warnings.push(...historyResult.warnings);

      // 迁移设置
      this.updateProgress({
        stage: 'settings',
        progress: 80,
        total: stats.total,
        current: stats.videos + stats.playlists + stats.folders + stats.history,
        message: '迁移应用设置...',
        errors
      });
      const settingsResult = await this.migrateSettings(oldDb);
      errors.push(...settingsResult.errors);
      warnings.push(...settingsResult.warnings);

      // 验证数据完整性
      this.updateProgress({
        stage: 'validating',
        progress: 90,
        total: stats.total,
        current: stats.total,
        message: '验证数据完整性...',
        errors
      });
      const validationResult = await this.validateMigration(oldDb);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      // 迁移完成
      this.updateProgress({
        stage: 'completed',
        progress: 100,
        total: stats.total,
        current: stats.total,
        message: '迁移完成',
        errors
      });

      return {
        success: errors.length === 0,
        duration: Date.now() - this.startTime,
        stats: {
          videos: videoResult,
          playlists: playlistResult,
          folders: folderResult,
          history: historyResult,
          settings: settingsResult,
        },
        errors,
        warnings
      };

    } catch (error) {
      const errorMessage = `迁移过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`;
      errors.push(errorMessage);
      
      return {
        success: false,
        duration: Date.now() - this.startTime,
        stats: {
          videos: { migrated: 0, failed: 0 },
          playlists: { migrated: 0, failed: 0 },
          folders: { migrated: 0, failed: 0 },
          history: { migrated: 0, failed: 0 },
          settings: { migrated: 0, failed: 0 },
        },
        errors,
        warnings
      };
    }
  }

  /**
   * 打开旧数据库
   */
  private async openOldDatabase(): Promise<Dexie | null> {
    try {
      const db = new Dexie('VideotapeDB');
      
      // 定义数据库结构（与现有数据库一致）
      db.version(1).stores({
        videos: `
          id,
          title,
          description,
          uri,
          thumbnailUri,
          duration,
          size,
          mimeType,
          createdAt,
          updatedAt,
          playCount,
          lastPlayedAt,
          folderId,
          tags
        `,
        playlists: `
          id,
          name,
          description,
          thumbnailUri,
          createdAt,
          updatedAt,
          videoIds,
          isPrivate
        `,
        folders: `
          id,
          name,
          description,
          parentId,
          createdAt,
          updatedAt,
          videoCount,
          isPrivate
        `,
        playHistory: `
          id,
          videoId,
          playedAt,
          position,
          duration,
          completed
        `,
        settings: `
          theme,
          language,
          autoPlay,
          loop,
          shuffle,
          volume,
          playbackSpeed,
          quality,
          dataSaver,
          backgroundPlay
        `,
      });

      // 测试连接
      await db.tables[0].count();
      return db;
    } catch (error) {
      console.warn('无法打开旧数据库:', error);
      return null;
    }
  }

  /**
   * 获取数据统计
   */
  private async getDataStats(db: Dexie): Promise<{
    videos: number;
    playlists: number;
    folders: number;
    history: number;
    settings: number;
    total: number;
  }> {
    try {
      const [videos, playlists, folders, history, settings] = await Promise.all([
        db.table('videos').count(),
        db.table('playlists').count(),
        db.table('folders').count(),
        db.table('playHistory').count(),
        db.table('settings').count(),
      ]);

      return {
        videos,
        playlists,
        folders,
        history,
        settings,
        total: videos + playlists + folders + history + settings
      };
    } catch (error) {
      console.warn('获取数据统计失败:', error);
      return { videos: 0, playlists: 0, folders: 0, history: 0, settings: 0, total: 0 };
    }
  }

  /**
   * 迁移视频数据
   */
  private async migrateVideos(db: Dexie): Promise<{ migrated: number; failed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let migrated = 0;
    let failed = 0;

    try {
      const oldVideos = await db.table('videos').toArray();
      const newDb = getDatabase();

      for (let i = 0; i < oldVideos.length; i++) {
        const oldVideo = oldVideos[i];
        
        try {
          // 转换数据格式
          const videoData = {
            title: oldVideo.title || '未命名视频',
            description: oldVideo.description,
            uri: oldVideo.uri,
            thumbnailUri: oldVideo.thumbnailUri,
            duration: oldVideo.duration || 0,
            size: oldVideo.size || 0,
            mimeType: oldVideo.mimeType || 'video/mp4',
            playCount: oldVideo.playCount || 0,
            lastPlayedAt: oldVideo.lastPlayedAt ? new Date(oldVideo.lastPlayedAt) : undefined,
            folderId: oldVideo.folderId,
            tags: Array.isArray(oldVideo.tags) ? oldVideo.tags : [],
          };

          await newDb.videos.add(videoData);
          migrated++;

          // 更新进度
          if (i % 10 === 0) {
            this.updateProgress({
              stage: 'videos',
              progress: Math.floor((i / oldVideos.length) * 20),
              total: oldVideos.length,
              current: i,
              message: `迁移视频 ${i}/${oldVideos.length}`,
              errors
            });
          }

        } catch (error) {
          failed++;
          errors.push(`迁移视频 ${oldVideo.id} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

    } catch (error) {
      errors.push(`迁移视频数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return { migrated, failed, errors, warnings };
  }

  /**
   * 迁移播放列表
   */
  private async migratePlaylists(db: Dexie): Promise<{ migrated: number; failed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let migrated = 0;
    let failed = 0;

    try {
      const oldPlaylists = await db.table('playlists').toArray();
      const newDb = getDatabase();

      for (let i = 0; i < oldPlaylists.length; i++) {
        const oldPlaylist = oldPlaylists[i];
        
        try {
          const playlistData = {
            name: oldPlaylist.name || '未命名播放列表',
            description: oldPlaylist.description,
            thumbnailUri: oldPlaylist.thumbnailUri,
            videoIds: Array.isArray(oldPlaylist.videoIds) ? oldPlaylist.videoIds : [],
            isPrivate: oldPlaylist.isPrivate || false,
          };

          await newDb.playlists.add(playlistData);
          migrated++;

        } catch (error) {
          failed++;
          errors.push(`迁移播放列表 ${oldPlaylist.id} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

    } catch (error) {
      errors.push(`迁移播放列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return { migrated, failed, errors, warnings };
  }

  /**
   * 迁移文件夹
   */
  private async migrateFolders(db: Dexie): Promise<{ migrated: number; failed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let migrated = 0;
    let failed = 0;

    try {
      const oldFolders = await db.table('folders').toArray();
      const newDb = getDatabase();

      for (let i = 0; i < oldFolders.length; i++) {
        const oldFolder = oldFolders[i];
        
        try {
          const folderData = {
            name: oldFolder.name || '未命名文件夹',
            description: oldFolder.description,
            parentId: oldFolder.parentId,
            videoCount: oldFolder.videoCount || 0,
            isPrivate: oldFolder.isPrivate || false,
          };

          await newDb.folders.add(folderData);
          migrated++;

        } catch (error) {
          failed++;
          errors.push(`迁移文件夹 ${oldFolder.id} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

    } catch (error) {
      errors.push(`迁移文件夹失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return { migrated, failed, errors, warnings };
  }

  /**
   * 迁移播放历史
   */
  private async migrateHistory(db: Dexie): Promise<{ migrated: number; failed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let migrated = 0;
    let failed = 0;

    try {
      const oldHistory = await db.table('playHistory').toArray();
      const newDb = getDatabase();

      for (let i = 0; i < oldHistory.length; i++) {
        const oldRecord = oldHistory[i];
        
        try {
          const historyData = {
            videoId: oldRecord.videoId,
            playedAt: oldRecord.playedAt ? new Date(oldRecord.playedAt) : new Date(),
            position: oldRecord.position || 0,
            duration: oldRecord.duration || 0,
            completed: oldRecord.completed || false,
          };

          await newDb.playHistory.add(historyData);
          migrated++;

        } catch (error) {
          failed++;
          errors.push(`迁移播放历史 ${oldRecord.id} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

    } catch (error) {
      errors.push(`迁移播放历史失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return { migrated, failed, errors, warnings };
  }

  /**
   * 迁移设置
   */
  private async migrateSettings(db: Dexie): Promise<{ migrated: number; failed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let migrated = 0;
    let failed = 0;

    try {
      const oldSettings = await db.table('settings').toArray();
      const newDb = getDatabase();

      if (oldSettings.length > 0) {
        const settings = oldSettings[0];
        
        try {
          const settingsData = {
            theme: settings.theme || 'auto',
            language: settings.language || 'zh-CN',
            autoPlay: settings.autoPlay ?? true,
            loop: settings.loop ?? false,
            shuffle: settings.shuffle ?? false,
            volume: settings.volume ?? 1.0,
            playbackSpeed: settings.playbackSpeed ?? 1.0,
            quality: settings.quality || 'auto',
            dataSaver: settings.dataSaver ?? false,
            backgroundPlay: settings.backgroundPlay ?? false,
          };

          await newDb.settings.update(settingsData);
          migrated++;

        } catch (error) {
          failed++;
          errors.push(`迁移设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

    } catch (error) {
      errors.push(`迁移设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return { migrated, failed, errors, warnings };
  }

  /**
   * 验证迁移结果
   */
  private async validateMigration(oldDb: Dexie): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const newDb = getDatabase();

    try {
      // 验证视频数量
      const oldVideoCount = await oldDb.table('videos').count();
      const newVideoCount = newDb.videos.getAll().length;
      
      if (oldVideoCount !== newVideoCount) {
        warnings.push(`视频数量不匹配: 旧数据库 ${oldVideoCount}, 新数据库 ${newVideoCount}`);
      }

      // 验证播放列表数量
      const oldPlaylistCount = await oldDb.table('playlists').count();
      const newPlaylistCount = newDb.playlists.getAll().length;
      
      if (oldPlaylistCount !== newPlaylistCount) {
        warnings.push(`播放列表数量不匹配: 旧数据库 ${oldPlaylistCount}, 新数据库 ${newPlaylistCount}`);
      }

      // 验证文件夹数量
      const oldFolderCount = await oldDb.table('folders').count();
      const newFolderCount = newDb.folders.getAll().length;
      
      if (oldFolderCount !== newFolderCount) {
        warnings.push(`文件夹数量不匹配: 旧数据库 ${oldFolderCount}, 新数据库 ${newFolderCount}`);
      }

      // 验证数据完整性
      const videos = newDb.videos.getAll();
      for (const video of videos) {
        if (!video.uri) {
          errors.push(`视频 ${video.id} 缺少URI`);
        }
        if (!video.title) {
          errors.push(`视频 ${video.id} 缺少标题`);
        }
      }

    } catch (error) {
      errors.push(`验证迁移结果失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return { errors, warnings };
  }

  /**
   * 更新进度
   */
  private updateProgress(progress: MigrationProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /**
   * 创建备份
   */
  async createBackup(): Promise<string> {
    const newDb = getDatabase();
    return await newDb.batch.backup();
  }

  /**
   * 清理旧数据库
   */
  async cleanupOldData(): Promise<void> {
    try {
      const db = new Dexie('VideotapeDB');
      await db.delete();
      console.log('旧数据库已清理');
    } catch (error) {
      console.warn('清理旧数据库失败:', error);
    }
  }
}

/**
 * 执行迁移的便捷函数
 */
export async function migrateData(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const migrationService = new DataMigrationService(onProgress);
  return await migrationService.migrate();
}

/**
 * 检查是否需要迁移
 */
export async function needsMigration(): Promise<boolean> {
  try {
    // 检查旧数据库是否存在
    const oldDb = new Dexie('VideotapeDB');
    await oldDb.tables[0].count();
    await oldDb.close();
    
    // 检查新数据库是否已有数据
    const newDb = getDatabase();
    const stats = newDb.utils.getStats();
    
    // 如果旧数据库存在且新数据库为空，则需要迁移
    return stats.videoCount === 0 && stats.playlistCount === 0;
  } catch (error) {
    return false;
  }
}

export default DataMigrationService;