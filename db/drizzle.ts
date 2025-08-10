import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";

import migrations from "./migrations/migrations";
import { databaseManager } from "./database-manager";

// 保持向后兼容
const expoDb = openDatabaseSync("videotape.db", { enableChangeListener: true });
const db = drizzle(expoDb);

export const initialize = (): Promise<ExpoSQLiteDatabase> => {
  return databaseManager.initialize();
};

export const useMigrationHelper = () => {
  const database = databaseManager.getDatabase();
  return useMigrations(database, migrations);
};

// 导出数据库管理器
export { databaseManager };
export type { ExpoSQLiteDatabase };
