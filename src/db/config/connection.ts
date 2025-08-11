/**
 * 数据库连接管理
 * 统一的数据库连接配置和管理
 */

import { type ExpoSQLiteDatabase, drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { DATABASE_CONFIG } from './index';
import { ConnectionError } from '../types';

// 数据库连接实例
let dbInstance: ExpoSQLiteDatabase | null = null;
let isInitializing = false;

/**
 * 获取数据库连接
 */
export function getDatabase(): ExpoSQLiteDatabase {
  if (!dbInstance) {
    throw new Error("数据库未初始化。请先调用 initializeDatabase()。");
  }
  return dbInstance;
}

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(): Promise<ExpoSQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (isInitializing) {
    // 等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 100));
    return getDatabase();
  }

  isInitializing = true;

  try {
    // 打开数据库连接
    const expoDb = openDatabaseSync(DATABASE_CONFIG.databasePath, {
      enableChangeListener: true,
    });

    // 创建 Drizzle 实例
    dbInstance = drizzle(expoDb);

    // 启用外键约束
    await dbInstance.run('PRAGMA foreign_keys = ON');
    
    // 启用 WAL 模式以提高性能
    await dbInstance.run('PRAGMA journal_mode = WAL');
    
    // 设置缓存大小
    await dbInstance.run(`PRAGMA cache_size = ${DATABASE_CONFIG.performance.cacheSize}`);

    console.log('数据库连接初始化成功');
    return dbInstance;
  } catch (error) {
    isInitializing = false;
    throw new ConnectionError(error instanceof Error ? error : undefined);
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  // SQLite 连接由 Expo 管理，这里主要清理状态
  dbInstance = null;
  isInitializing = false;
  console.log('数据库连接已关闭');
}

/**
 * 检查数据库连接状态
 */
export function isDatabaseConnected(): boolean {
  return dbInstance !== null;
}

/**
 * 获取迁移助手 Hook
 */
export function useMigrationHelper() {
  if (!dbInstance) {
    throw new Error("数据库未初始化。请先调用 initializeDatabase()。");
  }
  
  // 动态导入迁移文件
  const migrations = require('../migrations/migrations');
  return useMigrations(dbInstance, migrations);
}

/**
 * 重置数据库连接（主要用于测试）
 */
export async function resetDatabase(): Promise<void> {
  await closeDatabase();
  await initializeDatabase();
}

// 导出单例实例
export { dbInstance };