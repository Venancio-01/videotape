import { eq, sql } from "drizzle-orm";
import { type ExpoSQLiteDatabase, drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import * as FileSystem from "expo-file-system";
import { openDatabaseSync } from "expo-sqlite";

import migrations from "./migrations/migrations";
import {
  bookmarkTable,
  folderTable,
  folderVideoTable,
  playlistTable,
  playlistVideoTable,
  searchIndexTable,
  settingsTable,
  tagTable,
  videoTable,
  videoTagTable,
  watchHistoryTable,
} from "./schema";

// 数据库连接配置
const DATABASE_NAME = "videotape.db";
const BACKUP_DIRECTORY = `${FileSystem.documentDirectory}backups/`;

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: ExpoSQLiteDatabase | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<ExpoSQLiteDatabase> {
    if (this.isConnected && this.db) {
      return this.db;
    }

    try {
      // 打开数据库连接
      const expoDb = openDatabaseSync(DATABASE_NAME, {
        enableChangeListener: true,
      });

      // 配置数据库参数
      await expoDb.execAsync("PRAGMA foreign_keys = ON;");
      await expoDb.execAsync("PRAGMA journal_mode = WAL;");
      await expoDb.execAsync("PRAGMA synchronous = NORMAL;");
      await expoDb.execAsync("PRAGMA cache_size = -2000;");
      await expoDb.execAsync("PRAGMA temp_store = MEMORY;");
      await expoDb.execAsync("PRAGMA mmap_size = 268435456;"); // 256MB

      this.db = drizzle(expoDb);
      this.isConnected = true;

      console.log("Database initialized successfully");
      return this.db;
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): ExpoSQLiteDatabase {
    if (!this.isConnected || !this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  /**
   * 运行数据库迁移
   */
  async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const { success, error } = await useMigrations(this.db, migrations);

      if (success) {
        console.log("Database migrations completed successfully");
      } else {
        console.error("Database migrations failed:", error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to run migrations:", error);
      throw error;
    }
  }

  /**
   * 检查数据库健康状态
   */
  async checkHealth(): Promise<{
    status: "healthy" | "warning" | "error";
    issues: string[];
    stats: {
      tableCount: number;
      totalSize: number;
      indexCount: number;
      lastBackup?: string;
    };
  }> {
    const issues: string[] = [];

    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }

      // 检查数据库连接
      await this.db.select({ count: sql`COUNT(*)` }).from(videoTable).limit(1);

      // 获取数据库统计信息
      const [tableStats] = await this.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(sql.raw("sqlite_master") )
        .where(eq(sql.raw("type"), "table"));

      const [indexStats] = await this.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(sql.raw("sqlite_master") )
        .where(eq(sql.raw("type"), "index"));

      // 检查数据库文件大小
      const dbPath = `${FileSystem.documentDirectory}${DATABASE_NAME}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);

      // 检查备份状态
      const lastBackup = await this.getLastBackupInfo();

      return {
        status: issues.length === 0 ? "healthy" : "warning",
        issues,
        stats: {
          tableCount: tableStats.count,
          totalSize: fileInfo.exists ? fileInfo.size || 0 : 0,
          indexCount: indexStats.count,
          lastBackup: lastBackup?.name,
        },
      };
    } catch (error) {
      return {
        status: "error",
        issues: ["Database connection failed"],
        stats: {
          tableCount: 0,
          totalSize: 0,
          indexCount: 0,
        },
      };
    }
  }

  /**
   * 创建数据库备份
   */
  async createBackup(): Promise<string> {
    try {
      // 确保备份目录存在
      await FileSystem.makeDirectoryAsync(BACKUP_DIRECTORY, {
        intermediates: true,
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `backup_${timestamp}.db`;
      const backupPath = `${BACKUP_DIRECTORY}${backupFileName}`;

      const sourcePath = `${FileSystem.documentDirectory}${DATABASE_NAME}`;

      // 复制数据库文件
      await FileSystem.copyAsync({
        from: sourcePath,
        to: backupPath,
      });

      console.log("Database backup created:", backupPath);
      return backupPath;
    } catch (error) {
      console.error("Failed to create backup:", error);
      throw error;
    }
  }

  /**
   * 从备份恢复数据库
   */
  async restoreFromBackup(backupPath: string): Promise<boolean> {
    try {
      const targetPath = `${FileSystem.documentDirectory}${DATABASE_NAME}`;

      // 关闭数据库连接
      await this.close();

      // 恢复数据库文件
      await FileSystem.copyAsync({
        from: backupPath,
        to: targetPath,
      });

      // 重新初始化数据库
      await this.initialize();

      console.log("Database restored from:", backupPath);
      return true;
    } catch (error) {
      console.error("Failed to restore database:", error);
      return false;
    }
  }

  /**
   * 获取备份信息
   */
  async getBackupInfo(): Promise<
    Array<{ name: string; path: string; size: number; created: string }>
  > {
    try {
      const backupFiles = await FileSystem.readDirectoryAsync(BACKUP_DIRECTORY);
      const backups = [];

      for (const fileName of backupFiles) {
        if (fileName.startsWith("backup_") && fileName.endsWith(".db")) {
          const filePath = `${BACKUP_DIRECTORY}${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists) {
            backups.push({
              name: fileName,
              path: filePath,
              size: fileInfo.size || 0,
              created: fileName.replace("backup_", "").replace(".db", ""),
            });
          }
        }
      }

      return backups.sort((a, b) => b.created.localeCompare(a.created));
    } catch (error) {
      console.error("Failed to get backup info:", error);
      return [];
    }
  }

  /**
   * 获取最后备份信息
   */
  private async getLastBackupInfo(): Promise<{
    name: string;
    path: string;
  } | null> {
    try {
      const backups = await this.getBackupInfo();
      return backups.length > 0 ? backups[0] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 清理旧的备份文件
   */
  async cleanupOldBackups(keepCount = 5): Promise<void> {
    try {
      const backups = await this.getBackupInfo();
      const toDelete = backups.slice(keepCount);

      for (const backup of toDelete) {
        await FileSystem.deleteAsync(backup.path);
        console.log("Deleted old backup:", backup.name);
      }
    } catch (error) {
      console.error("Failed to cleanup old backups:", error);
    }
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (!this.isConnected || !this.db) {
      return;
    }

    try {
      // SQLite数据库会自动关闭，这里主要是清理状态
      this.isConnected = false;
      this.db = null;
      console.log("Database connection closed");
    } catch (error) {
      console.error("Failed to close database:", error);
      throw error;
    }
  }

  /**
   * 重置数据库（危险操作）
   */
  async reset(): Promise<void> {
    try {
      await this.close();

      const dbPath = `${FileSystem.documentDirectory}${DATABASE_NAME}`;
      await FileSystem.deleteAsync(dbPath);

      console.log("Database reset successfully");
    } catch (error) {
      console.error("Failed to reset database:", error);
      throw error;
    }
  }

  /**
   * 导出数据为JSON
   */
  async exportData(): Promise<string> {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const data = {
        videos: await this.db.select().from(videoTable),
        watchHistory: await this.db.select().from(watchHistoryTable),
        playlists: await this.db.select().from(playlistTable),
        playlistVideos: await this.db.select().from(playlistVideoTable),
        tags: await this.db.select().from(tagTable),
        videoTags: await this.db.select().from(videoTagTable),
        settings: await this.db.select().from(settingsTable),
        folders: await this.db.select().from(folderTable),
        folderVideos: await this.db.select().from(folderVideoTable),
        bookmarks: await this.db.select().from(bookmarkTable),
        searchIndex: await this.db.select().from(searchIndexTable),
        exportDate: new Date().toISOString(),
        version: "1.0",
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("Failed to export data:", error);
      throw error;
    }
  }

  /**
   * 导入JSON数据
   */
  async importData(jsonData: string): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const data = JSON.parse(jsonData);

      await this.db.transaction(async (tx) => {
        // 清空现有数据（保留设置）
        await tx.delete(videoTagTable);
        await tx.delete(folderVideoTable);
        await tx.delete(playlistVideoTable);
        await tx.delete(bookmarkTable);
        await tx.delete(watchHistoryTable);
        await tx.delete(videoTable);
        await tx.delete(tagTable);
        await tx.delete(playlistTable);
        await tx.delete(folderTable);

        // 导入数据（按依赖关系顺序）
        if (data.tags) {
          for (const tag of data.tags) {
            await tx.insert(tagTable).values(tag);
          }
        }

        if (data.videos) {
          for (const video of data.videos) {
            await tx.insert(videoTable).values(video);
          }
        }

        if (data.playlists) {
          for (const playlist of data.playlists) {
            await tx.insert(playlistTable).values(playlist);
          }
        }

        if (data.folders) {
          for (const folder of data.folders) {
            await tx.insert(folderTable).values(folder);
          }
        }

        if (data.videoTags) {
          for (const videoTag of data.videoTags) {
            await tx.insert(videoTagTable).values(videoTag);
          }
        }

        if (data.playlistVideos) {
          for (const playlistVideo of data.playlistVideos) {
            await tx.insert(playlistVideoTable).values(playlistVideo);
          }
        }

        if (data.folderVideos) {
          for (const folderVideo of data.folderVideos) {
            await tx.insert(folderVideoTable).values(folderVideo);
          }
        }

        if (data.watchHistory) {
          for (const history of data.watchHistory) {
            await tx.insert(watchHistoryTable).values(history);
          }
        }

        if (data.bookmarks) {
          for (const bookmark of data.bookmarks) {
            await tx.insert(bookmarkTable).values(bookmark);
          }
        }
      });

      console.log("Data imported successfully");
      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }
}

// 导出数据库管理器实例
export const databaseManager = DatabaseManager.getInstance();

// 导出初始化函数
export const initializeDatabase = (): Promise<ExpoSQLiteDatabase> => {
  return databaseManager.initialize();
};

// 导出迁移助手
export const useMigrationHelper = () => {
  const db = databaseManager.getDatabase();
  return useMigrations(db, migrations);
};

// 导出数据库实例（向后兼容）
let dbInstance: ExpoSQLiteDatabase | null = null;

export const initialize = async (): Promise<ExpoSQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await initializeDatabase();
  }
  return dbInstance;
};

export const getDatabase = (): ExpoSQLiteDatabase => {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }
  return dbInstance;
};

// 导出类型
export type { ExpoSQLiteDatabase };
