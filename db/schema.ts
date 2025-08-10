import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

// 视频表
export const videoTable = sqliteTable("videos", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  title: text("title").notNull(),
  filePath: text("file_path").notNull().unique(),
  thumbnailPath: text("thumbnail_path"),
  duration: real("duration").notNull(), // 秒
  fileSize: integer("file_size").notNull(), // 字节
  format: text("format").notNull(), // mp4, mov, etc.
  resolutionWidth: integer("resolution_width"),
  resolutionHeight: integer("resolution_height"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  category: text("category").notNull().default("uncategorized"),
  watchProgress: real("watch_progress").default(0), // 秒
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false),
  playCount: integer("play_count").default(0),
  lastWatchedAt: text("last_watched_at"),
  description: text("description"),
  rating: real("rating").default(0),
  isArchived: integer("is_archived", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 播放历史表
export const watchHistoryTable = sqliteTable("watch_history", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  videoId: text("video_id")
    .notNull()
    .references(() => videoTable.id, {
      onDelete: "cascade",
    }),
  position: real("position").notNull(), // 秒
  duration: real("duration").notNull(), // 秒
  watchedAt: text("watched_at").default(sql`(CURRENT_TIMESTAMP)`),
  completed: integer("completed", {
    mode: "boolean",
  }).default(false),
  watchTime: integer("watch_time").default(0), // 观看时长（秒）
  sessionId: text("session_id"),
  deviceId: text("device_id"),
  playbackSpeed: real("playback_speed").default(1.0),
});

// 播放列表表
export const playlistTable = sqliteTable("playlists", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailPath: text("thumbnail_path"),
  videoCount: integer("video_count").default(0),
  totalDuration: integer("total_duration").default(0), // 总时长（秒）
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
  playCount: integer("play_count").default(0),
  lastPlayedAt: text("last_played_at"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 播放列表视频关联表
export const playlistVideoTable = sqliteTable("playlist_videos", {
  playlistId: text("playlist_id")
    .notNull()
    .references(() => playlistTable.id, {
      onDelete: "cascade",
    }),
  videoId: text("video_id")
    .notNull()
    .references(() => videoTable.id, {
      onDelete: "cascade",
    }),
  position: integer("position").notNull(),
  addedAt: text("added_at").default(sql`(CURRENT_TIMESTAMP)`),
  addedBy: text("added_by").default("user"),
  customTitle: text("custom_title"),
  customThumbnailPath: text("custom_thumbnail_path"),
  notes: text("notes"),
});

// 标签表
export const tagTable = sqliteTable("tags", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").default("#3B82F6"),
  description: text("description"),
  usageCount: integer("usage_count").default(0),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 视频标签关联表
export const videoTagTable = sqliteTable("video_tags", {
  videoId: text("video_id")
    .notNull()
    .references(() => videoTable.id, {
      onDelete: "cascade",
    }),
  tagId: text("tag_id")
    .notNull()
    .references(() => tagTable.id, {
      onDelete: "cascade",
    }),
});

// 用户设置表
export const settingsTable = sqliteTable("settings", {
  id: text("id").default("default").primaryKey(),
  theme: text("theme").default("system"),
  language: text("language").default("zh-CN"),
  defaultPlaybackSpeed: real("default_playback_speed").default(1.0),
  defaultVolume: real("default_volume").default(1.0),
  autoPlay: integer("auto_play", { mode: "boolean" }).default(true),
  loopMode: text("loop_mode").default("none"),
  showControls: integer("show_controls", { mode: "boolean" }).default(true),
  enableGestures: integer("enable_gestures", { mode: "boolean" }).default(true),
  enableHaptics: integer("enable_haptics", { mode: "boolean" }).default(true),
  skipIntros: integer("skip_intros", { mode: "boolean" }).default(false),
  skipCredits: integer("skip_credits", { mode: "boolean" }).default(false),
  preferredQuality: text("preferred_quality").default("auto"),
  subtitleLanguage: text("subtitle_language").default("auto"),
  audioLanguage: text("audio_language").default("auto"),
  maxCacheSize: integer("max_cache_size").default(1024), // MB
  autoCleanupCache: integer("auto_cleanup_cache", { mode: "boolean" }).default(true),
  cacheRetentionDays: integer("cache_retention_days").default(30),
  dataBackupEnabled: integer("data_backup_enabled", { mode: "boolean" }).default(false),
  lastBackupAt: text("last_backup_at"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 文件夹表
const folderTable = sqliteTable("folders", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  name: text("name").notNull(),
  parentId: text("parent_id").references(function() {
    return folderTable.id;
  }, {
    onDelete: "set null",
  }),
  path: text("path").notNull().unique(),
  thumbnailPath: text("thumbnail_path"),
  description: text("description"),
  sortOrder: text("sort_order").default("name_asc"),
  viewMode: text("view_mode").default("grid"),
  isSystemFolder: integer("is_system_folder", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export { folderTable };

// 文件夹视频关联表
export const folderVideoTable = sqliteTable("folder_videos", {
  folderId: text("folder_id")
    .notNull()
    .references(() => folderTable.id, {
      onDelete: "cascade",
    }),
  videoId: text("video_id")
    .notNull()
    .references(() => videoTable.id, {
      onDelete: "cascade",
    }),
  addedAt: text("added_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 书签表
export const bookmarkTable = sqliteTable("bookmarks", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  videoId: text("video_id")
    .notNull()
    .references(() => videoTable.id, {
      onDelete: "cascade",
    }),
  title: text("title").notNull(),
  position: integer("position").notNull(), // 书签位置（秒）
  thumbnailPath: text("thumbnail_path"),
  description: text("description"),
  color: text("color").default("#EF4444"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 搜索索引表
export const searchIndexTable = sqliteTable("search_index", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  contentType: text("content_type").notNull(),
  contentId: text("content_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 数据库Schema
export const VideoSchema = createSelectSchema(videoTable);
export const WatchHistorySchema = createSelectSchema(watchHistoryTable);
export const PlaylistSchema = createSelectSchema(playlistTable);
export const PlaylistVideoSchema = createSelectSchema(playlistVideoTable);
export const TagSchema = createSelectSchema(tagTable);
export const VideoTagSchema = createSelectSchema(videoTagTable);
export const SettingsSchema = createSelectSchema(settingsTable);
export const FolderSchema = createSelectSchema(folderTable);
export const FolderVideoSchema = createSelectSchema(folderVideoTable);
export const BookmarkSchema = createSelectSchema(bookmarkTable);
export const SearchIndexSchema = createSelectSchema(searchIndexTable);

// TypeScript类型
export type Video = z.infer<typeof VideoSchema>;
export type WatchHistory = z.infer<typeof WatchHistorySchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
export type PlaylistVideo = z.infer<typeof PlaylistVideoSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type VideoTag = z.infer<typeof VideoTagSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Folder = z.infer<typeof FolderSchema>;
export type FolderVideo = z.infer<typeof FolderVideoSchema>;
export type Bookmark = z.infer<typeof BookmarkSchema>;
export type SearchIndex = z.infer<typeof SearchIndexSchema>;

// 扩展类型，包含关联数据
export type VideoWithHistory = Video & {
  watchHistory?: WatchHistory;
  resolution?: {
    width: number;
    height: number;
  };
  tags?: Tag[];
  playlists?: Playlist[];
  bookmarks?: Bookmark[];
};

export type PlaylistWithVideos = Playlist & {
  videos: (Video & { 
    order: number; 
    customTitle?: string;
    customThumbnailPath?: string;
    notes?: string;
  })[];
};

export type FolderWithVideos = Folder & {
  videos: Video[];
  children?: Folder[];
};

export type VideoWithRelations = Video & {
  tags: Tag[];
  playlists: Playlist[];
  folder?: Folder;
  bookmarks: Bookmark[];
  watchHistory: WatchHistory[];
};

// 查询参数类型
export type VideoSearchParams = {
  query?: string;
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'created_at' | 'title' | 'duration' | 'rating' | 'play_count';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type SearchResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// 统计类型
export type VideoStats = {
  totalVideos: number;
  totalDuration: number;
  totalSize: number;
  totalPlayCount: number;
  averageRating: number;
  categories: Record<string, number>;
};

export type UserStats = {
  totalWatchTime: number;
  videosWatched: number;
  playlistsCreated: number;
  bookmarksCreated: number;
  favoriteVideos: number;
};
