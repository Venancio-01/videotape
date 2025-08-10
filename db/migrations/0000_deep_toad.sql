CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`title` text NOT NULL,
	`position` integer NOT NULL,
	`thumbnail_path` text,
	`description` text,
	`color` text DEFAULT '#EF4444',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`path` text NOT NULL,
	`thumbnail_path` text,
	`description` text,
	`sort_order` text DEFAULT 'name_asc',
	`view_mode` text DEFAULT 'grid',
	`is_system_folder` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `folders_path_unique` ON `folders` (`path`);--> statement-breakpoint
CREATE TABLE `folder_videos` (
	`folder_id` text NOT NULL,
	`video_id` text NOT NULL,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`thumbnail_path` text,
	`video_count` integer DEFAULT 0,
	`total_duration` integer DEFAULT 0,
	`is_public` integer DEFAULT false,
	`is_default` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`play_count` integer DEFAULT 0,
	`last_played_at` text,
	`tags` text DEFAULT '[]',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `playlist_videos` (
	`playlist_id` text NOT NULL,
	`video_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`added_by` text DEFAULT 'user',
	`custom_title` text,
	`custom_thumbnail_path` text,
	`notes` text,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`theme` text DEFAULT 'system',
	`language` text DEFAULT 'zh-CN',
	`default_playback_speed` real DEFAULT 1,
	`default_volume` real DEFAULT 1,
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
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#3B82F6',
	`description` text,
	`usage_count` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`file_path` text NOT NULL,
	`thumbnail_path` text,
	`duration` real NOT NULL,
	`file_size` integer NOT NULL,
	`format` text NOT NULL,
	`resolution_width` integer,
	`resolution_height` integer,
	`tags` text DEFAULT '[]',
	`category` text DEFAULT 'uncategorized' NOT NULL,
	`watch_progress` real DEFAULT 0,
	`is_favorite` integer DEFAULT false,
	`play_count` integer DEFAULT 0,
	`last_watched_at` text,
	`description` text,
	`rating` real DEFAULT 0,
	`is_archived` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_file_path_unique` ON `videos` (`file_path`);--> statement-breakpoint
CREATE TABLE `video_tags` (
	`video_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `watch_history` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`position` real NOT NULL,
	`duration` real NOT NULL,
	`watched_at` text DEFAULT (CURRENT_TIMESTAMP),
	`completed` integer DEFAULT false,
	`watch_time` integer DEFAULT 0,
	`session_id` text,
	`device_id` text,
	`playback_speed` real DEFAULT 1,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
