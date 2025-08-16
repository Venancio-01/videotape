import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

// 视频表 - 存储视频文件的基本信息
export const videoTable = sqliteTable("videos", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(), // 视频唯一标识符
  title: text("title").notNull(), // 视频标题
  filePath: text("file_path").notNull().unique(), // 视频文件路径
  thumbnailPath: text("thumbnail_path"), // 缩略图路径
  duration: real("duration").notNull(), // 视频时长（秒）
  fileSize: integer("file_size").notNull(), // 文件大小（字节）
  format: text("format").notNull(), // 视频格式（mp4, mov, etc.）
  watchProgress: real("watch_progress").default(0), // 观看进度（秒）
  playCount: integer("play_count").default(0), // 播放次数
  lastWatchedAt: text("last_watched_at"), // 最后观看时间
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`), // 创建时间
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`), // 更新时间
});

// 播放历史表 - 记录用户的观看历史
export const watchHistoryTable = sqliteTable("watch_history", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(), // 历史记录唯一标识符
  videoId: text("video_id")
    .notNull()
    .references(() => videoTable.id, {
      onDelete: "cascade", // 级联删除：视频删除时自动删除相关历史记录
    }), // 关联的视频ID
  position: real("position").notNull(), // 播放位置（秒）
  duration: real("duration").notNull(), // 视频总时长（秒）
  watchedAt: text("watched_at").default(sql`(CURRENT_TIMESTAMP)`), // 观看时间
  completed: integer("completed", {
    mode: "boolean",
  }).default(false), // 是否已完成观看
  watchTime: integer("watch_time").default(0), // 实际观看时长（秒）
  sessionId: text("session_id"), // 观看会话ID
  playbackSpeed: real("playback_speed").default(1.0), // 播放速度
});

// 播放列表表 - 存储用户创建的播放列表
export const playlistTable = sqliteTable("playlists", {
  id: text("id")
    .$defaultFn(() => createId())
    .notNull()
    .primaryKey(), // 播放列表唯一标识符
  name: text("name").notNull(), // 播放列表名称
  description: text("description"), // 播放列表描述
  thumbnailPath: text("thumbnail_path"), // 播放列表缩略图路径
  videoCount: integer("video_count").default(0), // 视频数量
  totalDuration: integer("total_duration").default(0), // 总时长（秒）
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`), // 创建时间
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`), // 更新时间
});

// 播放列表视频关联表 - 管理播放列表中的视频顺序
export const playlistVideoTable = sqliteTable("playlist_videos", {
  playlistId: text("playlist_id")
    .notNull()
    .references(() => playlistTable.id, {
      onDelete: "cascade", // 级联删除：播放列表删除时自动删除关联关系
    }), // 播放列表ID
  videoId: text("video_id")
    .notNull()
    .references(() => videoTable.id, {
      onDelete: "cascade", // 级联删除：视频删除时自动从播放列表中移除
    }), // 视频ID
  position: integer("position").notNull(), // 在播放列表中的位置顺序
  addedAt: text("added_at").default(sql`(CURRENT_TIMESTAMP)`), // 添加到播放列表的时间
});

// 用户设置表 - 存储应用的个性化设置
export const settingsTable = sqliteTable("settings", {
  id: text("id").default("default").primaryKey(), // 设置ID（默认为"default"）
  theme: text("theme").default("system"), // 主题设置（light/dark/system）
  language: text("language").default("zh-CN"), // 语言设置
  defaultPlaybackSpeed: real("default_playback_speed").default(1.0), // 默认播放速度
  defaultVolume: real("default_volume").default(1.0), // 默认音量（0.0-1.0）
  autoPlay: integer("auto_play", { mode: "boolean" }).default(true), // 自动播放
  loopMode: text("loop_mode").default("none"), // 循环模式（none/one/all）
  showControls: integer("show_controls", { mode: "boolean" }).default(true), // 显示控制条
  enableGestures: integer("enable_gestures", { mode: "boolean" }).default(true), // 启用手势控制
  enableHaptics: integer("enable_haptics", { mode: "boolean" }).default(true), // 启用触觉反馈
  currentPlaylistId: text("current_playlist_id"), // 当前选中的播放列表ID
  autoPlayPlaylist: integer("auto_play_playlist", { mode: "boolean" }).default(
    false,
  ), // 启动时自动播放播放列表
  resumeFromPosition: integer("resume_from_position", {
    mode: "boolean",
  }).default(true), // 从上次位置恢复播放
  lastPlayedVideoId: text("last_played_video_id"), // 上次播放的视频ID
  lastPlayedPosition: real("last_played_position").default(0), // 上次播放的位置（秒）
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`), // 创建时间
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`), // 更新时间
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
  watchHistory?: WatchHistory; // 观看历史记录
  playlists?: Playlist[]; // 所属的播放列表
};

export type PlaylistWithVideos = Playlist & {
  videos: (Video & {
    order: number;
  })[]; // 播放列表中的视频（包含顺序）
};

export type VideoWithRelations = Video & {
  playlists: Playlist[]; // 关联的播放列表
  watchHistory: WatchHistory[]; // 观看历史记录
};

// 查询参数类型
export type VideoSearchParams = {
  query?: string; // 搜索关键词
  minDuration?: number; // 最小时长（秒）
  maxDuration?: number; // 最大时长（秒）
  sortBy?: "created_at" | "title" | "duration" | "play_count"; // 排序字段
  sortOrder?: "asc" | "desc"; // 排序方向
  page?: number; // 页码
  pageSize?: number; // 每页数量
};

export type SearchResult<T> = {
  items: T[]; // 搜索结果项
  total: number; // 总数
  page: number; // 当前页码
  pageSize: number; // 每页数量
  hasMore: boolean; // 是否还有更多数据
};

// 统计类型
export type VideoStats = {
  totalVideos: number; // 视频总数
  totalDuration: number; // 总时长（秒）
  totalSize: number; // 总文件大小（字节）
  totalPlayCount: number; // 总播放次数
};

export type UserStats = {
  totalWatchTime: number; // 总观看时长（秒）
  videosWatched: number; // 已观看视频数
  playlistsCreated: number; // 创建的播放列表数
};
