/**
 * Realm 数据模型定义
 */

import Realm from 'realm';

/**
 * 视频实体 Realm 模型
 */
export class Video extends Realm.Object {
  static schema: Realm.ObjectSchema = {
    name: 'Video',
    primaryKey: 'id',
    properties: {
      id: 'string',
      title: 'string',
      description: 'string?',
      uri: 'string',
      thumbnailUri: 'string?',
      duration: 'double',
      size: 'int',
      mimeType: 'string',
      createdAt: 'date',
      updatedAt: 'date',
      playCount: 'int',
      lastPlayedAt: 'date?',
      folderId: 'string?',
      tags: 'string[]',
      
      // 新增字段用于优化查询
      fileSize: 'int',
      resolution: 'string?',
      format: 'string',
      quality: 'string?',
      playbackProgress: 'double',
      viewCount: 'int',
      
      // 索引字段
      titleIndexed: { type: 'string', indexed: true },
      folderIdIndexed: { type: 'string', indexed: true },
      createdAtIndexed: { type: 'date', indexed: true },
    }
  };

  id!: string;
  title!: string;
  description?: string;
  uri!: string;
  thumbnailUri?: string;
  duration!: number;
  size!: number;
  mimeType!: string;
  createdAt!: Date;
  updatedAt!: Date;
  playCount!: number;
  lastPlayedAt?: Date;
  folderId?: string;
  tags!: string[];
  
  // 新增字段
  fileSize!: number;
  resolution?: string;
  format!: string;
  quality?: string;
  playbackProgress!: number;
  viewCount!: number;
  
  // 索引字段
  titleIndexed!: string;
  folderIdIndexed!: string;
  createdAtIndexed!: Date;
}

/**
 * 播放列表实体 Realm 模型
 */
export class Playlist extends Realm.Object {
  static schema: Realm.ObjectSchema = {
    name: 'Playlist',
    primaryKey: 'id',
    properties: {
      id: 'string',
      name: 'string',
      description: 'string?',
      thumbnailUri: 'string?',
      createdAt: 'date',
      updatedAt: 'date',
      videoIds: 'string[]',
      isPrivate: 'boolean',
      
      // 关系字段暂时移除，简化实现
      // videos: { type: 'linkingObjects', objectType: 'Video', property: 'playlistIds' },
      
      // 索引字段
      nameIndexed: { type: 'string', indexed: true },
      createdAtIndexed: { type: 'date', indexed: true },
    }
  };

  id!: string;
  name!: string;
  description?: string;
  thumbnailUri?: string;
  createdAt!: Date;
  updatedAt!: Date;
  videoIds!: string[];
  isPrivate!: boolean;
  
  // 关系字段暂时移除
  // videos!: Realm.Results<Video> & Realm.Object[];
  
  // 索引字段
  nameIndexed!: string;
  createdAtIndexed!: Date;
}

/**
 * 文件夹实体 Realm 模型
 */
export class Folder extends Realm.Object {
  static schema: Realm.ObjectSchema = {
    name: 'Folder',
    primaryKey: 'id',
    properties: {
      id: 'string',
      name: 'string',
      description: 'string?',
      parentId: 'string?',
      createdAt: 'date',
      updatedAt: 'date',
      videoCount: 'int',
      isPrivate: 'boolean',
      
      // 关系字段暂时移除，简化实现
      // parentFolder: 'Folder?',
      // subFolders: { type: 'linkingObjects', objectType: 'Folder', property: 'parentFolder' },
      // videos: { type: 'linkingObjects', objectType: 'Video', property: 'folderId' },
      
      // 索引字段
      nameIndexed: { type: 'string', indexed: true },
      parentIdIndexed: { type: 'string', indexed: true },
      createdAtIndexed: { type: 'date', indexed: true },
    }
  };

  id!: string;
  name!: string;
  description?: string;
  parentId?: string;
  createdAt!: Date;
  updatedAt!: Date;
  videoCount!: number;
  isPrivate!: boolean;
  
  // 关系字段暂时移除
  // parentFolder?: Folder;
  // subFolders!: Realm.Results<Folder> & Realm.Object[];
  // videos!: Realm.Results<Video> & Realm.Object[];
  
  // 索引字段
  nameIndexed!: string;
  parentIdIndexed!: string;
  createdAtIndexed!: Date;
}

/**
 * 播放历史记录 Realm 模型
 */
export class PlayHistory extends Realm.Object {
  static schema: Realm.ObjectSchema = {
    name: 'PlayHistory',
    primaryKey: 'id',
    properties: {
      id: 'string',
      videoId: 'string',
      playedAt: 'date',
      position: 'double',
      duration: 'double',
      completed: 'boolean',
      
      // 关系字段暂时移除，简化实现
      // video: { type: 'Video', optional: true },
      
      // 新增字段
      playbackSpeed: 'double',
      volume: 'double',
      deviceInfo: 'string?',
      
      // 索引字段
      videoIdIndexed: { type: 'string', indexed: true },
      playedAtIndexed: { type: 'date', indexed: true },
    }
  };

  id!: string;
  videoId!: string;
  playedAt!: Date;
  position!: number;
  duration!: number;
  completed!: boolean;
  
  // 关系字段暂时移除
  // video?: Video;
  
  // 新增字段
  playbackSpeed!: number;
  volume!: number;
  deviceInfo?: string;
  
  // 索引字段
  videoIdIndexed!: string;
  playedAtIndexed!: Date;
}

/**
 * 应用设置 Realm 模型
 */
export class AppSettings extends Realm.Object {
  static schema: Realm.ObjectSchema = {
    name: 'AppSettings',
    primaryKey: 'id',
    properties: {
      id: 'string',
      theme: 'string',
      language: 'string',
      autoPlay: 'boolean',
      loop: 'boolean',
      shuffle: 'boolean',
      volume: 'double',
      playbackSpeed: 'double',
      quality: 'string',
      dataSaver: 'boolean',
      backgroundPlay: 'boolean',
      
      // 新增字段
      lastUpdated: 'date',
      syncEnabled: 'boolean',
      analyticsEnabled: 'boolean',
      crashReportingEnabled: 'boolean',
      
      // 复杂设置对象暂时移除，简化实现
      // playbackPreferences: 'PlaybackPreferences?',
      // uiPreferences: 'UIPreferences?',
      // networkPreferences: 'NetworkPreferences?',
    }
  };

  id!: string;
  theme!: string;
  language!: string;
  autoPlay!: boolean;
  loop!: boolean;
  shuffle!: boolean;
  volume!: number;
  playbackSpeed!: number;
  quality!: string;
  dataSaver!: boolean;
  backgroundPlay!: boolean;
  
  // 新增字段
  lastUpdated!: Date;
  syncEnabled!: boolean;
  analyticsEnabled!: boolean;
  crashReportingEnabled!: boolean;
  
  // 复杂设置对象暂时移除
  // playbackPreferences?: PlaybackPreferences;
  // uiPreferences?: UIPreferences;
  // networkPreferences?: NetworkPreferences;
}

/**
 * 播放偏好设置嵌套对象（暂时禁用）
 */
// export class PlaybackPreferences extends Realm.Object { ... }

/**
 * UI 偏好设置嵌套对象（暂时禁用）
 */
// export class UIPreferences extends Realm.Object { ... }

/**
 * 网络偏好设置嵌套对象（暂时禁用）
 */
// export class NetworkPreferences extends Realm.Object { ... }

/**
 * 数据库配置
 */
export const realmConfig = {
  schema: [
    Video,
    Playlist,
    Folder,
    PlayHistory,
    AppSettings,
  ],
  schemaVersion: 1,
  path: 'videotape.realm',
  // 删除旧版本数据库（开发阶段）
  deleteRealmIfMigrationNeeded: false,
};

/**
 * 数据库默认值
 */
export const defaultAppSettings: Partial<AppSettings> = {
  id: 'default',
  theme: 'auto',
  language: 'zh-CN',
  autoPlay: true,
  loop: false,
  shuffle: false,
  volume: 1.0,
  playbackSpeed: 1.0,
  quality: 'auto',
  dataSaver: false,
  backgroundPlay: false,
  lastUpdated: new Date(),
  syncEnabled: false,
  analyticsEnabled: false,
  crashReportingEnabled: true,
  // 简化配置，暂时移除嵌套对象
  // playbackPreferences: { ... },
  // uiPreferences: { ... },
  // networkPreferences: { ... },
};

/**
 * 类型导出
 */
export type RealmVideo = Video;
export type RealmPlaylist = Playlist;
export type RealmFolder = Folder;
export type RealmPlayHistory = PlayHistory;
export type RealmAppSettings = AppSettings;
// 嵌套对象类型暂时禁用
// export type RealmPlaybackPreferences = PlaybackPreferences;
// export type RealmUIPreferences = UIPreferences;
// export type RealmNetworkPreferences = NetworkPreferences;

/**
 * 数据库接口
 */
export interface AppDatabase {
  realm: Realm;
  
  // 视频操作
  videos: {
    add: (video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Video>;
    update: (id: string, updates: Partial<Video>) => Promise<void>;
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
    add: (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Playlist>;
    update: (id: string, updates: Partial<Playlist>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getById: (id: string) => Playlist | null;
    getAll: () => Playlist[];
    addVideoToPlaylist: (playlistId: string, videoId: string) => Promise<void>;
    removeVideoFromPlaylist: (playlistId: string, videoId: string) => Promise<void>;
  };
  
  // 文件夹操作
  folders: {
    add: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Folder>;
    update: (id: string, updates: Partial<Folder>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getById: (id: string) => Folder | null;
    getAll: () => Folder[];
    getRootFolders: () => Folder[];
    getSubFolders: (parentId: string) => Folder[];
  };
  
  // 播放历史操作
  playHistory: {
    add: (history: Omit<PlayHistory, 'id'>) => Promise<PlayHistory>;
    update: (id: string, updates: Partial<PlayHistory>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getByVideo: (videoId: string) => PlayHistory[];
    getRecent: (limit?: number) => PlayHistory[];
    clear: () => Promise<void>;
  };
  
  // 设置操作
  settings: {
    get: () => AppSettings;
    update: (updates: Partial<AppSettings>) => Promise<void>;
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
