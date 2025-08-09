/**
 * 统一的 Realm 数据库服务
 * 解决类型错误和依赖冗余问题
 */

import Realm from 'realm';
import { Video, Playlist, Folder, PlayHistory, AppSettings, defaultAppSettings } from './realm-schema';
import { RealmTypeAdapter } from './realm-type-adapter';

/**
 * 数据库操作接口
 */
export interface DatabaseOperations {
  // 视频操作
  videos: {
    add: (video: VideoInput) => Promise<Video>;
    update: (id: string, updates: Partial<VideoInput>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getById: (id: string) => Video | null;
    getAll: () => Video[];
    search: (query: string, options?: SearchOptions) => Video[];
    getByFolder: (folderId: string) => Video[];
    getRecent: (limit?: number) => Video[];
    getMostPlayed: (limit?: number) => Video[];
  };

  // 播放列表操作
  playlists: {
    add: (playlist: PlaylistInput) => Promise<Playlist>;
    update: (id: string, updates: Partial<PlaylistInput>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getById: (id: string) => Playlist | null;
    getAll: () => Playlist[];
    addVideoToPlaylist: (playlistId: string, videoId: string) => Promise<void>;
    removeVideoFromPlaylist: (playlistId: string, videoId: string) => Promise<void>;
  };

  // 文件夹操作
  folders: {
    add: (folder: FolderInput) => Promise<Folder>;
    update: (id: string, updates: Partial<FolderInput>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getById: (id: string) => Folder | null;
    getAll: () => Folder[];
    getRootFolders: () => Folder[];
    getSubFolders: (parentId: string) => Folder[];
  };

  // 播放历史操作
  playHistory: {
    add: (history: PlayHistoryInput) => Promise<PlayHistory>;
    update: (id: string, updates: Partial<PlayHistoryInput>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getByVideo: (videoId: string) => PlayHistory[];
    getRecent: (limit?: number) => PlayHistory[];
    clear: () => Promise<void>;
  };

  // 设置操作
  settings: {
    get: () => AppSettings;
    update: (updates: Partial<SettingsInput>) => Promise<void>;
    reset: () => Promise<void>;
  };

  // 批量操作
  batch: {
    write: (operations: () => void) => Promise<void>;
    backup: () => Promise<string>;
    restore: (backupPath: string) => Promise<void>;
  };

  // 工具方法
  utils: {
    generateId: () => string;
    close: () => void;
    compact: () => Promise<void>;
    getStats: () => DatabaseStats;
  };
}

/**
 * 输入类型定义（简化版，不包含 Realm 特有字段）
 */
export interface VideoInput {
  title: string;
  description?: string;
  uri: string;
  thumbnailUri?: string;
  duration: number;
  size: number;
  mimeType: string;
  playCount?: number;
  lastPlayedAt?: Date;
  folderId?: string;
  tags?: string[];
  fileSize?: number;
  format?: string;
  quality?: string;
  playbackProgress?: number;
  viewCount?: number;
}

export interface PlaylistInput {
  name: string;
  description?: string;
  thumbnailUri?: string;
  videoIds?: string[];
  isPrivate?: boolean;
}

export interface FolderInput {
  name: string;
  description?: string;
  parentId?: string;
  videoCount?: number;
  isPrivate?: boolean;
}

export interface PlayHistoryInput {
  videoId: string;
  playedAt: Date;
  position: number;
  duration: number;
  completed: boolean;
  playbackSpeed?: number;
  volume?: number;
  deviceInfo?: string;
}

export interface SettingsInput {
  theme?: string;
  language?: string;
  autoPlay?: boolean;
  loop?: boolean;
  shuffle?: boolean;
  volume?: number;
  playbackSpeed?: number;
  quality?: string;
  dataSaver?: boolean;
  backgroundPlay?: boolean;
  syncEnabled?: boolean;
  analyticsEnabled?: boolean;
  crashReportingEnabled?: boolean;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  sortBy?: 'title' | 'date' | 'duration' | 'size' | 'playCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  filters?: {
    folderId?: string;
    tags?: string[];
    mimeType?: string;
    quality?: string;
  };
}

/**
 * 数据库统计信息
 */
export interface DatabaseStats {
  videoCount: number;
  playlistCount: number;
  folderCount: number;
  historyCount: number;
  totalSize: number;
  lastBackup?: Date;
  version: number;
}

/**
 * 统一的 Realm 数据库服务
 */
export class UnifiedRealmService implements DatabaseOperations {
  private realm: Realm;
  private isInitialized = false;

  constructor() {
    this.realm = new Realm(RealmTypeAdapter.createRealmConfig());
    this.isInitialized = true;
    this.initializeDefaultData();
  }

  /**
   * 初始化默认数据
   */
  private initializeDefaultData(): void {
    try {
      const existingSettings = this.realm.objectForPrimaryKey('AppSettings', 'default');
      if (!existingSettings) {
        this.realm.write(() => {
          this.realm.create('AppSettings', defaultAppSettings);
        });
      }
    } catch (error) {
      console.error('初始化默认数据失败:', error);
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 确定视频质量
   */
  private determineQuality(fileSize: number): string {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB > 100) return 'high';
    if (sizeInMB > 20) return 'medium';
    return 'low';
  }

  // 视频操作
  videos = {
    add: async (videoData: VideoInput): Promise<Video> => {
      return new Promise((resolve, reject) => {
        try {
          const id = this.generateId();
          const realmVideoData = RealmTypeAdapter.toRealmVideo({
            ...videoData,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          this.realm.write(() => {
            const video = this.realm.create('Video', realmVideoData);
            resolve(RealmTypeAdapter.fromRealmVideo(video as any));
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    update: async (id: string, updates: Partial<VideoInput>): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const video = this.realm.objectForPrimaryKey('Video', id);
          if (!video) {
            reject(new Error('视频不存在'));
            return;
          }

          this.realm.write(() => {
            Object.assign(video, updates, { updatedAt: new Date() });

            // 更新索引字段
            RealmTypeAdapter.updateVideoIndexes(video, updates);

            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    delete: async (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const video = this.realm.objectForPrimaryKey('Video', id);
          if (!video) {
            reject(new Error('视频不存在'));
            return;
          }

          this.realm.write(() => {
            this.realm.delete(video);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    getById: (id: string): Video | null => {
      const result = this.realm.objectForPrimaryKey('Video', id);
      return result ? RealmTypeAdapter.fromRealmVideo(result as any) : null;
    },

    getAll: (): Video[] => {
      return this.realm.objects('Video').map((v: any) => RealmTypeAdapter.fromRealmVideo(v));
    },

    search: (query: string, options: SearchOptions = {}): Video[] => {
      const {
        sortBy = 'date',
        sortOrder = 'desc',
        limit = 50,
        offset = 0,
        filters = {}
      } = options;

      let results = this.realm.objects('Video');

      // 文本搜索
      if (query.trim()) {
        results = results.filtered(
          'titleIndexed CONTAINS[c] $0 OR tags CONTAINS[c] $0',
          query.toLowerCase()
        );
      }

      // 应用过滤器
      if (filters.folderId) {
        results = results.filtered('folderIdIndexed == $0', filters.folderId);
      }
      if (filters.mimeType) {
        results = results.filtered('mimeType == $0', filters.mimeType);
      }
      if (filters.quality) {
        results = results.filtered('quality == $0', filters.quality);
      }
      if (filters.tags && filters.tags.length > 0) {
        const tagFilter = filters.tags.map(tag => `tags CONTAINS[c] "${tag}"`).join(' OR ');
        results = results.filtered(tagFilter);
      }

      // 排序
      switch (sortBy) {
        case 'title':
          results = results.sorted('titleIndexed', sortOrder === 'asc');
          break;
        case 'duration':
          results = results.sorted('duration', sortOrder === 'asc');
          break;
        case 'size':
          results = results.sorted('fileSize', sortOrder === 'asc');
          break;
        case 'playCount':
          results = results.sorted('playCount', sortOrder === 'asc');
          break;
        case 'date':
        default:
          results = results.sorted('createdAtIndexed', sortOrder === 'asc');
          break;
      }

      // 分页
      return results.slice(offset, offset + limit).map((v: any) => RealmTypeAdapter.fromRealmVideo(v));
    },

    getByFolder: (folderId: string): Video[] => {
      return this.realm.objects('Video')
        .filtered('folderIdIndexed == $0', folderId)
        .sorted('createdAtIndexed', true)
        .map((v: any) => RealmTypeAdapter.fromRealmVideo(v));
    },

    getRecent: (limit: number = 20): Video[] => {
      return this.realm.objects('Video')
        .sorted('createdAtIndexed', true)
        .slice(0, limit)
        .map((v: any) => RealmTypeAdapter.fromRealmVideo(v));
    },

    getMostPlayed: (limit: number = 20): Video[] => {
      return this.realm.objects('Video')
        .sorted('playCount', true)
        .slice(0, limit)
        .map((v: any) => RealmTypeAdapter.fromRealmVideo(v));
    },
  };

  // 播放列表操作
  playlists = {
    add: async (playlistData: PlaylistInput): Promise<Playlist> => {
      return new Promise((resolve, reject) => {
        try {
          const id = this.generateId();
          const realmPlaylistData = RealmTypeAdapter.toRealmPlaylist({
            ...playlistData,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          this.realm.write(() => {
            const playlist = this.realm.create('Playlist', realmPlaylistData);
            resolve(RealmTypeAdapter.fromRealmPlaylist(playlist as any));
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    update: async (id: string, updates: Partial<PlaylistInput>): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const playlist = this.realm.objectForPrimaryKey('Playlist', id);
          if (!playlist) {
            reject(new Error('播放列表不存在'));
            return;
          }

          this.realm.write(() => {
            Object.assign(playlist, updates, { updatedAt: new Date() });

            // 更新索引字段
            RealmTypeAdapter.updatePlaylistIndexes(playlist, updates);

            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    delete: async (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const playlist = this.realm.objectForPrimaryKey('Playlist', id);
          if (!playlist) {
            reject(new Error('播放列表不存在'));
            return;
          }

          this.realm.write(() => {
            this.realm.delete(playlist);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    getById: (id: string): Playlist | null => {
      const result = this.realm.objectForPrimaryKey('Playlist', id);
      return result ? RealmTypeAdapter.fromRealmPlaylist(result as any) : null;
    },

    getAll: (): Playlist[] => {
      return this.realm.objects('Playlist').map((p: any) => RealmTypeAdapter.fromRealmPlaylist(p));
    },

    addVideoToPlaylist: async (playlistId: string, videoId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const playlist = this.realm.objectForPrimaryKey('Playlist', playlistId);
          if (!playlist) {
            reject(new Error('播放列表不存在'));
            return;
          }

          this.realm.write(() => {
            const videoIds = (playlist as any).videoIds as string[];
            if (!videoIds.includes(videoId)) {
              videoIds.push(videoId);
              (playlist as any).updatedAt = new Date();
            }
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    removeVideoFromPlaylist: async (playlistId: string, videoId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const playlist = this.realm.objectForPrimaryKey('Playlist', playlistId);
          if (!playlist) {
            reject(new Error('播放列表不存在'));
            return;
          }

          this.realm.write(() => {
            const videoIds = (playlist as any).videoIds as string[];
            const index = videoIds.indexOf(videoId);
            if (index > -1) {
              videoIds.splice(index, 1);
              (playlist as any).updatedAt = new Date();
            }
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },
  };

  // 文件夹操作
  folders = {
    add: async (folderData: FolderInput): Promise<Folder> => {
      return new Promise((resolve, reject) => {
        try {
          const id = this.generateId();
          const realmFolderData = RealmTypeAdapter.toRealmFolder({
            ...folderData,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          this.realm.write(() => {
            const folder = this.realm.create('Folder', realmFolderData);
            resolve(RealmTypeAdapter.fromRealmFolder(folder as any));
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    update: async (id: string, updates: Partial<FolderInput>): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const folder = this.realm.objectForPrimaryKey('Folder', id);
          if (!folder) {
            reject(new Error('文件夹不存在'));
            return;
          }

          this.realm.write(() => {
            Object.assign(folder, updates, { updatedAt: new Date() });

            // 更新索引字段
            RealmTypeAdapter.updateFolderIndexes(folder, updates);

            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    delete: async (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const folder = this.realm.objectForPrimaryKey('Folder', id);
          if (!folder) {
            reject(new Error('文件夹不存在'));
            return;
          }

          this.realm.write(() => {
            this.realm.delete(folder);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    getById: (id: string): Folder | null => {
      const result = this.realm.objectForPrimaryKey('Folder', id);
      return result ? RealmTypeAdapter.fromRealmFolder(result as any) : null;
    },

    getAll: (): Folder[] => {
      return this.realm.objects('Folder').map((f: any) => RealmTypeAdapter.fromRealmFolder(f));
    },

    getRootFolders: (): Folder[] => {
      return this.realm.objects('Folder')
        .filtered('parentIdIndexed == ""')
        .sorted('nameIndexed', false)
        .map((f: any) => RealmTypeAdapter.fromRealmFolder(f));
    },

    getSubFolders: (parentId: string): Folder[] => {
      return this.realm.objects('Folder')
        .filtered('parentIdIndexed == $0', parentId)
        .sorted('nameIndexed', false)
        .map((f: any) => RealmTypeAdapter.fromRealmFolder(f));
    },
  };

  // 播放历史操作
  playHistory = {
    add: async (historyData: PlayHistoryInput): Promise<PlayHistory> => {
      return new Promise((resolve, reject) => {
        try {
          const id = this.generateId();
          const realmHistoryData = RealmTypeAdapter.toRealmPlayHistory({
            ...historyData,
            id,
          });

          this.realm.write(() => {
            const history = this.realm.create('PlayHistory', realmHistoryData);
            resolve(RealmTypeAdapter.fromRealmPlayHistory(history as any));
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    update: async (id: string, updates: Partial<PlayHistoryInput>): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const history = this.realm.objectForPrimaryKey('PlayHistory', id);
          if (!history) {
            reject(new Error('播放历史不存在'));
            return;
          }

          this.realm.write(() => {
            Object.assign(history, updates);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    delete: async (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const history = this.realm.objectForPrimaryKey('PlayHistory', id);
          if (!history) {
            reject(new Error('播放历史不存在'));
            return;
          }

          this.realm.write(() => {
            this.realm.delete(history);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    getByVideo: (videoId: string): PlayHistory[] => {
      return this.realm.objects('PlayHistory')
        .filtered('videoIdIndexed == $0', videoId)
        .sorted('playedAtIndexed', true)
        .map((h: any) => RealmTypeAdapter.fromRealmPlayHistory(h));
    },

    getRecent: (limit: number = 50): PlayHistory[] => {
      return this.realm.objects('PlayHistory')
        .sorted('playedAtIndexed', true)
        .slice(0, limit)
        .map((h: any) => RealmTypeAdapter.fromRealmPlayHistory(h));
    },

    clear: async (): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          this.realm.write(() => {
            const histories = this.realm.objects('PlayHistory');
            this.realm.delete(histories);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },
  };

  // 设置操作
  settings = {
    get: (): AppSettings => {
      const settings = this.realm.objectForPrimaryKey('AppSettings', 'default');
      return settings ? RealmTypeAdapter.fromRealmAppSettings(settings as any) : (defaultAppSettings as AppSettings);
    },

    update: async (updates: Partial<SettingsInput>): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const settings = this.realm.objectForPrimaryKey('AppSettings', 'default');
          if (!settings) {
            reject(new Error('设置不存在'));
            return;
          }

          this.realm.write(() => {
            Object.assign(settings, updates, { lastUpdated: new Date() });
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    reset: async (): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          this.realm.write(() => {
            const settings = this.realm.objectForPrimaryKey('AppSettings', 'default');
            if (settings) {
              this.realm.delete(settings);
            }
            this.realm.create('AppSettings', defaultAppSettings);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },
  };

  // 批量操作
  batch = {
    write: async (operations: () => void): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          this.realm.write(() => {
            operations();
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    backup: async (): Promise<string> => {
      return new Promise((resolve, reject) => {
        try {
          const backupPath = `${this.realm.path}.backup`;
          this.realm.writeCopyTo(backupPath as any);
          resolve(backupPath);
        } catch (error) {
          reject(error);
        }
      });
    },

    restore: async (backupPath: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          // 关闭当前数据库
          this.realm.close();

          // 恢复备份
          Realm.open({
            schema: [Video, Playlist, Folder, PlayHistory, AppSettings],
            schemaVersion: 1,
            path: backupPath,
          } as Realm.Configuration).then((realm: any) => {
            // 将恢复的数据复制到主数据库
            realm.writeCopyTo(this.realm.path as any);
            realm.close();

            // 重新打开主数据库
            this.realm = new Realm(RealmTypeAdapter.createRealmConfig());
            resolve();
          }).catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    },
  };

  // 工具方法
  utils = {
    generateId: (): string => {
      return this.generateId();
    },

    close: (): void => {
      if (this.isInitialized && !this.realm.isClosed) {
        this.realm.close();
        this.isInitialized = false;
      }
    },

    compact: async (): Promise<void> => {
      try {
        await this.realm.compact();
      } catch (error) {
        throw error;
      }
    },

    getStats: (): DatabaseStats => {
      return {
        videoCount: this.realm.objects('Video').length,
        playlistCount: this.realm.objects('Playlist').length,
        folderCount: this.realm.objects('Folder').length,
        historyCount: this.realm.objects('PlayHistory').length,
        totalSize: this.realm.objects('Video').sum('fileSize'),
        lastBackup: undefined,
        version: 1,
      };
    },
  };

  /**
   * 销毁实例
   */
  destroy(): void {
    this.utils.close();
  }
}

// 全局实例
let databaseInstance: UnifiedRealmService | null = null;

/**
 * 获取数据库实例
 */
export function getUnifiedDatabase(): UnifiedRealmService {
  if (!databaseInstance) {
    databaseInstance = new UnifiedRealmService();
  }
  return databaseInstance;
}

/**
 * 关闭数据库连接
 */
export function closeUnifiedDatabase(): void {
  if (databaseInstance) {
    databaseInstance.destroy();
    databaseInstance = null;
  }
}

export default UnifiedRealmService;
