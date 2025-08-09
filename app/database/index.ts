/**
 * 数据库模块统一导出文件
 * 整合 Realm 数据库、MMKV 存储、配置管理和数据迁移服务
 */

// 主要数据库服务（推荐使用）
export {
  default as UnifiedRealmService,
  getUnifiedDatabase,
  closeUnifiedDatabase,
} from './unified-realm-service';
export type {
  DatabaseOperations,
  VideoInput,
  PlaylistInput,
  FolderInput,
  PlayHistoryInput,
  SettingsInput,
  DatabaseStats,
  SearchOptions,
} from './unified-realm-service';

// 兼容性导出
export { default as RealmDatabaseService, getDatabase, closeDatabase } from './realm-service';
export type {
  Video,
  Playlist,
  Folder,
  PlayHistory,
  AppSettings,
  realmConfig,
  defaultAppSettings,
  AppDatabase,
  RealmVideo,
  RealmPlaylist,
  RealmFolder,
  RealmPlayHistory,
  RealmAppSettings,
} from './realm-schema';


// MMKV 存储服务
export { default as MMKVStorage, mmkvStorage, CONFIG_KEYS } from '../storage/mmkv-storage';

// 配置管理服务
export { default as ConfigService, configService, config } from '../storage/config-service';

// 类型定义
export type {
  Theme,
  VideoQuality,
  PlayerSettings,
  UISettings,
  NetworkSettings,
  CacheSettings,
  PrivacySettings,
  ExperimentalSettings,
  AppConfig,
} from '../storage/config-service';

/**
 * 数据库管理器
 * 统一管理所有数据库相关的服务
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('正在初始化数据库服务...');

      // 迁移已完成，直接初始化 Realm 数据库
      const { getUnifiedDatabase } = await import('./unified-realm-service');
      const db = getUnifiedDatabase();

      // 确保数据库连接正常
      const stats = db.utils.getStats();
      console.log(`数据库初始化完成，视频数量: ${stats.videoCount}`);

      this.isInitialized = true;
      console.log('数据库服务初始化完成');
    } catch (error) {
      console.error('数据库服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 执行数据迁移 - 已废弃
   * 迁移已完成，此方法保留用于兼容性
   */
  async migrateData(onProgress?: (progress: any) => void): Promise<any> {
    console.log('数据迁移已完成，应用现在使用 Realm 数据库');
    return {
      success: true,
      message: '迁移已完成',
      stats: {
        videos: { migrated: 0, failed: 0 },
        playlists: { migrated: 0, failed: 0 },
        folders: { migrated: 0, failed: 0 },
        history: { migrated: 0, failed: 0 },
        settings: { migrated: 0, failed: 0 },
      },
      warnings: ['迁移已完成，应用现在使用 Realm 数据库'],
    };
  }

  /**
   * 获取数据库实例（推荐使用统一服务）
   */
  async getDatabase() {
    const { getUnifiedDatabase } = await import('./unified-realm-service');
    return getUnifiedDatabase();
  }

  /**
   * 获取配置服务
   */
  async getConfigService() {
    const { configService } = await import('../storage/config-service');
    return configService;
  }

  /**
   * 获取存储服务
   */
  async getStorageService() {
    const { mmkvStorage } = await import('../storage/mmkv-storage');
    return mmkvStorage;
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{
    database: any;
    storage: any;
    config: any;
  }> {
    const db = await this.getDatabase();
    const storage = await this.getStorageService();
    const configService = await this.getConfigService();

    return {
      database: db.utils.getStats(),
      storage: await storage.getStats(),
      config: await configService.getConfigStats(),
    };
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      // 关闭数据库连接
      const { closeUnifiedDatabase } = await import('./unified-realm-service');
      closeUnifiedDatabase();

      // 清理存储服务
      const storage = await this.getStorageService();
      await storage.cleanup();

      // 销毁配置服务
      const configService = await this.getConfigService();
      configService.destroy();

      this.isInitialized = false;
      console.log('数据库资源已清理');
    } catch (error) {
      console.error('清理数据库资源失败:', error);
    }
  }

  /**
   * 备份数据
   */
  async backup(): Promise<{
    database: string;
    config: string;
    storage: any;
  }> {
    try {
      const db = await this.getDatabase();
      const configService = await this.getConfigService();
      const storage = await this.getStorageService();

      return {
        database: await db.batch.backup(),
        config: await configService.exportConfig(),
        storage: await storage.export(),
      };
    } catch (error) {
      console.error('备份数据失败:', error);
      throw error;
    }
  }

  /**
   * 恢复数据
   */
  async restore(backup: { database: string; config: string; storage: any }): Promise<void> {
    try {
      const configService = await this.getConfigService();
      const storage = await this.getStorageService();

      // 恢复数据库
      const db = await this.getDatabase();
      await db.batch.restore(backup.database);

      // 恢复配置
      await configService.importConfig(backup.config);

      // 恢复存储
      await storage.import(backup.storage);

      console.log('数据恢复完成');
    } catch (error) {
      console.error('恢复数据失败:', error);
      throw error;
    }
  }

  /**
   * 重置所有数据
   */
  async reset(): Promise<void> {
    try {
      const configService = await this.getConfigService();
      const storage = await this.getStorageService();

      // 清空数据库
      await this.cleanup();

      // 重置配置
      await configService.resetConfig();

      // 清空存储
      await storage.clear();

      // 重新初始化
      await this.initialize();

      console.log('所有数据已重置');
    } catch (error) {
      console.error('重置数据失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const databaseManager = DatabaseManager.getInstance();

// 便捷的初始化函数
export async function initializeDatabase(): Promise<void> {
  return await databaseManager.initialize();
}

// 便捷的清理函数
export async function cleanupDatabase(): Promise<void> {
  return await databaseManager.cleanup();
}

// 默认导出
export default DatabaseManager;
