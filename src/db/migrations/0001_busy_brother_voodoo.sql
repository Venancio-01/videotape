DROP TABLE `bookmarks`;--> statement-breakpoint
DROP TABLE `folders`;--> statement-breakpoint
DROP TABLE `folder_videos`;--> statement-breakpoint
DROP TABLE `search_index`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
DROP TABLE `video_tags`;--> statement-breakpoint
ALTER TABLE `playlists` DROP COLUMN `is_public`;--> statement-breakpoint
ALTER TABLE `playlists` DROP COLUMN `is_default`;--> statement-breakpoint
ALTER TABLE `playlists` DROP COLUMN `sort_order`;--> statement-breakpoint
ALTER TABLE `playlists` DROP COLUMN `play_count`;--> statement-breakpoint
ALTER TABLE `playlists` DROP COLUMN `last_played_at`;--> statement-breakpoint
ALTER TABLE `playlists` DROP COLUMN `tags`;--> statement-breakpoint
ALTER TABLE `playlist_videos` DROP COLUMN `added_by`;--> statement-breakpoint
ALTER TABLE `playlist_videos` DROP COLUMN `custom_title`;--> statement-breakpoint
ALTER TABLE `playlist_videos` DROP COLUMN `custom_thumbnail_path`;--> statement-breakpoint
ALTER TABLE `playlist_videos` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `skip_intros`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `skip_credits`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `preferred_quality`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `subtitle_language`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `audio_language`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `max_cache_size`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `auto_cleanup_cache`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `cache_retention_days`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `data_backup_enabled`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `last_backup_at`;--> statement-breakpoint
ALTER TABLE `videos` DROP COLUMN `tags`;--> statement-breakpoint
ALTER TABLE `videos` DROP COLUMN `category`;--> statement-breakpoint
ALTER TABLE `videos` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `videos` DROP COLUMN `rating`;--> statement-breakpoint
ALTER TABLE `videos` DROP COLUMN `is_archived`;--> statement-breakpoint
ALTER TABLE `watch_history` DROP COLUMN `device_id`;