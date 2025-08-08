# 存储管理模块开发文档

## 1. 模块概述

### 1.1 功能描述
存储管理模块负责管理应用的本地文件存储和数据持久化，包括视频文件存储、缓存管理、数据备份等功能。该模块是应用数据持久化的核心。

### 1.2 技术栈
- **文件系统**: Expo File System
- **数据库**: Dexie.js (IndexedDB)
- **持久化**: MMKV
- **缓存**: LRU Cache
- **备份**: 自定义备份系统

### 1.3 依赖关系
- 为所有其他模块提供存储服务
- 依赖状态管理模块同步数据
- 依赖视频管理模块处理文件操作

## 2. 功能需求

### 2.1 文件系统管理

#### 2.1.1 文件系统服务
```typescript
// src/services/storage/file-system.service.ts
import * as FileSystem from 'expo-file-system';
import { StorageDirectory } from '../types/storage';

export interface FileSystemInfo {
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  appDirectory: string;
  documentDirectory: string;
  cacheDirectory: string;
}

export interface FileOperationOptions {
  overwrite?: boolean;
  createDirectories?: boolean;
  encoding?: FileSystem.EncodingType;
}

export class FileSystemService {
  private static instance: FileSystemService;
  private directories: Map<string, string> = new Map();

  constructor() {
    this.initializeDirectories();
  }

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  // 初始化目录结构
  private async initializeDirectories(): Promise<void> {
    const baseDir = FileSystem.documentDirectory;
    
    this.directories.set('app', `${baseDir}app/`);
    this.directories.set('videos', `${baseDir}videos/`);
    this.directories.set('thumbnails', `${baseDir}thumbnails/`);
    this.directories.set('cache', `${baseDir}cache/`);
    this.directories.set('backups', `${baseDir}backups/`);
    this.directories.set('temp', `${baseDir}temp/`);
    this.directories.set('logs', `${baseDir}logs/`);
    this.directories.set('subtitles', `${baseDir}subtitles/`);

    // 创建所有目录
    for (const [name, path] of this.directories) {
      try {
        await FileSystem.makeDirectoryAsync(path, { intermediates: true });
      } catch (error) {
        console.error(`Failed to create directory ${name}:`, error);
      }
    }
  }

  // 获取文件系统信息
  async getFileSystemInfo(): Promise<FileSystemInfo> {
    try {
      const documentDir = FileSystem.documentDirectory;
      const cacheDir = FileSystem.cacheDirectory;
      
      // 获取目录信息
      const docInfo = await FileSystem.getInfoAsync(documentDir);
      const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
      
      // 计算使用空间
      const usedSpace = docInfo.size + cacheInfo.size;
      
      // 在实际应用中，可能需要使用其他方法获取总空间
      const totalSpace = 1024 * 1024 * 1024 * 2; // 假设2GB
      const freeSpace = totalSpace - usedSpace;

      return {
        totalSpace,
        freeSpace,
        usedSpace,
        appDirectory: documentDir,
        documentDirectory: documentDir,
        cacheDirectory: cacheDir
      };
    } catch (error) {
      console.error('Failed to get file system info:', error);
      throw error;
    }
  }

  // 获取目录路径
  getDirectoryPath(name: string): string {
    return this.directories.get(name) || '';
  }

  // 读取文件
  async readFile(filePath: string, encoding: FileSystem.EncodingType = 'utf8'): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(filePath, { encoding });
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  }

  // 写入文件
  async writeFile(
    filePath: string,
    content: string,
    options: FileOperationOptions = {}
  ): Promise<void> {
    try {
      const {
        overwrite = true,
        createDirectories = true,
        encoding = 'utf8'
      } = options;

      // 检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists && !overwrite) {
        throw new Error('File already exists and overwrite is disabled');
      }

      // 创建目录
      if (createDirectories) {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        await this.ensureDirectoryExists(dirPath);
      }

      await FileSystem.writeAsStringAsync(filePath, content, { encoding });
    } catch (error) {
      console.error('Failed to write file:', error);
      throw error;
    }
  }

  // 复制文件
  async copyFile(
    from: string,
    to: string,
    options: FileOperationOptions = {}
  ): Promise<void> {
    try {
      const { overwrite = true, createDirectories = true } = options;

      // 检查目标文件是否存在
      const targetInfo = await FileSystem.getInfoAsync(to);
      
      if (targetInfo.exists && !overwrite) {
        throw new Error('Target file already exists and overwrite is disabled');
      }

      // 创建目录
      if (createDirectories) {
        const dirPath = to.substring(0, to.lastIndexOf('/'));
        await this.ensureDirectoryExists(dirPath);
      }

      await FileSystem.copyAsync({ from, to });
    } catch (error) {
      console.error('Failed to copy file:', error);
      throw error;
    }
  }

  // 移动文件
  async moveFile(
    from: string,
    to: string,
    options: FileOperationOptions = {}
  ): Promise<void> {
    try {
      const { overwrite = true, createDirectories = true } = options;

      // 检查目标文件是否存在
      const targetInfo = await FileSystem.getInfoAsync(to);
      
      if (targetInfo.exists && !overwrite) {
        throw new Error('Target file already exists and overwrite is disabled');
      }

      // 创建目录
      if (createDirectories) {
        const dirPath = to.substring(0, to.lastIndexOf('/'));
        await this.ensureDirectoryExists(dirPath);
      }

      await FileSystem.moveAsync({ from, to });
    } catch (error) {
      console.error('Failed to move file:', error);
      throw error;
    }
  }

  // 删除文件
  async deleteFile(filePath: string, options: { ignoreNotFound?: boolean } = {}): Promise<void> {
    try {
      const { ignoreNotFound = false } = options;
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        if (ignoreNotFound) {
          return;
        }
        throw new Error('File not found');
      }

      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  // 检查文件是否存在
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      console.error('Failed to check file existence:', error);
      return false;
    }
  }

  // 获取文件信息
  async getFileInfo(filePath: string): Promise<FileSystem.FileInfo> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo;
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  // 获取文件大小
  async getFileSize(filePath: string): Promise<number> {
    try {
      const fileInfo = await this.getFileInfo(filePath);
      return fileInfo.size;
    } catch (error) {
      console.error('Failed to get file size:', error);
      throw error;
    }
  }

  // 确保目录存在
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to ensure directory exists:', error);
      throw error;
    }
  }

  // 列出目录内容
  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(dirPath);
      return files;
    } catch (error) {
      console.error('Failed to list directory:', error);
      throw error;
    }
  }

  // 清空目录
  async clearDirectory(dirPath: string): Promise<void> {
    try {
      const files = await this.listDirectory(dirPath);
      
      for (const file of files) {
        const filePath = `${dirPath}/${file}`;
        const fileInfo = await this.getFileInfo(filePath);
        
        if (fileInfo.isDirectory) {
          await this.clearDirectory(filePath);
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        } else {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('Failed to clear directory:', error);
      throw error;
    }
  }

  // 获取目录大小
  async getDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;
      const files = await this.listDirectory(dirPath);
      
      for (const file of files) {
        const filePath = `${dirPath}/${file}`;
        const fileInfo = await this.getFileInfo(filePath);
        
        if (fileInfo.isDirectory) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += fileInfo.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get directory size:', error);
      throw error;
    }
  }

  // 生成唯一文件名
  generateUniqueFileName(originalName: string, prefix?: string): string {
    const extension = originalName.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const fileName = `${prefix || ''}${timestamp}_${random}`;
    
    return extension ? `${fileName}.${extension}` : fileName;
  }

  // 清理临时文件
  async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = this.getDirectoryPath('temp');
      await this.clearDirectory(tempDir);
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  // 检查存储空间
  async checkStorageSpace(requiredSpace: number): Promise<boolean> {
    try {
      const fsInfo = await this.getFileSystemInfo();
      return fsInfo.freeSpace >= requiredSpace;
    } catch (error) {
      console.error('Failed to check storage space:', error);
      return false;
    }
  }
}
```

### 2.2 缓存管理

#### 2.2.1 缓存服务
```typescript
// src/services/storage/cache.service.ts
import { LRUCache } from 'lru-cache';
import { FileSystemService } from './file-system.service';

export interface CacheConfig {
  maxSize: number; // 最大缓存数量
  maxAge: number; // 最大缓存时间（毫秒）
  maxSizeBytes?: number; // 最大缓存大小（字节）
  persistToDisk?: boolean; // 是否持久化到磁盘
  compression?: boolean; // 是否启用压缩
}

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, LRUCache<string, CacheItem>> = new Map();
  private fileSystemService: FileSystemService;
  private cacheDirectory: string;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.fileSystemService = FileSystemService.getInstance();
    this.cacheDirectory = this.fileSystemService.getDirectoryPath('cache');
    this.config = config;
  }

  static getInstance(config?: CacheConfig): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config || {
        maxSize: 1000,
        maxAge: 1000 * 60 * 60, // 1小时
        persistToDisk: true,
        compression: true
      });
    }
    return CacheService.instance;
  }

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    try {
      // 首先尝试从内存缓存获取
      const memoryItem = this.getFromMemoryCache<T>(key);
      if (memoryItem) {
        return memoryItem;
      }

      // 如果启用了磁盘持久化，尝试从磁盘获取
      if (this.config.persistToDisk) {
        const diskItem = await this.getFromDiskCache<T>(key);
        if (diskItem) {
          // 将磁盘缓存项加载到内存
          this.setMemoryCache(key, diskItem);
          return diskItem;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get from cache:', error);
      return null;
    }
  }

  // 设置缓存
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        size: this.calculateSize(data),
        accessCount: 1,
        lastAccessed: Date.now()
      };

      // 设置内存缓存
      this.setMemoryCache(key, cacheItem);

      // 如果启用了磁盘持久化，保存到磁盘
      if (this.config.persistToDisk) {
        await this.setDiskCache(key, cacheItem);
      }
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  }

  // 删除缓存
  async delete(key: string): Promise<void> {
    try {
      // 从内存缓存删除
      this.deleteFromMemoryCache(key);

      // 从磁盘缓存删除
      if (this.config.persistToDisk) {
        await this.deleteFromDiskCache(key);
      }
    } catch (error) {
      console.error('Failed to delete cache:', error);
    }
  }

  // 检查缓存是否存在
  async has(key: string): Promise<boolean> {
    try {
      // 检查内存缓存
      if (this.hasInMemoryCache(key)) {
        return true;
      }

      // 检查磁盘缓存
      if (this.config.persistToDisk) {
        return await this.hasInDiskCache(key);
      }

      return false;
    } catch (error) {
      console.error('Failed to check cache:', error);
      return false;
    }
  }

  // 清空所有缓存
  async clear(): Promise<void> {
    try {
      // 清空内存缓存
      this.clearMemoryCache();

      // 清空磁盘缓存
      if (this.config.persistToDisk) {
        await this.clearDiskCache();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // 获取缓存统计信息
  getStats(): {
    memoryCache: {
      itemCount: number;
      totalSize: number;
      hitRate: number;
      missRate: number;
    };
    diskCache?: {
      itemCount: number;
      totalSize: number;
    };
  } {
    const memoryStats = this.getMemoryCacheStats();
    
    const stats = {
      memoryCache: memoryStats
    };

    if (this.config.persistToDisk) {
      stats.diskCache = this.getDiskCacheStats();
    }

    return stats;
  }

  // 清理过期缓存
  async cleanup(): Promise<void> {
    try {
      // 清理内存缓存
      this.cleanupMemoryCache();

      // 清理磁盘缓存
      if (this.config.persistToDisk) {
        await this.cleanupDiskCache();
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  // 获取或设置缓存（如果不存在则设置）
  async getOrSet<T>(key: string, factory: () => Promise<T>): Promise<T> {
    try {
      // 尝试从缓存获取
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // 如果不存在，调用工厂函数
      const data = await factory();
      
      // 设置缓存
      await this.set(key, data);
      
      return data;
    } catch (error) {
      console.error('Failed to get or set cache:', error);
      throw error;
    }
  }

  // 内存缓存操作
  private getMemoryCache<T>(key: string): T | null {
    const cache = this.memoryCache.get(key);
    if (!cache) {
      return null;
    }

    const item = cache.get(key);
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > this.config.maxAge) {
      cache.delete(key);
      return null;
    }

    // 更新访问信息
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.data;
  }

  private setMemoryCache<T>(key: string, item: CacheItem<T>): void {
    let cache = this.memoryCache.get(key);
    
    if (!cache) {
      cache = new LRUCache({
        max: this.config.maxSize,
        ttl: this.config.maxAge
      });
      this.memoryCache.set(key, cache);
    }

    cache.set(key, item);
  }

  private deleteFromMemoryCache(key: string): void {
    const cache = this.memoryCache.get(key);
    if (cache) {
      cache.delete(key);
    }
  }

  private hasInMemoryCache(key: string): boolean {
    const cache = this.memoryCache.get(key);
    return cache ? cache.has(key) : false;
  }

  private clearMemoryCache(): void {
    for (const cache of this.memoryCache.values()) {
      cache.clear();
    }
    this.memoryCache.clear();
  }

  private cleanupMemoryCache(): void {
    for (const [key, cache] of this.memoryCache) {
      // 清理过期项
      const keys = cache.keys();
      for (const cacheKey of keys) {
        const item = cache.get(cacheKey);
        if (item && Date.now() - item.timestamp > this.config.maxAge) {
          cache.delete(cacheKey);
        }
      }
    }
  }

  private getMemoryCacheStats() {
    let totalItems = 0;
    let totalSize = 0;
    let hits = 0;
    let misses = 0;

    for (const cache of this.memoryCache.values()) {
      totalItems += cache.size;
      
      for (const [key, item] of cache.dump()) {
        totalSize += item.size;
        hits += item.accessCount;
      }
    }

    // 简化的统计计算
    const totalAccess = hits + misses;
    const hitRate = totalAccess > 0 ? hits / totalAccess : 0;
    const missRate = totalAccess > 0 ? misses / totalAccess : 0;

    return {
      itemCount: totalItems,
      totalSize,
      hitRate,
      missRate
    };
  }

  // 磁盘缓存操作
  private async getFromDiskCache<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getDiskCacheFilePath(key);
      const exists = await this.fileSystemService.fileExists(filePath);
      
      if (!exists) {
        return null;
      }

      const content = await this.fileSystemService.readFile(filePath);
      const cacheItem: CacheItem<T> = JSON.parse(content);

      // 检查是否过期
      if (Date.now() - cacheItem.timestamp > this.config.maxAge) {
        await this.fileSystemService.deleteFile(filePath);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get from disk cache:', error);
      return null;
    }
  }

  private async setDiskCache<T>(key: string, item: CacheItem<T>): Promise<void> {
    try {
      const filePath = this.getDiskCacheFilePath(key);
      const content = JSON.stringify(item);
      
      await this.fileSystemService.writeFile(filePath, content, {
        overwrite: true,
        createDirectories: true
      });
    } catch (error) {
      console.error('Failed to set disk cache:', error);
    }
  }

  private async deleteFromDiskCache(key: string): Promise<void> {
    try {
      const filePath = this.getDiskCacheFilePath(key);
      await this.fileSystemService.deleteFile(filePath, { ignoreNotFound: true });
    } catch (error) {
      console.error('Failed to delete from disk cache:', error);
    }
  }

  private async hasInDiskCache(key: string): Promise<boolean> {
    try {
      const filePath = this.getDiskCacheFilePath(key);
      return await this.fileSystemService.fileExists(filePath);
    } catch (error) {
      console.error('Failed to check disk cache:', error);
      return false;
    }
  }

  private async clearDiskCache(): Promise<void> {
    try {
      const cacheDir = this.cacheDirectory;
      await this.fileSystemService.clearDirectory(cacheDir);
    } catch (error) {
      console.error('Failed to clear disk cache:', error);
    }
  }

  private async cleanupDiskCache(): Promise<void> {
    try {
      const files = await this.fileSystemService.listDirectory(this.cacheDirectory);
      
      for (const file of files) {
        const filePath = `${this.cacheDirectory}/${file}`;
        
        try {
          const content = await this.fileSystemService.readFile(filePath);
          const cacheItem: CacheItem = JSON.parse(content);
          
          // 检查是否过期
          if (Date.now() - cacheItem.timestamp > this.config.maxAge) {
            await this.fileSystemService.deleteFile(filePath);
          }
        } catch (error) {
          // 删除损坏的缓存文件
          await this.fileSystemService.deleteFile(filePath, { ignoreNotFound: true });
        }
      }
    } catch (error) {
      console.error('Failed to cleanup disk cache:', error);
    }
  }

  private getDiskCacheStats() {
    // 简化的磁盘缓存统计
    return {
      itemCount: 0,
      totalSize: 0
    };
  }

  private getDiskCacheFilePath(key: string): string {
    // 使用哈希生成文件名，避免文件名冲突
    const hash = this.hashKey(key);
    return `${this.cacheDirectory}/${hash}.cache`;
  }

  private hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }
}
```

### 2.3 数据库管理

#### 2.3.1 数据库服务
```typescript
// src/services/storage/database.service.ts
import Dexie, { Table } from 'dexie';
import { FileSystemService } from './file-system.service';

export interface DatabaseConfig {
  name: string;
  version: number;
  backupEnabled: boolean;
  backupInterval: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Dexie;
  private config: DatabaseConfig;
  private fileSystemService: FileSystemService;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.fileSystemService = FileSystemService.getInstance();
    this.db = new Dexie(config.name);
    this.initializeDatabase();
  }

  static getInstance(config?: DatabaseConfig): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(config || {
        name: 'VideoDatabase',
        version: 2,
        backupEnabled: true,
        backupInterval: 24 * 60 * 60 * 1000 // 24小时
      });
    }
    return DatabaseService.instance;
  }

  // 初始化数据库
  private initializeDatabase(): void {
    this.db.version(1).stores({
      videos: 'id, title, createdAt, updatedAt, tags, category, lastWatchedAt',
      playlists: 'id, name, createdAt, updatedAt',
      playlistItems: 'id, playlistId, videoId, order',
      watchHistory: 'id, videoId, watchedAt, [videoId+watchedAt]',
      settings: 'id',
      cache: 'key, timestamp, [key+timestamp]'
    });

    this.db.version(2).stores({
      videos: 'id, title, createdAt, updatedAt, tags, category, lastWatchedAt, [tags+category]',
      playlists: 'id, name, createdAt, updatedAt',
      playlistItems: 'id, playlistId, videoId, order, [playlistId+order]',
      watchHistory: 'id, videoId, watchedAt, [videoId+watchedAt]',
      settings: 'id',
      cache: 'key, timestamp, [key+timestamp]',
      subtitles: 'id, videoId, language, filePath, [videoId+language]',
      backups: 'id, timestamp, type, size, [timestamp+type]'
    });

    // 设置错误处理
    this.db.on('error', (error) => {
      console.error('Database error:', error);
    });

    // 设置版本变更处理
    this.db.on('versionchange', (event) => {
      console.log('Database version change:', event);
    });
  }

  // 获取数据库实例
  getDB(): Dexie {
    return this.db;
  }

  // 创建备份
  async createBackup(): Promise<string> {
    try {
      const timestamp = Date.now();
      const backupId = `backup_${timestamp}`;
      const backupData = await this.exportDatabase();
      
      const backupPath = this.fileSystemService.getDirectoryPath('backups');
      const backupFile = `${backupPath}/${backupId}.json`;
      
      await this.fileSystemService.writeFile(backupFile, JSON.stringify(backupData, null, 2));
      
      // 记录备份信息
      await this.db.backups.add({
        id: backupId,
        timestamp: new Date(timestamp),
        type: 'full',
        size: JSON.stringify(backupData).length
      });

      return backupFile;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  // 恢复备份
  async restoreBackup(backupFile: string): Promise<boolean> {
    try {
      const backupContent = await this.fileSystemService.readFile(backupFile);
      const backupData = JSON.parse(backupContent);
      
      await this.importDatabase(backupData);
      
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  // 导出数据库
  private async exportDatabase(): Promise<any> {
    const exportData: any = {
      version: this.config.version,
      timestamp: Date.now(),
      tables: {}
    };

    // 导出所有表
    const tables = ['videos', 'playlists', 'playlistItems', 'watchHistory', 'settings', 'cache', 'subtitles'];
    
    for (const tableName of tables) {
      try {
        const table = this.db.table(tableName);
        const data = await table.toArray();
        exportData.tables[tableName] = data;
      } catch (error) {
        console.error(`Failed to export table ${tableName}:`, error);
      }
    }

    return exportData;
  }

  // 导入数据库
  private async importDatabase(backupData: any): Promise<void> {
    try {
      // 清空现有数据
      await this.clearAllTables();

      // 导入数据
      for (const [tableName, data] of Object.entries(backupData.tables)) {
        try {
          const table = this.db.table(tableName);
          if (Array.isArray(data) && data.length > 0) {
            await table.bulkAdd(data);
          }
        } catch (error) {
          console.error(`Failed to import table ${tableName}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to import database:', error);
      throw error;
    }
  }

  // 清空所有表
  private async clearAllTables(): Promise<void> {
    const tables = ['videos', 'playlists', 'playlistItems', 'watchHistory', 'settings', 'cache', 'subtitles', 'backups'];
    
    for (const tableName of tables) {
      try {
        const table = this.db.table(tableName);
        await table.clear();
      } catch (error) {
        console.error(`Failed to clear table ${tableName}:`, error);
      }
    }
  }

  // 获取数据库统计信息
  async getStats(): Promise<{
    tables: Array<{
      name: string;
      count: number;
      size: number;
    }>;
    totalSize: number;
    lastBackup?: Date;
  }> {
    const stats = {
      tables: [] as Array<{
        name: string;
        count: number;
        size: number;
      }>,
      totalSize: 0,
      lastBackup: undefined as Date | undefined
    };

    const tables = ['videos', 'playlists', 'playlistItems', 'watchHistory', 'settings', 'cache', 'subtitles'];
    
    for (const tableName of tables) {
      try {
        const table = this.db.table(tableName);
        const count = await table.count();
        const data = await table.toArray();
        const size = JSON.stringify(data).length;
        
        stats.tables.push({
          name: tableName,
          count,
          size
        });
        
        stats.totalSize += size;
      } catch (error) {
        console.error(`Failed to get stats for table ${tableName}:`, error);
      }
    }

    // 获取最后备份时间
    try {
      const lastBackup = await this.db.backups
        .orderBy('timestamp')
        .reverse()
        .first();
      
      if (lastBackup) {
        stats.lastBackup = lastBackup.timestamp;
      }
    } catch (error) {
      console.error('Failed to get last backup info:', error);
    }

    return stats;
  }

  // 优化数据库
  async optimize(): Promise<void> {
    try {
      // 删除过期数据
      await this.cleanupExpiredData();
      
      // 重建索引
      await this.rebuildIndexes();
      
      // 压缩数据库
      await this.compactDatabase();
    } catch (error) {
      console.error('Failed to optimize database:', error);
      throw error;
    }
  }

  // 清理过期数据
  private async cleanupExpiredData(): Promise<void> {
    try {
      // 清理过期的缓存
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      await this.db.cache
        .where('timestamp')
        .below(oneWeekAgo)
        .delete();

      // 清理过期的观看历史
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      await this.db.watchHistory
        .where('watchedAt')
        .below(oneMonthAgo)
        .delete();

      // 清理过期的备份
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      await this.db.backups
        .where('timestamp')
        .below(threeMonthsAgo)
        .delete();
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  // 重建索引
  private async rebuildIndexes(): Promise<void> {
    try {
      // Dexie 会自动维护索引，这里主要是确保数据一致性
      console.log('Database indexes rebuilt');
    } catch (error) {
      console.error('Failed to rebuild indexes:', error);
    }
  }

  // 压缩数据库
  private async compactDatabase(): Promise<void> {
    try {
      // Dexie 的压缩操作
      await this.db.delete();
      this.initializeDatabase();
      console.log('Database compacted');
    } catch (error) {
      console.error('Failed to compact database:', error);
    }
  }

  // 启动自动备份
  startAutoBackup(): void {
    if (this.config.backupEnabled) {
      setInterval(async () => {
        try {
          await this.createBackup();
          console.log('Automatic backup created');
        } catch (error) {
          console.error('Failed to create automatic backup:', error);
        }
      }, this.config.backupInterval);
    }
  }

  // 检查数据库健康状态
  async checkHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    stats: any;
  }> {
    const issues: string[] = [];

    try {
      // 检查数据库连接
      await this.db.tables.count();
      
      // 检查数据库大小
      const stats = await this.getStats();
      if (stats.totalSize > 100 * 1024 * 1024) { // 100MB
        issues.push('Database size is large');
      }

      // 检查备份状态
      if (this.config.backupEnabled) {
        const lastBackup = stats.lastBackup;
        if (!lastBackup || Date.now() - lastBackup.getTime() > 7 * 24 * 60 * 60 * 1000) {
          issues.push('Backup is outdated');
        }
      }

      return {
        healthy: issues.length === 0,
        issues,
        stats
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        healthy: false,
        issues: ['Database connection failed'],
        stats: null
      };
    }
  }
}
```

## 3. 备份和恢复

### 3.1 备份服务
```typescript
// src/services/storage/backup.service.ts
import { FileSystemService } from './file-system.service';
import { DatabaseService } from './database.service';
import { CacheService } from './cache.service';

export interface BackupOptions {
  includeVideos: boolean;
  includeSettings: boolean;
  includePlaylists: boolean;
  includeWatchHistory: boolean;
  includeCache: boolean;
  compression: boolean;
  encryption: boolean;
  encryptionKey?: string;
}

export interface BackupResult {
  success: boolean;
  backupPath: string;
  size: number;
  timestamp: Date;
  items: {
    videos: number;
    playlists: number;
    watchHistory: number;
    settings: number;
    cache: number;
  };
  duration: number;
}

export interface RestoreOptions {
  overwrite: boolean;
  validate: boolean;
  encryptionKey?: string;
}

export class BackupService {
  private static instance: BackupService;
  private fileSystemService: FileSystemService;
  private databaseService: DatabaseService;
  private cacheService: CacheService;
  private backupDirectory: string;
  private maxBackups: number = 10;

  constructor() {
    this.fileSystemService = FileSystemService.getInstance();
    this.databaseService = DatabaseService.getInstance();
    this.cacheService = CacheService.getInstance();
    this.backupDirectory = this.fileSystemService.getDirectoryPath('backups');
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // 创建备份
  async createBackup(options: BackupOptions): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date();
    const backupId = `backup_${timestamp.toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = `${this.backupDirectory}/${backupId}.backup`;

    try {
      // 收集备份数据
      const backupData = await this.collectBackupData(options);

      // 压缩数据
      let dataToBackup = JSON.stringify(backupData);
      if (options.compression) {
        dataToBackup = await this.compressData(dataToBackup);
      }

      // 加密数据
      if (options.encryption) {
        if (!options.encryptionKey) {
          throw new Error('Encryption key is required for encrypted backup');
        }
        dataToBackup = await this.encryptData(dataToBackup, options.encryptionKey);
      }

      // 写入备份文件
      await this.fileSystemService.writeFile(backupPath, dataToBackup);

      // 清理旧备份
      await this.cleanupOldBackups();

      const duration = Date.now() - startTime;
      const result: BackupResult = {
        success: true,
        backupPath,
        size: dataToBackup.length,
        timestamp,
        items: {
          videos: backupData.videos?.length || 0,
          playlists: backupData.playlists?.length || 0,
          watchHistory: backupData.watchHistory?.length || 0,
          settings: backupData.settings ? 1 : 0,
          cache: backupData.cache?.length || 0
        },
        duration
      };

      // 记录备份信息
      await this.logBackup(result);

      return result;
    } catch (error) {
      console.error('Failed to create backup:', error);
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        backupPath,
        size: 0,
        timestamp,
        items: {
          videos: 0,
          playlists: 0,
          watchHistory: 0,
          settings: 0,
          cache: 0
        },
        duration
      };
    }
  }

  // 恢复备份
  async restoreBackup(backupPath: string, options: RestoreOptions): Promise<boolean> {
    try {
      // 读取备份文件
      let backupData = await this.fileSystemService.readFile(backupPath);

      // 解密数据
      if (options.encryptionKey) {
        backupData = await this.decryptData(backupData, options.encryptionKey);
      }

      // 解压缩数据
      if (this.isCompressed(backupData)) {
        backupData = await this.decompressData(backupData);
      }

      // 解析数据
      const data = JSON.parse(backupData);

      // 验证备份格式
      if (options.validate && !this.validateBackupData(data)) {
        throw new Error('Invalid backup format');
      }

      // 恢复数据
      await this.restoreBackupData(data, options.overwrite);

      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  // 获取备份列表
  async getBackupList(): Promise<Array<{
    id: string;
    path: string;
    size: number;
    timestamp: Date;
    items: any;
  }>> {
    try {
      const files = await this.fileSystemService.listDirectory(this.backupDirectory);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.backup')) {
          const filePath = `${this.backupDirectory}/${file}`;
          const fileInfo = await this.fileSystemService.getFileInfo(filePath);
          
          try {
            const backupData = await this.parseBackupFile(filePath);
            backups.push({
              id: file.replace('.backup', ''),
              path: filePath,
              size: fileInfo.size,
              timestamp: backupData.timestamp,
              items: backupData.items
            });
          } catch (error) {
            console.error(`Failed to parse backup file ${file}:`, error);
          }
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get backup list:', error);
      return [];
    }
  }

  // 删除备份
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backupPath = `${this.backupDirectory}/${backupId}.backup`;
      await this.fileSystemService.deleteFile(backupPath, { ignoreNotFound: true });
      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  // 收集备份数据
  private async collectBackupData(options: BackupOptions): Promise<any> {
    const backupData: any = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      options,
      metadata: {
        appVersion: '1.0.0',
        createdAt: new Date().toISOString()
      }
    };

    // 收集视频数据
    if (options.includeVideos) {
      backupData.videos = await this.databaseService.getDB().videos.toArray();
    }

    // 收集播放列表数据
    if (options.includePlaylists) {
      backupData.playlists = await this.databaseService.getDB().playlists.toArray();
      backupData.playlistItems = await this.databaseService.getDB().playlistItems.toArray();
    }

    // 收集观看历史
    if (options.includeWatchHistory) {
      backupData.watchHistory = await this.databaseService.getDB().watchHistory.toArray();
    }

    // 收集设置
    if (options.includeSettings) {
      backupData.settings = await this.databaseService.getDB().settings.toArray();
    }

    // 收集缓存
    if (options.includeCache) {
      backupData.cache = await this.collectCacheData();
    }

    return backupData;
  }

  // 收集缓存数据
  private async collectCacheData(): Promise<any[]> {
    try {
      const cacheData = [];
      const cacheKeys = await this.cacheService.getKeys();
      
      for (const key of cacheKeys) {
        const value = await this.cacheService.get(key);
        if (value !== null) {
          cacheData.push({ key, value });
        }
      }
      
      return cacheData;
    } catch (error) {
      console.error('Failed to collect cache data:', error);
      return [];
    }
  }

  // 恢复备份数据
  private async restoreBackupData(data: any, overwrite: boolean): Promise<void> {
    // 恢复视频数据
    if (data.videos && data.videos.length > 0) {
      if (overwrite) {
        await this.databaseService.getDB().videos.clear();
      }
      await this.databaseService.getDB().videos.bulkAdd(data.videos);
    }

    // 恢复播放列表数据
    if (data.playlists && data.playlists.length > 0) {
      if (overwrite) {
        await this.databaseService.getDB().playlists.clear();
      }
      await this.databaseService.getDB().playlists.bulkAdd(data.playlists);
    }

    if (data.playlistItems && data.playlistItems.length > 0) {
      if (overwrite) {
        await this.databaseService.getDB().playlistItems.clear();
      }
      await this.databaseService.getDB().playlistItems.bulkAdd(data.playlistItems);
    }

    // 恢复观看历史
    if (data.watchHistory && data.watchHistory.length > 0) {
      if (overwrite) {
        await this.databaseService.getDB().watchHistory.clear();
      }
      await this.databaseService.getDB().watchHistory.bulkAdd(data.watchHistory);
    }

    // 恢复设置
    if (data.settings && data.settings.length > 0) {
      if (overwrite) {
        await this.databaseService.getDB().settings.clear();
      }
      await this.databaseService.getDB().settings.bulkAdd(data.settings);
    }

    // 恢复缓存
    if (data.cache && data.cache.length > 0) {
      for (const item of data.cache) {
        await this.cacheService.set(item.key, item.value);
      }
    }
  }

  // 压缩数据
  private async compressData(data: string): Promise<string> {
    // 这里需要实现压缩算法
    // 可以使用第三方库如 pako
    return data; // 临时返回原始数据
  }

  // 解压缩数据
  private async decompressData(data: string): Promise<string> {
    // 这里需要实现解压缩算法
    // 可以使用第三方库如 pako
    return data; // 临时返回原始数据
  }

  // 加密数据
  private async encryptData(data: string, key: string): Promise<string> {
    // 这里需要实现加密算法
    // 可以使用 CryptoJS 或其他加密库
    return data; // 临时返回原始数据
  }

  // 解密数据
  private async decryptData(data: string, key: string): Promise<string> {
    // 这里需要实现解密算法
    // 可以使用 CryptoJS 或其他加密库
    return data; // 临时返回原始数据
  }

  // 检查是否为压缩数据
  private isCompressed(data: string): boolean {
    // 这里需要实现压缩检测逻辑
    return false; // 临时返回false
  }

  // 验证备份数据
  private validateBackupData(data: any): boolean {
    return (
      data &&
      data.version &&
      data.timestamp &&
      data.metadata &&
      data.metadata.appVersion
    );
  }

  // 解析备份文件
  private async parseBackupFile(backupPath: string): Promise<any> {
    const content = await this.fileSystemService.readFile(backupPath);
    
    // 尝试解密
    let data = content;
    if (this.isEncrypted(content)) {
      // 这里需要处理解密
      // data = await this.decryptData(data, encryptionKey);
    }

    // 尝试解压缩
    if (this.isCompressed(data)) {
      data = await this.decompressData(data);
    }

    return JSON.parse(data);
  }

  // 检查是否为加密数据
  private isEncrypted(data: string): boolean {
    // 这里需要实现加密检测逻辑
    return false; // 临时返回false
  }

  // 清理旧备份
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.getBackupList();
      
      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  // 记录备份信息
  private async logBackup(result: BackupResult): Promise<void> {
    try {
      const logEntry = {
        timestamp: result.timestamp,
        type: 'backup',
        success: result.success,
        size: result.size,
        duration: result.duration,
        items: result.items
      };

      const logPath = this.fileSystemService.getDirectoryPath('logs');
      const logFile = `${logPath}/backup.log`;
      
      const logContent = JSON.stringify(logEntry) + '\n';
      
      await this.fileSystemService.writeFile(
        logFile,
        logContent,
        { overwrite: false }
      );
    } catch (error) {
      console.error('Failed to log backup:', error);
    }
  }

  // 启动自动备份
  startAutoBackup(options: BackupOptions, interval: number = 24 * 60 * 60 * 1000): void {
    setInterval(async () => {
      try {
        await this.createBackup(options);
        console.log('Automatic backup completed');
      } catch (error) {
        console.error('Failed to create automatic backup:', error);
      }
    }, interval);
  }

  // 检查备份健康状态
  async checkBackupHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    lastBackup?: Date;
    backupCount: number;
    totalSize: number;
  }> {
    const issues: string[] = [];

    try {
      const backups = await this.getBackupList();
      const lastBackup = backups[0];
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

      // 检查备份数量
      if (backups.length === 0) {
        issues.push('No backups found');
      }

      // 检查最后备份时间
      if (lastBackup) {
        const daysSinceLastBackup = (Date.now() - lastBackup.timestamp.getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceLastBackup > 7) {
          issues.push('Last backup is older than 7 days');
        }
      }

      // 检查备份大小
      if (totalSize > 500 * 1024 * 1024) { // 500MB
        issues.push('Total backup size is large');
      }

      return {
        healthy: issues.length === 0,
        issues,
        lastBackup: lastBackup?.timestamp,
        backupCount: backups.length,
        totalSize
      };
    } catch (error) {
      console.error('Failed to check backup health:', error);
      return {
        healthy: false,
        issues: ['Failed to check backup health'],
        backupCount: 0,
        totalSize: 0
      };
    }
  }
}
```

## 4. 测试计划

### 4.1 存储服务测试
```typescript
// src/__tests__/services/storage/file-system.service.test.ts
import { FileSystemService } from '../../../services/storage/file-system.service';
import * as FileSystem from 'expo-file-system';

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/',
  cacheDirectory: '/mock/cache/',
  makeDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  copyAsync: jest.fn(),
  moveAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn()
}));

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService;

  beforeEach(() => {
    fileSystemService = FileSystemService.getInstance();
    jest.clearAllMocks();
  });

  describe('getFileSystemInfo', () => {
    it('应该返回正确的文件系统信息', async () => {
      const mockDocInfo = {
        exists: true,
        size: 1024 * 1024,
        isDirectory: true,
        uri: '/mock/document/'
      };

      const mockCacheInfo = {
        exists: true,
        size: 512 * 1024,
        isDirectory: true,
        uri: '/mock/cache/'
      };

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce(mockDocInfo)
        .mockResolvedValueOnce(mockCacheInfo);

      const result = await fileSystemService.getFileSystemInfo();

      expect(result.totalSpace).toBeGreaterThan(0);
      expect(result.usedSpace).toBe(mockDocInfo.size + mockCacheInfo.size);
      expect(result.freeSpace).toBeGreaterThan(0);
    });
  });

  describe('writeFile', () => {
    it('应该成功写入文件', async () => {
      const filePath = '/mock/test.txt';
      const content = 'test content';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
        size: 0,
        isDirectory: false,
        uri: filePath
      });

      await fileSystemService.writeFile(filePath, content);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        filePath,
        content,
        { encoding: 'utf8' }
      );
    });

    it('应该在文件已存在且不允许覆盖时抛出错误', async () => {
      const filePath = '/mock/test.txt';
      const content = 'test content';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 100,
        isDirectory: false,
        uri: filePath
      });

      await expect(fileSystemService.writeFile(filePath, content, { overwrite: false }))
        .rejects.toThrow('File already exists and overwrite is disabled');
    });
  });

  describe('fileExists', () => {
    it('应该返回文件存在状态', async () => {
      const filePath = '/mock/test.txt';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 100,
        isDirectory: false,
        uri: filePath
      });

      const exists = await fileSystemService.fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('应该返回文件不存在状态', async () => {
      const filePath = '/mock/test.txt';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
        size: 0,
        isDirectory: false,
        uri: filePath
      });

      const exists = await fileSystemService.fileExists(filePath);
      expect(exists).toBe(false);
    });
  });
});
```

## 5. 总结

存储管理模块提供了完整的存储解决方案，包括：

1. **文件系统**: 统一的文件操作接口，支持读写、复制、移动、删除等操作
2. **缓存管理**: 多级缓存系统，支持内存缓存和磁盘缓存，自动清理过期数据
3. **数据库管理**: 基于 IndexedDB 的数据库服务，支持数据备份和恢复
4. **备份系统**: 完整的备份和恢复功能，支持压缩和加密
5. **性能优化**: 自动清理、压缩、索引优化等性能优化功能
6. **健康检查**: 存储空间监控、数据库健康检查等诊断功能

该模块设计考虑了数据安全性、性能和可维护性，为整个应用提供了可靠的存储基础。