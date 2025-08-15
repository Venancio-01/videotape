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
  return db;
};

export const getExpoDatabase = () => {
  return expoDb;
};

export const useMigrationHelper = () => {
  return useMigrations(db, migrations);
};
