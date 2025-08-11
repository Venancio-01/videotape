/**
 * 数据库表关系定义
 * 定义表之间的关联关系
 */

import { relations } from "drizzle-orm";
import {
  videoTable,
  watchHistoryTable,
  playlistTable,
  playlistVideoTable,
  tagTable,
  videoTagTable,
  settingsTable,
  folderTable,
  folderVideoTable,
  bookmarkTable,
  searchIndexTable,
} from "./tables";

// 视频关系
export const videoRelations = relations(videoTable, ({ many, one }) => ({
  watchHistory: many(watchHistoryTable),
  playlistVideos: many(playlistVideoTable),
  videoTags: many(videoTagTable),
  folderVideos: many(folderVideoTable),
  bookmarks: many(bookmarkTable),
  searchIndex: many(searchIndexTable),
}));

// 播放历史关系
export const watchHistoryRelations = relations(watchHistoryTable, ({ one }) => ({
  video: one(videoTable, {
    fields: [watchHistoryTable.videoId],
    references: [videoTable.id],
  }),
}));

// 播放列表关系
export const playlistRelations = relations(playlistTable, ({ many }) => ({
  playlistVideos: many(playlistVideoTable),
}));

// 播放列表视频关系
export const playlistVideoRelations = relations(playlistVideoTable, ({ one }) => ({
  playlist: one(playlistTable, {
    fields: [playlistVideoTable.playlistId],
    references: [playlistTable.id],
  }),
  video: one(videoTable, {
    fields: [playlistVideoTable.videoId],
    references: [videoTable.id],
  }),
}));

// 标签关系
export const tagRelations = relations(tagTable, ({ many }) => ({
  videoTags: many(videoTagTable),
}));

// 视频标签关系
export const videoTagRelations = relations(videoTagTable, ({ one }) => ({
  video: one(videoTable, {
    fields: [videoTagTable.videoId],
    references: [videoTable.id],
  }),
  tag: one(tagTable, {
    fields: [videoTagTable.tagId],
    references: [tagTable.id],
  }),
}));

// 文件夹关系
export const folderRelations = relations(folderTable, ({ many, one }) => ({
  children: many(folderTable, {
    relationName: "folderHierarchy",
  }),
  parent: one(folderTable, {
    relationName: "folderHierarchy",
    fields: [folderTable.parentId],
    references: [folderTable.id],
  }),
  folderVideos: many(folderVideoTable),
}));

// 文件夹视频关系
export const folderVideoRelations = relations(folderVideoTable, ({ one }) => ({
  folder: one(folderTable, {
    fields: [folderVideoTable.folderId],
    references: [folderTable.id],
  }),
  video: one(videoTable, {
    fields: [folderVideoTable.videoId],
    references: [videoTable.id],
  }),
}));

// 书签关系
export const bookmarkRelations = relations(bookmarkTable, ({ one }) => ({
  video: one(videoTable, {
    fields: [bookmarkTable.videoId],
    references: [videoTable.id],
  }),
}));

// 搜索索引关系
export const searchIndexRelations = relations(searchIndexTable, ({ one }) => ({
  // 搜索索引可以通过 contentId 关联到其他表
  // 这里使用多态关联
}));