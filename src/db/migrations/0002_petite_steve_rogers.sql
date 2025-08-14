ALTER TABLE `settings` ADD `current_playlist_id` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `auto_play_playlist` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `settings` ADD `resume_from_position` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `settings` ADD `last_played_video_id` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `last_played_position` real DEFAULT 0;