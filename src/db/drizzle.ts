import migrations from "@/db/migrations/migrations";
import { type ExpoSQLiteDatabase, drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";

export const DATABASE_NAME = "videotape.db";

const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
const db = drizzle(expoDb);

export const initialize = (): Promise<ExpoSQLiteDatabase> => {
  return Promise.resolve(db);
};

export const getDatabase = (): ExpoSQLiteDatabase => {
  if (!db) {
    throw new Error("Database is not initialized. Call initialize() first.");
  }
  return db;
};

export const useMigrationHelper = () => {
  return useMigrations(db, migrations);
};
