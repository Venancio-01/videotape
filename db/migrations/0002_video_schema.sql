-- 创建视频表
CREATE TABLE `videos` (
	`id` text NOT NULL PRIMARY KEY,
	`title` text NOT NULL,
	`file_path` text NOT NULL UNIQUE,
	`thumbnail_path` text,
	`duration` real NOT NULL,
	`file_size` integer NOT NULL,
	`format` text NOT NULL,
	`resolution_width` integer,
	`resolution_height` integer,
	`tags` text DEFAULT '[]',
	`category` text NOT NULL DEFAULT 'general',
	`watch_progress` real DEFAULT 0,
	`is_favorite` integer DEFAULT false,
	`play_count` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);

-- 创建播放历史表
CREATE TABLE `watch_history` (
	`id` text NOT NULL PRIMARY KEY,
	`video_id` text NOT NULL REFERENCES `videos` (`id`) ON DELETE CASCADE,
	`position` real DEFAULT 0,
	`duration` real NOT NULL,
	`watched_at` text DEFAULT (CURRENT_TIMESTAMP),
	`completed` integer DEFAULT false
);

-- 创建播放列表表
CREATE TABLE `playlists` (
	`id` text NOT NULL PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`video_count` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);

-- 创建播放列表视频关联表
CREATE TABLE `playlist_videos` (
	`id` text NOT NULL PRIMARY KEY,
	`playlist_id` text NOT NULL REFERENCES `playlists` (`id`) ON DELETE CASCADE,
	`video_id` text NOT NULL REFERENCES `videos` (`id`) ON DELETE CASCADE,
	`order` integer NOT NULL,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP)
);

-- 创建索引以提高查询性能
CREATE INDEX `idx_videos_category` ON `videos` (`category`);
CREATE INDEX `idx_videos_created_at` ON `videos` (`created_at` DESC);
CREATE INDEX `idx_videos_favorite` ON `videos` (`is_favorite`);
CREATE INDEX `idx_watch_history_video_id` ON `watch_history` (`video_id`);
CREATE INDEX `idx_watch_history_watched_at` ON `watch_history` (`watched_at` DESC);
CREATE INDEX `idx_playlist_videos_playlist_id` ON `playlist_videos` (`playlist_id`);
CREATE INDEX `idx_playlist_videos_order` ON `playlist_videos` (`playlist_id`, `order`);