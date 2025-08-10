-- 添加标签系统
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL UNIQUE,
	`color` text DEFAULT '#3B82F6',
	`description` text,
	`usage_count` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);

-- 创建视频标签关联表
CREATE TABLE `video_tags` (
	`video_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	PRIMARY KEY (`video_id`, `tag_id`)
);

-- 创建用户设置表
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'default',
	`theme` text DEFAULT 'system',
	`language` text DEFAULT 'zh-CN',
	`default_playback_speed` real DEFAULT 1.0,
	`default_volume` real DEFAULT 1.0,
	`auto_play` integer DEFAULT true,
	`loop_mode` text DEFAULT 'none',
	`show_controls` integer DEFAULT true,
	`enable_gestures` integer DEFAULT true,
	`enable_haptics` integer DEFAULT true,
	`skip_intros` integer DEFAULT false,
	`skip_credits` integer DEFAULT false,
	`preferred_quality` text DEFAULT 'auto',
	`subtitle_language` text DEFAULT 'auto',
	`audio_language` text DEFAULT 'auto',
	`max_cache_size` integer DEFAULT 1024,
	`auto_cleanup_cache` integer DEFAULT true,
	`cache_retention_days` integer DEFAULT 30,
	`data_backup_enabled` integer DEFAULT false,
	`last_backup_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);

-- 创建文件夹系统
CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_id` text REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE set null,
	`path` text NOT NULL UNIQUE,
	`thumbnail_path` text,
	`description` text,
	`sort_order` text DEFAULT 'name_asc',
	`view_mode` text DEFAULT 'grid',
	`is_system_folder` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);

-- 创建文件夹视频关联表
CREATE TABLE `folder_videos` (
	`folder_id` text NOT NULL,
	`video_id` text NOT NULL,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	PRIMARY KEY (`folder_id`, `video_id`)
);

-- 创建书签系统
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	`title` text NOT NULL,
	`position` integer NOT NULL,
	`thumbnail_path` text,
	`description` text,
	`color` text DEFAULT '#EF4444',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);

-- 创建搜索索引表
CREATE TABLE `search_index` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`content_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text DEFAULT '[]',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);

-- 更新videos表结构
ALTER TABLE `videos` ADD COLUMN `last_watched_at` text;
ALTER TABLE `videos` ADD COLUMN `description` text;
ALTER TABLE `videos` ADD COLUMN `rating` real DEFAULT 0;
ALTER TABLE `videos` ADD COLUMN `is_archived` integer DEFAULT false;
ALTER TABLE `videos` ADD COLUMN `category` text DEFAULT 'uncategorized';

-- 更新playlists表结构
ALTER TABLE `playlists` ADD COLUMN `thumbnail_path` text;
ALTER TABLE `playlists` ADD COLUMN `total_duration` integer DEFAULT 0;
ALTER TABLE `playlists` ADD COLUMN `is_public` integer DEFAULT false;
ALTER TABLE `playlists` ADD COLUMN `is_default` integer DEFAULT false;
ALTER TABLE `playlists` ADD COLUMN `sort_order` integer DEFAULT 0;
ALTER TABLE `playlists` ADD COLUMN `play_count` integer DEFAULT 0;
ALTER TABLE `playlists` ADD COLUMN `last_played_at` text;
ALTER TABLE `playlists` ADD COLUMN `tags` text DEFAULT '[]';

-- 更新playlist_videos表结构
ALTER TABLE `playlist_videos` ADD COLUMN `added_by` text DEFAULT 'user';
ALTER TABLE `playlist_videos` ADD COLUMN `custom_title` text;
ALTER TABLE `playlist_videos` ADD COLUMN `custom_thumbnail_path` text;
ALTER TABLE `playlist_videos` ADD COLUMN `notes` text;

-- 更新watch_history表结构
ALTER TABLE `watch_history` ADD COLUMN `watch_time` integer DEFAULT 0;
ALTER TABLE `watch_history` ADD COLUMN `session_id` text;
ALTER TABLE `watch_history` ADD COLUMN `device_id` text;
ALTER TABLE `watch_history` ADD COLUMN `playback_speed` real DEFAULT 1.0;

-- 创建索引以提高查询性能
CREATE INDEX `idx_tags_name` ON `tags` (`name`);
CREATE INDEX `idx_tags_usage_count` ON `tags` (`usage_count` DESC);
CREATE INDEX `idx_video_tags_video_id` ON `video_tags` (`video_id`);
CREATE INDEX `idx_video_tags_tag_id` ON `video_tags` (`tag_id`);
CREATE INDEX `idx_settings_id` ON `settings` (`id`);
CREATE INDEX `idx_folders_parent_id` ON `folders` (`parent_id`);
CREATE INDEX `idx_folders_path` ON `folders` (`path`);
CREATE INDEX `idx_folders_name` ON `folders` (`name`);
CREATE INDEX `idx_folders_sort_order` ON `folders` (`sort_order`);
CREATE INDEX `idx_folder_videos_folder_id` ON `folder_videos` (`folder_id`);
CREATE INDEX `idx_folder_videos_video_id` ON `folder_videos` (`video_id`);
CREATE INDEX `idx_bookmarks_video_id` ON `bookmarks` (`video_id`);
CREATE INDEX `idx_bookmarks_position` ON `bookmarks` (`position`);
CREATE INDEX `idx_bookmarks_created_at` ON `bookmarks` (`created_at` DESC);
CREATE INDEX `idx_search_index_content_type` ON `search_index` (`content_type`);
CREATE INDEX `idx_search_index_content_id` ON `search_index` (`content_id`);
CREATE INDEX `idx_search_index_title` ON `search_index` (`title`);
CREATE INDEX `idx_search_index_content` ON `search_index` (`content`);

-- 创建复合索引以优化搜索和排序
CREATE INDEX `idx_videos_search` ON `videos` (`title`, `description`, `category`);
CREATE INDEX `idx_videos_sorting` ON `videos` (`category`, `created_at` DESC, `play_count` DESC);
CREATE INDEX `idx_videos_performance` ON `videos` (`duration`, `file_size`, `play_count`);
CREATE INDEX `idx_playlists_performance` ON `playlists` (`name`, `is_public`, `video_count`);
CREATE INDEX `idx_watch_history_performance` ON `watch_history` (`video_id`, `watched_at` DESC, `completed`);

-- 插入默认设置
INSERT INTO `settings` (
	`id`, `theme`, `language`, `default_playback_speed`, `default_volume`, 
	`auto_play`, `loop_mode`, `show_controls`, `enable_gestures`, `enable_haptics`,
	`max_cache_size`, `auto_cleanup_cache`, `cache_retention_days`, `created_at`
) VALUES (
	'default', 'system', 'zh-CN', 1.0, 1.0, 
	true, 'none', true, true, true,
	1024, true, 30, CURRENT_TIMESTAMP
);

-- 插入默认文件夹
INSERT INTO `folders` (
	`id`, `name`, `path`, `is_system_folder`, `created_at`
) VALUES 
('root', 'Videos', '/videos', true, CURRENT_TIMESTAMP),
('favorites', 'Favorites', '/favorites', true, CURRENT_TIMESTAMP),
('recent', 'Recent', '/recent', true, CURRENT_TIMESTAMP);