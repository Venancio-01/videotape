import migrations from "@/db/migrations/migrations";
import { type ExpoSQLiteDatabase, drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";

export const DATABASE_NAME = "videotape.db";

// 检查是否在 Expo 环境中运行
const isExpoEnvironment = typeof window !== "undefined" && window.expo;

// 仅在 Expo 环境中初始化数据库
let expoDb: any = null;
let db: ExpoSQLiteDatabase | null = null;

if (isExpoEnvironment) {
  try {
    expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
    db = drizzle(expoDb);
  } catch (error) {
    // Failed to initialize database in non-Expo environment
  }
}

export const initialize = (): Promise<ExpoSQLiteDatabase> => {
  if (!db) {
    return Promise.reject(
      new Error("Database not available in current environment"),
    );
  }
  return Promise.resolve(db);
};

export const getDatabase = (): ExpoSQLiteDatabase => {
  if (!db) {
    throw new Error("Database not available in current environment");
  }
  return db;
};

export const getExpoDatabase = () => {
  if (!expoDb) {
    throw new Error("Database not available in current environment");
  }
  return expoDb;
};

export const useMigrationHelper = () => {
  if (!db) {
    return { success: false, error: "Database not available" };
  }
  return useMigrations(db, migrations);
};
