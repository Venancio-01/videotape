import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase as NativeSQLiteDatabase } from "expo-sqlite";
import React, {
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { databasePerformanceService } from "./database-performance";
import { databaseService } from "./database-service";
import migrations from "./migrations/migrations";
import { DatabaseErrorHandler } from "./components/DatabaseErrorHandler";

interface DatabaseContextType {
  db: ExpoSQLiteDatabase | null;
  isInitialized: boolean;
  error: Error | null;
  databaseService: typeof databaseService;
  databasePerformanceService: typeof databasePerformanceService;
}

const DatabaseContext = React.createContext<DatabaseContextType>({
  db: null,
  isInitialized: false,
  error: null,
  databaseService,
  databasePerformanceService,
});

export const useDatabase = () => useContext(DatabaseContext);

async function migrateDbIfNeeded(db: NativeSQLiteDatabase) {
  const DATABASE_VERSION = 1;
  
  try {
    // 获取当前数据库版本
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentDbVersion = result?.user_version || 0;
    
    if (currentDbVersion >= DATABASE_VERSION) {
      return;
    }

    console.log(`Running migrations from version ${currentDbVersion} to ${DATABASE_VERSION}`);

    // 配置数据库参数
    await db.execAsync("PRAGMA foreign_keys = ON;");
    await db.execAsync("PRAGMA journal_mode = WAL;");
    await db.execAsync("PRAGMA synchronous = NORMAL;");
    await db.execAsync("PRAGMA cache_size = -2000;");
    await db.execAsync("PRAGMA temp_store = MEMORY;");
    await db.execAsync("PRAGMA mmap_size = 268435456;");

    // 运行 Drizzle 迁移
    const drizzleDb = drizzle(db);
    await runDrizzleMigrations(drizzleDb);

    // 更新数据库版本
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Database migration failed:", error);
    throw error;
  }
}

async function runDrizzleMigrations(db: ExpoSQLiteDatabase) {
  // 创建视频表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      thumbnail_path TEXT,
      duration REAL NOT NULL,
      file_size INTEGER NOT NULL,
      format TEXT NOT NULL,
      resolution_width INTEGER,
      resolution_height INTEGER,
      tags TEXT DEFAULT '[]',
      category TEXT NOT NULL DEFAULT 'uncategorized',
      watch_progress REAL DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      last_watched_at TEXT,
      description TEXT,
      rating REAL DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建播放历史表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS watch_history (
      id TEXT PRIMARY KEY NOT NULL,
      video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      position REAL NOT NULL,
      duration REAL NOT NULL,
      watched_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed INTEGER DEFAULT 0,
      watch_time INTEGER DEFAULT 0,
      session_id TEXT,
      device_id TEXT,
      playback_speed REAL DEFAULT 1.0
    );
  `);

  // 创建播放列表表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      thumbnail_path TEXT,
      video_count INTEGER DEFAULT 0,
      total_duration INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      last_played_at TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建播放列表视频关联表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS playlist_videos (
      playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      added_by TEXT DEFAULT 'user',
      custom_title TEXT,
      custom_thumbnail_path TEXT,
      notes TEXT,
      PRIMARY KEY (playlist_id, video_id)
    );
  `);

  // 创建标签表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3B82F6',
      description TEXT,
      usage_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建视频标签关联表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS video_tags (
      video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (video_id, tag_id)
    );
  `);

  // 创建设置表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      theme TEXT DEFAULT 'system',
      language TEXT DEFAULT 'zh-CN',
      default_playback_speed REAL DEFAULT 1.0,
      default_volume REAL DEFAULT 1.0,
      auto_play INTEGER DEFAULT 1,
      loop_mode TEXT DEFAULT 'none',
      show_controls INTEGER DEFAULT 1,
      enable_gestures INTEGER DEFAULT 1,
      enable_haptics INTEGER DEFAULT 1,
      skip_intros INTEGER DEFAULT 0,
      skip_credits INTEGER DEFAULT 0,
      preferred_quality TEXT DEFAULT 'auto',
      subtitle_language TEXT DEFAULT 'auto',
      audio_language TEXT DEFAULT 'auto',
      max_cache_size INTEGER DEFAULT 1024,
      auto_cleanup_cache INTEGER DEFAULT 1,
      cache_retention_days INTEGER DEFAULT 30,
      data_backup_enabled INTEGER DEFAULT 0,
      last_backup_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建文件夹表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      path TEXT NOT NULL UNIQUE,
      thumbnail_path TEXT,
      description TEXT,
      sort_order TEXT DEFAULT 'name_asc',
      view_mode TEXT DEFAULT 'grid',
      is_system_folder INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建文件夹视频关联表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS folder_videos (
      folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
      video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (folder_id, video_id)
    );
  `);

  // 创建书签表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      position INTEGER NOT NULL,
      thumbnail_path TEXT,
      description TEXT,
      color TEXT DEFAULT '#EF4444',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建搜索索引表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS search_index (
      id TEXT PRIMARY KEY NOT NULL,
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("All database tables created successfully");
}

function DatabaseProviderContent({ children }: PropsWithChildren) {
  const nativeDb = useSQLiteContext();
  const [db, setDb] = useState<ExpoSQLiteDatabase | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (nativeDb) {
      try {
        const drizzleDb = drizzle(nativeDb);
        setDb(drizzleDb);
        setIsInitialized(true);
        setError(null);
        console.log("Drizzle database initialized successfully");
      } catch (err) {
        console.error("Failed to initialize Drizzle database:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to initialize Drizzle database"),
        );
        setIsInitialized(false);
      }
    }
  }, [nativeDb]);

  const value: DatabaseContextType = {
    db,
    isInitialized,
    error,
    databaseService,
    databasePerformanceService,
  };

  return (
    <DatabaseContext.Provider value={value}>
      <DatabaseErrorHandler>
        {children}
      </DatabaseErrorHandler>
    </DatabaseContext.Provider>
  );
}

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider 
      databaseName="videotape.db" 
      onInit={migrateDbIfNeeded}
      useSuspense={false}
    >
      <DatabaseProviderContent>
        {children}
      </DatabaseProviderContent>
    </SQLiteProvider>
  );
}
