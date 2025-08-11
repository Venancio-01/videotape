import { z } from "zod";

// 播放列表创建表单验证schema
export const createPlaylistSchema = z.object({
  name: z
    .string()
    .min(1, "播放列表名称不能为空")
    .max(100, "播放列表名称不能超过100个字符"),
  description: z
    .string()
    .max(500, "播放列表描述不能超过500个字符")
    .optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export type CreatePlaylistForm = z.infer<z.ZodObject<{
  name: z.ZodString;
  description: z.ZodOptional<z.ZodString>;
  isPublic: z.ZodBoolean;
  tags: z.ZodArray<z.ZodString>;
}>>;

// 播放列表创建选项
export interface CreatePlaylistOptions {
  name: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  thumbnailPath?: string;
}

// 播放列表创建结果
export interface CreatePlaylistResult {
  success: boolean;
  playlistId?: string;
  error?: string;
}