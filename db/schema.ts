import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";
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
  category: text("category").notNull().default("general"),
  watchProgress: real("watch_progress").default(0), // 秒
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false),
  playCount: integer("play_count").default(0),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 播放历史表
export const watchHistoryTable = sqliteTable("watch_history", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  videoId: text("video_id").notNull().references(() => videoTable.id, {
    onDelete: "cascade",
  }),
  position: real("position").notNull(), // 秒
  duration: real("duration").notNull(), // 秒
  watchedAt: text("watched_at").default(sql`(CURRENT_TIMESTAMP)`),
  completed: integer("completed", {
    mode: "boolean",
  }).default(false),
});

// 播放列表表
export const playlistTable = sqliteTable("playlists", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  videoCount: integer("video_count").default(0),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 播放列表视频关联表
export const playlistVideoTable = sqliteTable("playlist_videos", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(),
  playlistId: text("playlist_id").notNull().references(() => playlistTable.id, {
    onDelete: "cascade",
  }),
  videoId: text("video_id").notNull().references(() => videoTable.id, {
    onDelete: "cascade",
  }),
  order: integer("order").notNull(),
  addedAt: text("added_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 数据库Schema
export const VideoSchema = createSelectSchema(videoTable);
export const WatchHistorySchema = createSelectSchema(watchHistoryTable);
export const PlaylistSchema = createSelectSchema(playlistTable);
export const PlaylistVideoSchema = createSelectSchema(playlistVideoTable);

// TypeScript类型
export type Video = z.infer<typeof VideoSchema>;
export type WatchHistory = z.infer<typeof WatchHistorySchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
export type PlaylistVideo = z.infer<typeof PlaylistVideoSchema>;

// 扩展类型，包含关联数据
export type VideoWithHistory = Video & {
  watchHistory?: WatchHistory;
  resolution?: {
    width: number;
    height: number;
  };
};
export type PlaylistWithVideos = Playlist & {
  videos: (Video & { order: number })[];
};