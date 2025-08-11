/**
 * 数据库连接和存储服务
 * 基于 Drizzle ORM 和 SQLite 的数据库操作
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { eq, and, or, like, desc, asc, gte, lte, inArray } from 'drizzle-orm';
import {
  files,
  directories,
  videoMetadata,
  videoThumbnails,
  fileCategories,
  fileTags,
  fileSearchIndex,
  fileOperationLogs,
  fileBackupRecords,
  systemConfig,
  playlistTable,
  playlistVideos,
  type File,
  type NewFile,
  type Directory,
  type NewDirectory,
  type VideoMetadata,
  type NewVideoMetadata,
  type VideoThumbnail,
  type NewVideoThumbnail,
  type FileCategory,
  type NewFileCategory,
  type FileTag,
  type NewFileTag,
  type FileSearchIndex,
  type NewFileSearchIndex,
  type FileOperationLog,
  type NewFileOperationLog,
  type FileBackupRecord,
  type NewFileBackupRecord,
  type SystemConfig,
  type NewSystemConfig,
  type Playlist,
  type NewPlaylist,
  type PlaylistVideo,
  type NewPlaylistVideo,
} from './schema';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: ReturnType<typeof drizzle>;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 创建数据库
      const sqlite = openDatabaseSync('videotape.db');
      this.db = drizzle(sqlite);

      // 创建表
      await this.createTables();
      
      this.isInitialized = true;
      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // 创建文件表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        uri TEXT NOT NULL UNIQUE,
        size INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL DEFAULT 'unknown',
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        hash TEXT,
        thumbnail_uri TEXT,
        is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        parent_id TEXT,
        metadata TEXT DEFAULT '{}'
      )
    `);

    // 创建目录表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS directories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        parent_id TEXT,
        is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        item_count INTEGER NOT NULL DEFAULT 0,
        total_size INTEGER NOT NULL DEFAULT 0
      )
    `);

    // 创建视频元数据表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS video_metadata (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        duration REAL NOT NULL DEFAULT 0,
        width INTEGER NOT NULL DEFAULT 0,
        height INTEGER NOT NULL DEFAULT 0,
        bitrate INTEGER NOT NULL DEFAULT 0,
        frame_rate REAL NOT NULL DEFAULT 0,
        codec TEXT NOT NULL DEFAULT 'unknown',
        format TEXT NOT NULL DEFAULT 'unknown',
        has_audio BOOLEAN NOT NULL DEFAULT TRUE,
        audio_codec TEXT,
        audio_bitrate INTEGER,
        audio_channels INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
      )
    `);

    // 创建视频缩略图表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS video_thumbnails (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        uri TEXT NOT NULL,
        timestamp REAL NOT NULL DEFAULT 0,
        width INTEGER NOT NULL DEFAULT 0,
        height INTEGER NOT NULL DEFAULT 0,
        size INTEGER NOT NULL DEFAULT 0,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
      )
    `);

    // 创建文件分类表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS file_categories (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE,
        UNIQUE (file_id, category)
      )
    `);

    // 创建文件标签表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS file_tags (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE,
        UNIQUE (file_id, tag)
      )
    `);

    // 创建文件搜索索引表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS file_search_index (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        searchable_text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
      )
    `);

    // 创建文件操作日志表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS file_operation_logs (
        id TEXT PRIMARY KEY,
        file_id TEXT,
        operation TEXT NOT NULL,
        details TEXT DEFAULT '{}',
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE SET NULL
      )
    `);

    // 创建文件备份记录表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS file_backup_records (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        backup_path TEXT NOT NULL,
        backup_size INTEGER NOT NULL DEFAULT 0,
        compression_ratio REAL NOT NULL DEFAULT 1.0,
        is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
        checksum TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
      )
    `);

    // 创建系统配置表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS system_config (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建播放列表表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        thumbnail_path TEXT,
        video_count INTEGER NOT NULL DEFAULT 0,
        total_duration INTEGER NOT NULL DEFAULT 0,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        play_count INTEGER NOT NULL DEFAULT 0,
        last_played_at TIMESTAMP,
        tags TEXT DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建播放列表视频关联表
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS playlist_videos (
        id TEXT PRIMARY KEY,
        playlist_id TEXT NOT NULL,
        video_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        position INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
        FOREIGN KEY (video_id) REFERENCES files (id) ON DELETE CASCADE,
        UNIQUE (playlist_id, video_id)
      )
    `);

    // 创建索引
    await this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    // 文件表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_files_name ON files(name)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_files_type ON files(type)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_files_is_deleted ON files(is_deleted)`);

    // 目录表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_directories_name ON directories(name)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_directories_path ON directories(path)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_directories_parent_id ON directories(parent_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_directories_is_deleted ON directories(is_deleted)`);

    // 视频元数据表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_video_metadata_file_id ON video_metadata(file_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_video_metadata_duration ON video_metadata(duration)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_video_metadata_resolution ON video_metadata(width, height)`);

    // 视频缩略图表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_video_thumbnails_file_id ON video_thumbnails(file_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_video_thumbnails_timestamp ON video_thumbnails(timestamp)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_video_thumbnails_is_primary ON video_thumbnails(is_primary)`);

    // 文件分类表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_categories_file_id ON file_categories(file_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_categories_category ON file_categories(category)`);

    // 文件标签表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_tags_file_id ON file_tags(file_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag)`);

    // 文件搜索索引表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_search_index_file_id ON file_search_index(file_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_search_index_search_text ON file_search_index(searchable_text)`);

    // 文件操作日志表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_operation_logs_file_id ON file_operation_logs(file_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_operation_logs_operation ON file_operation_logs(operation)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_operation_logs_timestamp ON file_operation_logs(timestamp)`);

    // 文件备份记录表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_backup_records_file_id ON file_backup_records(file_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_backup_records_created_at ON file_backup_records(created_at)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_backup_records_expires_at ON file_backup_records(expires_at)`);

    // 系统配置表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key)`);

    // 播放列表表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlists_name ON playlists(name)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON playlists(is_public)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlists_is_default ON playlists(is_default)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlists_video_count ON playlists(video_count)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlists_play_count ON playlists(play_count)`);

    // 播放列表视频关联表索引
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist_id ON playlist_videos(playlist_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlist_videos_video_id ON playlist_videos(video_id)`);
    await this.db.run(`CREATE INDEX IF NOT EXISTS idx_playlist_videos_sort_order ON playlist_videos(sort_order)`);
  }

  // 文件操作
  async saveFile(file: NewFile): Promise<void> {
    try {
      await this.db.insert(files).values(file);
      
      // 更新搜索索引
      await this.updateSearchIndex(file.id, file.name);
      
      // 记录操作日志
      await this.logOperation('create', file.id, { name: file.name, size: file.size });
    } catch (error) {
      console.error('保存文件失败:', error);
      throw error;
    }
  }

  async getFile(id: string): Promise<File | null> {
    try {
      const result = await this.db
        .select()
        .from(files)
        .where(eq(files.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('获取文件失败:', error);
      throw error;
    }
  }

  async getAllFiles(): Promise<File[]> {
    try {
      return await this.db
        .select()
        .from(files)
        .where(eq(files.isDeleted, false))
        .orderBy(desc(files.createdAt));
    } catch (error) {
      console.error('获取所有文件失败:', error);
      throw error;
    }
  }

  async updateFile(id: string, updates: Partial<NewFile>): Promise<void> {
    try {
      await this.db
        .update(files)
        .set({ ...updates, modifiedAt: new Date() })
        .where(eq(files.id, id));
      
      // 记录操作日志
      await this.logOperation('update', id, updates);
    } catch (error) {
      console.error('更新文件失败:', error);
      throw error;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      await this.db
        .update(files)
        .set({ isDeleted: true, modifiedAt: new Date() })
        .where(eq(files.id, id));
      
      // 记录操作日志
      await this.logOperation('delete', id);
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  async searchFiles(query: string): Promise<File[]> {
    try {
      return await this.db
        .select()
        .from(files)
        .innerJoin(fileSearchIndex, eq(files.id, fileSearchIndex.fileId))
        .where(
          and(
            eq(files.isDeleted, false),
            like(fileSearchIndex.searchableText, `%${query}%`)
          )
        )
        .orderBy(desc(files.createdAt));
    } catch (error) {
      console.error('搜索文件失败:', error);
      throw error;
    }
  }

  // 目录操作
  async saveDirectory(directory: NewDirectory): Promise<void> {
    try {
      await this.db.insert(directories).values(directory);
    } catch (error) {
      console.error('保存目录失败:', error);
      throw error;
    }
  }

  async getDirectory(id: string): Promise<Directory | null> {
    try {
      const result = await this.db
        .select()
        .from(directories)
        .where(eq(directories.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('获取目录失败:', error);
      throw error;
    }
  }

  async getAllDirectories(): Promise<Directory[]> {
    try {
      return await this.db
        .select()
        .from(directories)
        .where(eq(directories.isDeleted, false))
        .orderBy(desc(directories.createdAt));
    } catch (error) {
      console.error('获取所有目录失败:', error);
      throw error;
    }
  }

  async updateDirectory(id: string, updates: Partial<NewDirectory>): Promise<void> {
    try {
      await this.db
        .update(directories)
        .set({ ...updates, modifiedAt: new Date() })
        .where(eq(directories.id, id));
    } catch (error) {
      console.error('更新目录失败:', error);
      throw error;
    }
  }

  async deleteDirectory(id: string): Promise<void> {
    try {
      await this.db
        .update(directories)
        .set({ isDeleted: true, modifiedAt: new Date() })
        .where(eq(directories.id, id));
    } catch (error) {
      console.error('删除目录失败:', error);
      throw error;
    }
  }

  // 视频元数据操作
  async saveVideoMetadata(metadata: NewVideoMetadata): Promise<void> {
    try {
      await this.db.insert(videoMetadata).values(metadata);
    } catch (error) {
      console.error('保存视频元数据失败:', error);
      throw error;
    }
  }

  async getVideoMetadata(fileId: string): Promise<VideoMetadata | null> {
    try {
      const result = await this.db
        .select()
        .from(videoMetadata)
        .where(eq(videoMetadata.fileId, fileId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('获取视频元数据失败:', error);
      throw error;
    }
  }

  async updateVideoMetadata(fileId: string, updates: Partial<NewVideoMetadata>): Promise<void> {
    try {
      await this.db
        .update(videoMetadata)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(videoMetadata.fileId, fileId));
    } catch (error) {
      console.error('更新视频元数据失败:', error);
      throw error;
    }
  }

  // 视频缩略图操作
  async saveVideoThumbnail(thumbnail: NewVideoThumbnail): Promise<void> {
    try {
      await this.db.insert(videoThumbnails).values(thumbnail);
    } catch (error) {
      console.error('保存视频缩略图失败:', error);
      throw error;
    }
  }

  async getVideoThumbnails(fileId: string): Promise<VideoThumbnail[]> {
    try {
      return await this.db
        .select()
        .from(videoThumbnails)
        .where(eq(videoThumbnails.fileId, fileId))
        .orderBy(asc(videoThumbnails.timestamp));
    } catch (error) {
      console.error('获取视频缩略图失败:', error);
      throw error;
    }
  }

  async getPrimaryThumbnail(fileId: string): Promise<VideoThumbnail | null> {
    try {
      const result = await this.db
        .select()
        .from(videoThumbnails)
        .where(
          and(
            eq(videoThumbnails.fileId, fileId),
            eq(videoThumbnails.isPrimary, true)
          )
        )
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('获取主缩略图失败:', error);
      throw error;
    }
  }

  // 文件分类操作
  async addFileCategory(fileId: string, category: string): Promise<void> {
    try {
      await this.db.insert(fileCategories).values({
        id: this.generateId(),
        fileId,
        category,
      });
    } catch (error) {
      console.error('添加文件分类失败:', error);
      throw error;
    }
  }

  async removeFileCategory(fileId: string, category: string): Promise<void> {
    try {
      await this.db
        .delete(fileCategories)
        .where(
          and(
            eq(fileCategories.fileId, fileId),
            eq(fileCategories.category, category)
          )
        );
    } catch (error) {
      console.error('移除文件分类失败:', error);
      throw error;
    }
  }

  async getFileCategories(fileId: string): Promise<string[]> {
    try {
      const result = await this.db
        .select({ category: fileCategories.category })
        .from(fileCategories)
        .where(eq(fileCategories.fileId, fileId));
      
      return result.map(item => item.category);
    } catch (error) {
      console.error('获取文件分类失败:', error);
      throw error;
    }
  }

  // 文件标签操作
  async addFileTag(fileId: string, tag: string): Promise<void> {
    try {
      await this.db.insert(fileTags).values({
        id: this.generateId(),
        fileId,
        tag,
      });
    } catch (error) {
      console.error('添加文件标签失败:', error);
      throw error;
    }
  }

  async removeFileTag(fileId: string, tag: string): Promise<void> {
    try {
      await this.db
        .delete(fileTags)
        .where(
          and(
            eq(fileTags.fileId, fileId),
            eq(fileTags.tag, tag)
          )
        );
    } catch (error) {
      console.error('移除文件标签失败:', error);
      throw error;
    }
  }

  async getFileTags(fileId: string): Promise<string[]> {
    try {
      const result = await this.db
        .select({ tag: fileTags.tag })
        .from(fileTags)
        .where(eq(fileTags.fileId, fileId));
      
      return result.map(item => item.tag);
    } catch (error) {
      console.error('获取文件标签失败:', error);
      throw error;
    }
  }

  // 搜索索引操作
  private async updateSearchIndex(fileId: string, fileName: string): Promise<void> {
    try {
      const searchableText = `${fileName} ${fileName.toLowerCase()} ${fileName.replace(/[^a-zA-Z0-9]/g, ' ')}`;
      
      await this.db.insert(fileSearchIndex).values({
        id: this.generateId(),
        fileId,
        searchableText,
      }).onConflictDoUpdate({
        target: fileSearchIndex.fileId,
        set: { searchableText, updatedAt: new Date() },
      });
    } catch (error) {
      console.error('更新搜索索引失败:', error);
      throw error;
    }
  }

  // 操作日志
  private async logOperation(operation: string, fileId?: string, details?: any): Promise<void> {
    try {
      await this.db.insert(fileOperationLogs).values({
        id: this.generateId(),
        fileId,
        operation,
        details: JSON.stringify(details),
      });
    } catch (error) {
      console.error('记录操作日志失败:', error);
      throw error;
    }
  }

  // 系统配置操作
  async setConfig(key: string, value: any, description?: string): Promise<void> {
    try {
      await this.db.insert(systemConfig).values({
        id: this.generateId(),
        key,
        value: JSON.stringify(value),
        description,
      }).onConflictDoUpdate({
        target: systemConfig.key,
        set: { value: JSON.stringify(value), updatedAt: new Date() },
      });
    } catch (error) {
      console.error('设置系统配置失败:', error);
      throw error;
    }
  }

  async getConfig(key: string): Promise<any> {
    try {
      const result = await this.db
        .select({ value: systemConfig.value })
        .from(systemConfig)
        .where(eq(systemConfig.key, key))
        .limit(1);
      
      if (result[0]) {
        return JSON.parse(result[0].value);
      }
      return null;
    } catch (error) {
      console.error('获取系统配置失败:', error);
      throw error;
    }
  }

  // 统计信息
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    totalVideos: number;
    totalDirectories: number;
  }> {
    try {
      const fileStats = await this.db
        .select({
          count: { count: files.id },
          totalSize: { sum: files.size },
        })
        .from(files)
        .where(eq(files.isDeleted, false));

      const videoStats = await this.db
        .select({ count: { count: videoMetadata.id } })
        .from(videoMetadata)
        .innerJoin(files, eq(videoMetadata.fileId, files.id))
        .where(eq(files.isDeleted, false));

      const directoryStats = await this.db
        .select({ count: { count: directories.id } })
        .from(directories)
        .where(eq(directories.isDeleted, false));

      return {
        totalFiles: fileStats[0]?.count || 0,
        totalSize: fileStats[0]?.totalSize || 0,
        totalVideos: videoStats[0]?.count || 0,
        totalDirectories: directoryStats[0]?.count || 0,
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  // 清理操作
  async cleanup(): Promise<void> {
    try {
      // 清理过期备份记录
      await this.db
        .delete(fileBackupRecords)
        .where(lte(fileBackupRecords.expiresAt, new Date()));

      // 清理已删除的文件（30天后）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await this.db
        .delete(files)
        .where(
          and(
            eq(files.isDeleted, true),
            lte(files.modifiedAt, thirtyDaysAgo)
          )
        );
    } catch (error) {
      console.error('清理数据库失败:', error);
      throw error;
    }
  }

  // 播放列表操作
  async createPlaylist(playlist: Omit<NewPlaylist, 'id'>): Promise<Playlist> {
    try {
      const id = this.generateId();
      const newPlaylist: NewPlaylist = {
        id,
        ...playlist,
        tags: playlist.tags || [],
      };
      
      await this.db.insert(playlistTable).values(newPlaylist);
      
      // 记录操作日志
      await this.logOperation('create_playlist', undefined, { 
        playlistId: id, 
        name: playlist.name 
      });
      
      return { id, ...playlist, tags: playlist.tags || [] } as Playlist;
    } catch (error) {
      console.error('创建播放列表失败:', error);
      throw error;
    }
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    try {
      const result = await this.db
        .select()
        .from(playlistTable)
        .where(eq(playlistTable.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('获取播放列表失败:', error);
      throw error;
    }
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    try {
      return await this.db
        .select()
        .from(playlistTable)
        .orderBy(desc(playlistTable.createdAt));
    } catch (error) {
      console.error('获取所有播放列表失败:', error);
      throw error;
    }
  }

  async updatePlaylist(id: string, updates: Partial<NewPlaylist>): Promise<Playlist> {
    try {
      await this.db
        .update(playlistTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(playlistTable.id, id));
      
      // 记录操作日志
      await this.logOperation('update_playlist', undefined, { 
        playlistId: id, 
        updates 
      });
      
      const updated = await this.getPlaylist(id);
      if (!updated) {
        throw new Error('播放列表更新失败');
      }
      return updated;
    } catch (error) {
      console.error('更新播放列表失败:', error);
      throw error;
    }
  }

  async deletePlaylist(id: string): Promise<void> {
    try {
      // 删除播放列表视频关联
      await this.db
        .delete(playlistVideos)
        .where(eq(playlistVideos.playlistId, id));
      
      // 删除播放列表
      await this.db
        .delete(playlistTable)
        .where(eq(playlistTable.id, id));
      
      // 记录操作日志
      await this.logOperation('delete_playlist', undefined, { 
        playlistId: id 
      });
    } catch (error) {
      console.error('删除播放列表失败:', error);
      throw error;
    }
  }

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
    try {
      // 获取当前最大位置
      const maxPositionResult = await this.db
        .select({ max: { max: playlistVideos.position } })
        .from(playlistVideos)
        .where(eq(playlistVideos.playlistId, playlistId));
      
      const maxPosition = maxPositionResult[0]?.max || 0;
      
      await this.db.insert(playlistVideos).values({
        id: this.generateId(),
        playlistId,
        videoId,
        position: maxPosition + 1,
      });
      
      // 更新播放列表的视频计数
      await this.updatePlaylistVideoCount(playlistId);
      
      // 记录操作日志
      await this.logOperation('add_video_to_playlist', videoId, { 
        playlistId 
      });
    } catch (error) {
      console.error('添加视频到播放列表失败:', error);
      throw error;
    }
  }

  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<void> {
    try {
      await this.db
        .delete(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId)
          )
        );
      
      // 更新播放列表的视频计数
      await this.updatePlaylistVideoCount(playlistId);
      
      // 记录操作日志
      await this.logOperation('remove_video_from_playlist', videoId, { 
        playlistId 
      });
    } catch (error) {
      console.error('从播放列表移除视频失败:', error);
      throw error;
    }
  }

  async getPlaylistVideos(playlistId: string): Promise<File[]> {
    try {
      const result = await this.db
        .select()
        .from(files)
        .innerJoin(playlistVideos, eq(files.id, playlistVideos.videoId))
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(files.isDeleted, false)
          )
        )
        .orderBy(asc(playlistVideos.position));
      
      return result.map(row => row.files);
    } catch (error) {
      console.error('获取播放列表视频失败:', error);
      throw error;
    }
  }

  async getVideoPlaylists(videoId: string): Promise<Playlist[]> {
    try {
      const result = await this.db
        .select()
        .from(playlistTable)
        .innerJoin(playlistVideos, eq(playlistTable.id, playlistVideos.playlistId))
        .where(eq(playlistVideos.videoId, videoId))
        .orderBy(desc(playlistTable.createdAt));
      
      return result.map(row => row.playlists);
    } catch (error) {
      console.error('获取视频的播放列表失败:', error);
      throw error;
    }
  }

  private async updatePlaylistVideoCount(playlistId: string): Promise<void> {
    try {
      const countResult = await this.db
        .select({ count: { count: playlistVideos.id } })
        .from(playlistVideos)
        .where(eq(playlistVideos.playlistId, playlistId));
      
      const videoCount = countResult[0]?.count || 0;
      
      await this.db
        .update(playlistTable)
        .set({ 
          videoCount,
          updatedAt: new Date() 
        })
        .where(eq(playlistTable.id, playlistId));
    } catch (error) {
      console.error('更新播放列表视频计数失败:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}