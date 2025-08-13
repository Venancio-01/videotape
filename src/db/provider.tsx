import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLJsDatabase } from "drizzle-orm/sql-js";
import React, {
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { databaseService } from "./database-service";
import { initialize } from "./drizzle";

type ContextType = {
  db: SQLJsDatabase | ExpoSQLiteDatabase | null;
  databaseService: typeof databaseService;
};

export const DatabaseContext = React.createContext<ContextType>({
  db: null,
  databaseService,
});

export const useDatabase = () => useContext(DatabaseContext);

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [db, setDb] = useState<SQLJsDatabase | ExpoSQLiteDatabase | null>(null);

  useEffect(() => {
    if (db) return;
    initialize().then((newDb) => {
      setDb(newDb);
    });
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, databaseService }}>
      {children}
    </DatabaseContext.Provider>
  );
}
