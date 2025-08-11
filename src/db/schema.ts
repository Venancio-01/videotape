/**
 * 数据库模型定义
 * 基于 Drizzle ORM 的数据库模型
 */

import { relations } from 'drizzle-orm';
import {
  integer,
  text,
  real,
  boolean,
  timestamp,
  index,
  pgTable,
  jsonb,
} from 'drizzle-orm/pg-core';

// 文件表
export const files = pgTable('files', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  uri: text('uri').notNull().unique(),
  size: integer('size').notNull().default(0),
  type: text('type').notNull().default('unknown'),
  mimeType: text('mime_type').notNull().default('application/octet-stream'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  modifiedAt: timestamp('modified_at').notNull().defaultNow(),
  hash: text('hash'),
  thumbnailUri: text('thumbnail_uri'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  parentId: text('parent_id'),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
}, (table) => ({
  nameIndex: index('files_name_idx').on(table.name),
  typeIndex: index('files_type_idx').on(table.type),
  createdAtIndex: index('files_created_at_idx').on(table.createdAt),
  parentIdIndex: index('files_parent_id_idx').on(table.parentId),
  isDeletedIndex: index('files_is_deleted_idx').on(table.isDeleted),
}));

// 目录表
export const directories = pgTable('directories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  modifiedAt: timestamp('modified_at').notNull().defaultNow(),
  parentId: text('parent_id'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  itemCount: integer('item_count').notNull().default(0),
  totalSize: integer('total_size').notNull().default(0),
}, (table) => ({
  nameIndex: index('directories_name_idx').on(table.name),
  pathIndex: index('directories_path_idx').on(table.path),
  parentIdIndex: index('directories_parent_id_idx').on(table.parentId),
  isDeletedIndex: index('directories_is_deleted_idx').on(table.isDeleted),
}));

// 视频元数据表
export const videoMetadata = pgTable('video_metadata', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  duration: real('duration').notNull().default(0),
  width: integer('width').notNull().default(0),
  height: integer('height').notNull().default(0),
  bitrate: integer('bitrate').notNull().default(0),
  frameRate: real('frame_rate').notNull().default(0),
  codec: text('codec').notNull().default('unknown'),
  format: text('format').notNull().default('unknown'),
  hasAudio: boolean('has_audio').notNull().default(true),
  audioCodec: text('audio_codec'),
  audioBitrate: integer('audio_bitrate'),
  audioChannels: integer('audio_channels'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  fileIdIndex: index('video_metadata_file_id_idx').on(table.fileId),
  durationIndex: index('video_metadata_duration_idx').on(table.duration),
  resolutionIndex: index('video_metadata_resolution_idx').on(table.width, table.height),
}));

// 视频缩略图表
export const videoThumbnails = pgTable('video_thumbnails', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  uri: text('uri').notNull(),
  timestamp: real('timestamp').notNull().default(0),
  width: integer('width').notNull().default(0),
  height: integer('height').notNull().default(0),
  size: integer('size').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  fileIdIndex: index('video_thumbnails_file_id_idx').on(table.fileId),
  timestampIndex: index('video_thumbnails_timestamp_idx').on(table.timestamp),
  isPrimaryIndex: index('video_thumbnails_is_primary_idx').on(table.isPrimary),
}));

// 文件分类表
export const fileCategories = pgTable('file_categories', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  fileIdIndex: index('file_categories_file_id_idx').on(table.fileId),
  categoryIndex: index('file_categories_category_idx').on(table.category),
  uniqueIndex: index('file_categories_file_id_category_unique').on(table.fileId, table.category),
}));

// 文件标签表
export const fileTags = pgTable('file_tags', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  fileIdIndex: index('file_tags_file_id_idx').on(table.fileId),
  tagIndex: index('file_tags_tag_idx').on(table.tag),
  uniqueIndex: index('file_tags_file_id_tag_unique').on(table.fileId, table.tag),
}));

// 文件搜索索引表
export const fileSearchIndex = pgTable('file_search_index', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  searchableText: text('searchable_text').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  fileIdIndex: index('file_search_index_file_id_idx').on(table.fileId),
  searchTextIndex: index('file_search_index_search_text_idx').on(table.searchableText),
}));

// 文件操作日志表
export const fileOperationLogs = pgTable('file_operation_logs', {
  id: text('id').primaryKey(),
  fileId: text('file_id').references(() => files.id, { onDelete: 'set null' }),
  operation: text('operation').notNull(), // 'create', 'read', 'update', 'delete', 'copy', 'move'
  details: jsonb('details').$type<Record<string, any>>().default({}),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  userId: text('user_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
}, (table) => ({
  fileIdIndex: index('file_operation_logs_file_id_idx').on(table.fileId),
  operationIndex: index('file_operation_logs_operation_idx').on(table.operation),
  timestampIndex: index('file_operation_logs_timestamp_idx').on(table.timestamp),
}));

// 文件备份记录表
export const fileBackupRecords = pgTable('file_backup_records', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  backupPath: text('backup_path').notNull(),
  backupSize: integer('backup_size').notNull().default(0),
  compressionRatio: real('compression_ratio').notNull().default(1.0),
  isEncrypted: boolean('is_encrypted').notNull().default(false),
  checksum: text('checksum'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  fileIdIndex: index('file_backup_records_file_id_idx').on(table.fileId),
  createdAtIndex: index('file_backup_records_created_at_idx').on(table.createdAt),
  expiresAtIndex: index('file_backup_records_expires_at_idx').on(table.expiresAt),
}));

// 系统配置表
export const systemConfig = pgTable('system_config', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').$type<any>().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  keyIndex: index('system_config_key_idx').on(table.key),
}));

// 播放列表表
export const playlistTable = pgTable('playlists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  thumbnailPath: text('thumbnail_path'),
  videoCount: integer('video_count').notNull().default(0),
  totalDuration: integer('total_duration').notNull().default(0),
  isPublic: boolean('is_public').notNull().default(false),
  isDefault: boolean('is_default').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  playCount: integer('play_count').notNull().default(0),
  lastPlayedAt: timestamp('last_played_at'),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  nameIndex: index('playlists_name_idx').on(table.name),
  createdAtIndex: index('playlists_created_at_idx').on(table.createdAt),
  isPublicIndex: index('playlists_is_public_idx').on(table.isPublic),
  isDefaultIndex: index('playlists_is_default_idx').on(table.isDefault),
  videoCountIndex: index('playlists_video_count_idx').on(table.videoCount),
  playCountIndex: index('playlists_play_count_idx').on(table.playCount),
}));

// 播放列表视频关联表
export const playlistVideos = pgTable('playlist_videos', {
  id: text('id').primaryKey(),
  playlistId: text('playlist_id').notNull().references(() => playlistTable.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  addedAt: timestamp('added_at').notNull().defaultNow(),
  position: integer('position').notNull().default(0),
}, (table) => ({
  playlistIdIndex: index('playlist_videos_playlist_id_idx').on(table.playlistId),
  videoIdIndex: index('playlist_videos_video_id_idx').on(table.videoId),
  sortOrderIndex: index('playlist_videos_sort_order_idx').on(table.sortOrder),
  uniqueIndex: index('playlist_videos_playlist_video_unique').on(table.playlistId, table.videoId),
}));

// 关系定义
export const filesRelations = relations(files, ({ one, many }) => ({
  videoMetadata: one(videoMetadata, {
    fields: [files.id],
    references: [videoMetadata.fileId],
  }),
  thumbnails: many(videoThumbnails),
  categories: many(fileCategories),
  tags: many(fileTags),
  searchIndex: one(fileSearchIndex, {
    fields: [files.id],
    references: [fileSearchIndex.fileId],
  }),
  operationLogs: many(fileOperationLogs),
  backupRecords: many(fileBackupRecords),
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
  }),
  children: many(files, {
    relationName: 'file_children',
  }),
}));

export const directoriesRelations = relations(directories, ({ one, many }) => ({
  parent: one(directories, {
    fields: [directories.parentId],
    references: [directories.id],
  }),
  children: many(directories, {
    relationName: 'directory_children',
  }),
}));

export const videoMetadataRelations = relations(videoMetadata, ({ one, many }) => ({
  file: one(files, {
    fields: [videoMetadata.fileId],
    references: [files.id],
  }),
  thumbnails: many(videoThumbnails),
}));

export const videoThumbnailsRelations = relations(videoThumbnails, ({ one }) => ({
  file: one(files, {
    fields: [videoThumbnails.fileId],
    references: [files.id],
  }),
  videoMetadata: one(videoMetadata, {
    fields: [videoThumbnails.fileId],
    references: [videoMetadata.fileId],
  }),
}));

export const fileCategoriesRelations = relations(fileCategories, ({ one }) => ({
  file: one(files, {
    fields: [fileCategories.fileId],
    references: [files.id],
  }),
}));

export const fileTagsRelations = relations(fileTags, ({ one }) => ({
  file: one(files, {
    fields: [fileTags.fileId],
    references: [files.id],
  }),
}));

export const fileSearchIndexRelations = relations(fileSearchIndex, ({ one }) => ({
  file: one(files, {
    fields: [fileSearchIndex.fileId],
    references: [files.id],
  }),
}));

export const fileOperationLogsRelations = relations(fileOperationLogs, ({ one }) => ({
  file: one(files, {
    fields: [fileOperationLogs.fileId],
    references: [files.id],
  }),
}));

export const fileBackupRecordsRelations = relations(fileBackupRecords, ({ one }) => ({
  file: one(files, {
    fields: [fileBackupRecords.fileId],
    references: [files.id],
  }),
}));

export const playlistTableRelations = relations(playlistTable, ({ many }) => ({
  videos: many(playlistVideos),
}));

export const playlistVideosRelations = relations(playlistVideos, ({ one }) => ({
  playlist: one(playlistTable, {
    fields: [playlistVideos.playlistId],
    references: [playlistTable.id],
  }),
  video: one(files, {
    fields: [playlistVideos.videoId],
    references: [files.id],
  }),
}));

// 类型定义
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type Directory = typeof directories.$inferSelect;
export type NewDirectory = typeof directories.$inferInsert;
export type VideoMetadata = typeof videoMetadata.$inferSelect;
export type NewVideoMetadata = typeof videoMetadata.$inferInsert;
export type VideoThumbnail = typeof videoThumbnails.$inferSelect;
export type NewVideoThumbnail = typeof videoThumbnails.$inferInsert;
export type FileCategory = typeof fileCategories.$inferSelect;
export type NewFileCategory = typeof fileCategories.$inferInsert;
export type FileTag = typeof fileTags.$inferSelect;
export type NewFileTag = typeof fileTags.$inferInsert;
export type FileSearchIndex = typeof fileSearchIndex.$inferSelect;
export type NewFileSearchIndex = typeof fileSearchIndex.$inferInsert;
export type FileOperationLog = typeof fileOperationLogs.$inferSelect;
export type NewFileOperationLog = typeof fileOperationLogs.$inferInsert;
export type FileBackupRecord = typeof fileBackupRecords.$inferSelect;
export type NewFileBackupRecord = typeof fileBackupRecords.$inferInsert;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;
export type Playlist = typeof playlistTable.$inferSelect;
export type NewPlaylist = typeof playlistTable.$inferInsert;
export type PlaylistVideo = typeof playlistVideos.$inferSelect;
export type NewPlaylistVideo = typeof playlistVideos.$inferInsert;