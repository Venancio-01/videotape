DROP TABLE `habits`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_watch_history` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`position` real NOT NULL,
	`duration` real NOT NULL,
	`watched_at` text DEFAULT (CURRENT_TIMESTAMP),
	`completed` integer DEFAULT false,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_watch_history`("id", "video_id", "position", "duration", "watched_at", "completed") SELECT "id", "video_id", "position", "duration", "watched_at", "completed" FROM `watch_history`;--> statement-breakpoint
DROP TABLE `watch_history`;--> statement-breakpoint
ALTER TABLE `__new_watch_history` RENAME TO `watch_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;