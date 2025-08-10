import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLJsDatabase } from "drizzle-orm/sql-js";
import React, {
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { databasePerformanceService } from "./database-performance";
import { databaseService } from "./database-service";
import { databaseManager, initialize } from "./drizzle";

interface DatabaseContextType {
  db: SQLJsDatabase | ExpoSQLiteDatabase | null;
  isInitialized: boolean;
  error: Error | null;
  databaseService: typeof databaseService;
  databasePerformanceService: typeof databasePerformanceService;
}

export const DatabaseContext = React.createContext<DatabaseContextType>({
  db: null,
  isInitialized: false,
  error: null,
  databaseService,
  databasePerformanceService,
});

export const useDatabase = () => useContext(DatabaseContext);

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [db, setDb] = useState<SQLJsDatabase | ExpoSQLiteDatabase | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isInitialized) return;

    const initializeDatabase = async () => {
      try {
        // 初始化数据库
        const database = await initialize();
        setDb(database);

        // 运行迁移
        await databaseManager.runMigrations();

        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error("Failed to initialize database:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Database initialization failed"),
        );
        setIsInitialized(false);
      }
    };

    initializeDatabase();
  }, [isInitialized]);

  const value: DatabaseContextType = {
    db,
    isInitialized,
    error,
    databaseService,
    databasePerformanceService,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}
