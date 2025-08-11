/**
 * 数据验证器
 * 使用 Zod 进行数据验证
 */

import { z } from "zod";
import {
  VideoSchema,
  WatchHistorySchema,
  PlaylistSchema,
  PlaylistVideoSchema,
  TagSchema,
  VideoTagSchema,
  SettingsSchema,
  FolderSchema,
  FolderVideoSchema,
  BookmarkSchema,
  SearchIndexSchema,
} from "./tables";

// 扩展验证规则

// 视频验证
export const CreateVideoSchema = VideoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateVideoSchema = VideoSchema.partial()
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().cuid2(),
  });

// 播放历史验证
export const CreateWatchHistorySchema = WatchHistorySchema.omit({
  id: true,
  watched_at: true,
});

export const UpdateWatchHistorySchema = WatchHistorySchema.partial()
  .omit({ id: true, watched_at: true })
  .extend({
    id: z.string().cuid2(),
  });

// 播放列表验证
export const CreatePlaylistSchema = PlaylistSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdatePlaylistSchema = PlaylistSchema.partial()
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().cuid2(),
  });

// 标签验证
export const CreateTagSchema = TagSchema.omit({
  id: true,
  created_at: true,
});

export const UpdateTagSchema = TagSchema.partial()
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().cuid2(),
  });

// 文件夹验证
export const CreateFolderSchema = FolderSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateFolderSchema = FolderSchema.partial()
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().cuid2(),
  });

// 书签验证
export const CreateBookmarkSchema = BookmarkSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateBookmarkSchema = BookmarkSchema.partial()
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().cuid2(),
  });

// 设置验证
export const UpdateSettingsSchema = SettingsSchema.partial()
  .omit({ id: true, created_at: true, updated_at: true })
  .extend({
    id: z.literal("default"),
  });

// 搜索参数验证
export const VideoSearchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
  minDuration: z.number().positive().optional(),
  maxDuration: z.number().positive().optional(),
  sortBy: z.enum(["created_at", "title", "duration", "rating", "play_count"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().positive().optional(),
  pageSize: z.number().positive().max(100).optional(),
});

// 分页参数验证
export const PaginationParamsSchema = z.object({
  page: z.number().positive().default(1),
  pageSize: z.number().positive().max(100).default(20),
});

// 导出类型
export type CreateVideo = z.infer<typeof CreateVideoSchema>;
export type UpdateVideo = z.infer<typeof UpdateVideoSchema>;
export type CreateWatchHistory = z.infer<typeof CreateWatchHistorySchema>;
export type UpdateWatchHistory = z.infer<typeof UpdateWatchHistorySchema>;
export type CreatePlaylist = z.infer<typeof CreatePlaylistSchema>;
export type UpdatePlaylist = z.infer<typeof UpdatePlaylistSchema>;
export type CreateTag = z.infer<typeof CreateTagSchema>;
export type UpdateTag = z.infer<typeof UpdateTagSchema>;
export type CreateFolder = z.infer<typeof CreateFolderSchema>;
export type UpdateFolder = z.infer<typeof UpdateFolderSchema>;
export type CreateBookmark = z.infer<typeof CreateBookmarkSchema>;
export type UpdateBookmark = z.infer<typeof UpdateBookmarkSchema>;
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type VideoSearchParams = z.infer<typeof VideoSearchParamsSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

// 验证工具函数
export function validateCreateVideo(data: unknown): CreateVideo {
  return CreateVideoSchema.parse(data);
}

export function validateUpdateVideo(data: unknown): UpdateVideo {
  return UpdateVideoSchema.parse(data);
}

export function VideoSearchParams(data: unknown): VideoSearchParams {
  return VideoSearchParamsSchema.parse(data);
}

export function validatePaginationParams(data: unknown): PaginationParams {
  return PaginationParamsSchema.parse(data);
}