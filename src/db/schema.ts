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
  watchProgress: real("watch_progress").default(0), // 秒
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false),
  playCount: integer("play_count").default(0),
  lastWatchedAt: text("last_watched_at"),
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
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});



// 数据库Schema
export const VideoSchema = createSelectSchema(videoTable);
export const WatchHistorySchema = createSelectSchema(watchHistoryTable);
export const PlaylistSchema = createSelectSchema(playlistTable);
export const PlaylistVideoSchema = createSelectSchema(playlistVideoTable);
export const SettingsSchema = createSelectSchema(settingsTable);

// TypeScript类型
export type Video = z.infer<typeof VideoSchema>;
export type WatchHistory = z.infer<typeof WatchHistorySchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
export type PlaylistVideo = z.infer<typeof PlaylistVideoSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

// 扩展类型，包含关联数据
export type VideoWithHistory = Video & {
  watchHistory?: WatchHistory;
  resolution?: {
    width: number;
    height: number;
  };
  playlists?: Playlist[];
};

export type PlaylistWithVideos = Playlist & {
  videos: (Video & {
    order: number;
  })[];
};

export type VideoWithRelations = Video & {
  playlists: Playlist[];
  watchHistory: WatchHistory[];
};

// 查询参数类型
export type VideoSearchParams = {
  query?: string;
  isFavorite?: boolean;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: "created_at" | "title" | "duration" | "play_count";
  sortOrder?: "asc" | "desc";
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
};

export type UserStats = {
  totalWatchTime: number;
  videosWatched: number;
  playlistsCreated: number;
  favoriteVideos: number;
};
