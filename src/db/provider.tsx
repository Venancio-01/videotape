import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite'
import type { SQLJsDatabase } from "drizzle-orm/sql-js";
import React, {
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { DATABASE_NAME, initialize } from "./drizzle";
import * as schema from "./schema";

type ContextType = {
  db: SQLJsDatabase | ExpoSQLiteDatabase | null;
};

export const DatabaseContext = React.createContext<ContextType>({
  db: null
});

export const useDatabase = () => {
  const db = useSQLiteContext()
  const drizzleDb = drizzle(db, { schema })
  return drizzleDb
}

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [db, setDb] = useState<SQLJsDatabase | ExpoSQLiteDatabase | null>(null);

  useEffect(() => {
    if (db) return;
    initialize().then((newDb) => {
      setDb(newDb);
    });
  }, []);

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} useSuspense>
      {children}
    </SQLiteProvider>
  );
}
