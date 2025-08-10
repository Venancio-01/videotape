import { type ExpoSQLiteDatabase, drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";

import { databaseManager } from "./database-manager";
import migrations from "./migrations/migrations";

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
