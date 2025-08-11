import { z } from "zod";
import type { FileItem, DirectoryItem } from "../../../types/file";
import type { Video } from "../../../db/schema";

// 播放列表创建表单验证schema
export const createPlaylistSchema = z.object({
  name: z
    .string()
    .min(1, "播放列表名称不能为空")
    .max(100, "播放列表名称不能超过100个字符"),
  description: z
    .string()
    .max(500, "播放列表描述不能超过500个字符")
    .optional()
    .nullable(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  // 新增：视频选择模式
  selectionMode: z.enum(["files", "directory"]).default("files"),
  // 新增：选择的文件
  selectedFiles: z.array(z.custom<FileItem>()).default([]),
  // 新增：选择的目录
  selectedDirectory: z.custom<DirectoryItem | null>().nullable().default(null),
  // 新增：目录中的视频
  directoryVideos: z.array(z.custom<Video>()).default([]),
});

export type CreatePlaylistForm = z.infer<typeof createPlaylistSchema>;

// 播放列表创建选项
export interface CreatePlaylistOptions {
  name: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  thumbnailPath?: string;
  // 新增：视频选择相关选项
  selectionMode?: "files" | "directory";
  selectedFiles?: FileItem[];
  selectedDirectory?: DirectoryItem | null;
  directoryVideos?: Video[];
}

// 播放列表创建结果
export interface CreatePlaylistResult {
  success: boolean;
  playlistId?: string;
  error?: string;
}

// 视频选择项类型
export interface VideoSelectionItem {
  id: string;
  type: "file" | "directory";
  title: string;
  duration?: number;
  thumbnailUri?: string;
  filePath?: string;
  directoryPath?: string;
  size?: number;
  isSelected: boolean;
}

// 目录视频选择结果
export interface DirectoryVideoSelection {
  directory: DirectoryItem;
  videos: Video[];
  selectedVideoIds: string[];
}