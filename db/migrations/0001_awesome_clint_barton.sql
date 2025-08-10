CREATE TABLE `playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`video_count` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `playlist_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`playlist_id` text NOT NULL,
	`video_id` text NOT NULL,
	`order` integer NOT NULL,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
	`category` text DEFAULT 'general' NOT NULL,
	`watch_progress` real DEFAULT 0,
	`is_favorite` integer DEFAULT false,
	`play_count` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_file_path_unique` ON `videos` (`file_path`);--> statement-breakpoint
CREATE TABLE `watch_history` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`position` real DEFAULT 0 NOT NULL,
	`duration` real NOT NULL,
	`watched_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`completed` integer DEFAULT false,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
