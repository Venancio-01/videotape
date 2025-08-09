/**
 * Realm 数据库服务实现
 * 提供完整的数据库操作接口
 */

import Realm from 'realm';
import {
  realmConfig,
  defaultAppSettings,
  AppDatabase,
  Video,
  Playlist,
  Folder,
  PlayHistory,
  AppSettings,
  SearchOptions,
  DatabaseStats,
} from './realm-schema';

/**
 * Realm 数据库服务类
 */
export class RealmDatabaseService implements AppDatabase {
  public realm: Realm;
  private isInitialized = false;

  constructor() {
    this.realm = new Realm(realmConfig);
    this.isInitialized = true;
    this.initializeDefaultData();
  }

  /**
   * 初始化默认数据
   */
  private initializeDefaultData(): void {
    try {
      // 检查是否已存在默认设置
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

  // 视频操作
  videos = {
    add: async (videoData: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<Video> => {
      return new Promise((resolve, reject) => {
        try {
          const id = this.generateId();
          const now = new Date();
          
          this.realm.write(() => {
            const video = this.realm.create('Video', {
              id,
              ...videoData,
              createdAt: now,
              updatedAt: now,
              playCount: 0,
              tags: videoData.tags || [],
              fileSize: videoData.size,
              format: videoData.mimeType.split('/')[1] || 'unknown',
              quality: this.determineQuality(videoData.size),
              playbackProgress: 0,
              viewCount: 0,
              // 索引字段
              titleIndexed: videoData.title,
              folderIdIndexed: videoData.folderId || '',
              createdAtIndexed: now,
            });
            resolve(video);
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    update: async (id: string, updates: Partial<Video>): Promise<void> => {
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
            if (updates.title) video.titleIndexed = updates.title;
            if (updates.folderId !== undefined) video.folderIdIndexed = updates.folderId || '';
            
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
      return result ? (result as unknown as Video) : null;
    },

    getAll: (): Video[] => {
      return this.realm.objects('Video').map((v: any) => v as Video);
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
      return results.slice(offset, offset + limit).map((v: any) => v as Video);
    },

    getByFolder: (folderId: string): Video[] => {
      return this.realm.objects('Video')
        .filtered('folderIdIndexed == $0', folderId)
        .sorted('createdAtIndexed', true)
        .map((v: any) => v as Video);
    },

    getRecent: (limit: number = 20): Video[] => {
      return this.realm.objects('Video')
        .sorted('createdAtIndexed', true)
        .slice(0, limit)
        .map((v: any) => v as Video);
    },

    getMostPlayed: (limit: number = 20): Video[] => {
      return this.realm.objects('Video')
        .sorted('playCount', true)
        .slice(0, limit)
        .map((v: any) => v as Video);
    },
  };

  // 播放列表操作
  playlists = {
    add: async (playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playlist> => {
      return new Promise((resolve, reject) => {
        try {
          const id = this.generateId();
          const now = new Date();
          
          this.realm.write(() => {
            const playlist = this.realm.create('Playlist', {
              id,
              ...playlistData,
              createdAt: now,
              updatedAt: now,
              videoIds: playlistData.videoIds || [],
              isPrivate: playlistData.isPrivate || false,
              // 索引字段
              nameIndexed: playlistData.name,
              createdAtIndexed: now,
            });
            resolve(playlist);
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    update: async (id: string, updates: Partial<Playlist>): Promise<void> => {
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
            if (updates.name) playlist.nameIndexed = updates.name;
            
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
      return result ? (result as unknown as Playlist) : null;
    },

    getAll: (): Playlist[] => {
      return this.realm.objects('Playlist').map((p: any) => p as Playlist);
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
    add: async (folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> => {
      return new Promise((resolve, reject) => {
        try {
          const id = this.generateId();
          const now = new Date();
          
          this.realm.write(() => {
            const folder = this.realm.create('Folder', {
              id,
              ...folderData,
              createdAt: now,
              updatedAt: now,
              videoCount: 0,
              isPrivate: folderData.isPrivate || false,
              // 索引字段
              nameIndexed: folderData.name,
              parentIdIndexed: folderData.parentId || '',
              createdAtIndexed: now,
            });
            resolve(folder);
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    update: async (id: string, updates: Partial<Folder>): Promise<void> => {
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
            if (updates.name) folder.nameIndexed = updates.name;
            if (updates.parentId !== undefined) folder.parentIdIndexed = updates.parentId || '';
            
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
      return result ? (result as unknown as Folder) : null;
    },

    getAll: (): Folder[] => {
      return this.realm.objects('Folder').map((f: any) => f as Folder);
    },

    getRootFolders: (): Folder[] => {
      return this.realm.objects('Folder')
        .filtered('parentIdIndexed == ""')
        .sorted('nameIndexed', false)
        .map((f: any) => f as Folder);
    },

    getSubFolders: (parentId: string): Folder[] => {
      return this.realm.objects('Folder')
        .filtered('parentIdIndexed == $0', parentId)
        .sorted('nameIndexed', false)
        .map((f: any) => f as Folder);
    },
  };

  // 播放历史操作
  playHistory = {
    add: async (historyData: Omit<PlayHistory, 'id'>): Promise<PlayHistory> => {
      return new Promise((resolve, reject) => {
        try {
          const id = this.generateId();
          
          this.realm.write(() => {
            const history = this.realm.create('PlayHistory', {
              id,
              ...historyData,
              playbackSpeed: historyData.playbackSpeed || 1.0,
              volume: historyData.volume || 1.0,
              // 索引字段
              videoIdIndexed: historyData.videoId,
              playedAtIndexed: historyData.playedAt,
            });
            resolve(history);
          });
        } catch (error) {
          reject(error);
        }
      });
    },

    update: async (id: string, updates: Partial<PlayHistory>): Promise<void> => {
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
        .map((h: any) => h as PlayHistory);
    },

    getRecent: (limit: number = 50): PlayHistory[] => {
      return this.realm.objects('PlayHistory')
        .sorted('playedAtIndexed', true)
        .slice(0, limit)
        .map((h: any) => h as PlayHistory);
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
      return settings ? (settings as unknown as AppSettings) : (defaultAppSettings as AppSettings);
    },

    update: async (updates: Partial<AppSettings>): Promise<void> => {
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
          Realm.open({ ...realmConfig, path: backupPath }).then((realm: any) => {
            // 将恢复的数据复制到主数据库
            realm.writeCopyTo(this.realm.path);
            realm.close();
            
            // 重新打开主数据库
            this.realm = new Realm(realmConfig);
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
      return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        lastBackup: undefined, // 可以从设置中获取
        version: realmConfig.schemaVersion,
      };
    },
  };

  /**
   * 确定视频质量
   */
  private determineQuality(fileSize: number): string {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB > 100) return 'high';
    if (sizeInMB > 20) return 'medium';
    return 'low';
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.utils.close();
  }
}

// 数据库实例
let databaseInstance: RealmDatabaseService | null = null;

/**
 * 获取数据库实例
 */
export function getDatabase(): RealmDatabaseService {
  if (!databaseInstance) {
    databaseInstance = new RealmDatabaseService();
  }
  return databaseInstance;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (databaseInstance) {
    databaseInstance.destroy();
    databaseInstance = null;
  }
}

export default RealmDatabaseService;