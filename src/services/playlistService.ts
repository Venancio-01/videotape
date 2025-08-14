import { getDatabase } from "@/db/drizzle";
import type { Playlist, Video } from "@/db/schema";
import { playlistTable, playlistVideoTable, videoTable } from "@/db/schema";
import type {
  CreatePlaylistOptions,
  CreatePlaylistResult,
} from "@/playlist/types/playlist";
import type { DirectoryItem, FileItem } from "@/types/file";
import { desc, eq, sql } from "drizzle-orm";

/**
 * 播放列表服务类
 * 处理播放列表的创建、读取、更新和删除操作
 */
export class PlaylistService {
  /**
   * 创建新的播放列表
   * @param options 播放列表创建选项
   * @param videos 视频项目列表
   * @returns 创建结果
   */
  static async createPlaylist(
    options: CreatePlaylistOptions,
    videos: Video[],
  ): Promise<CreatePlaylistResult> {
    try {
      // 验证必填字段
      if (!options.name?.trim()) {
        return {
          success: false,
          error: "播放列表名称不能为空",
        };
      }

      if (videos.length === 0) {
        return {
          success: false,
          error: "请选择至少一个视频",
        };
      }

      const db = getDatabase();

      // 使用事务确保数据一致性
      const result = await db.transaction(async (tx) => {
        try {
          // 1. 插入播放列表
          const playlistData = {
            name: options.name.trim(),
            description: options.description?.trim() || null,
            thumbnailPath: options.thumbnailPath || null,
            videoCount: videos.length,
            totalDuration: videos.reduce(
              (sum, video) => sum + (video.duration || 0),
              0,
            ),
          };

          const [createdPlaylist] = await tx
            .insert(playlistTable)
            .values(playlistData)
            .returning();

          const playlistId = createdPlaylist.id;

          // 2. 处理视频数据 - 检查是否存在，不存在则插入
          const processedVideos: Video[] = [];

          for (const video of videos) {
            // 检查视频是否已存在（通过文件路径）
            const existingVideo = await tx
              .select()
              .from(videoTable)
              .where(eq(videoTable.filePath, video.filePath))
              .limit(1);

            let videoId: string;

            if (existingVideo.length > 0) {
              // 视频已存在，使用现有ID
              videoId = existingVideo[0].id;
              processedVideos.push(existingVideo[0]);
            } else {
              // 视频不存在，插入新视频
              const videoData = {
                title: video.title,
                filePath: video.filePath,
                thumbnailPath: video.thumbnailPath,
                duration: video.duration || 0,
                fileSize: video.fileSize || 0,
                format: video.format || "unknown",
                resolutionWidth: video.resolutionWidth || 0,
                resolutionHeight: video.resolutionHeight || 0,
                watchProgress: video.watchProgress || 0,
                isFavorite: video.isFavorite || false,
                playCount: video.playCount || 0,
              };

              const [newVideo] = await tx
                .insert(videoTable)
                .values(videoData)
                .returning();

              videoId = newVideo.id;
              processedVideos.push(newVideo);
            }
          }

          // 3. 创建播放列表与视频的关联关系
          const playlistVideos = processedVideos.map((video, index) => ({
            playlistId,
            videoId: video.id,
            position: index + 1,
          }));

          await tx.insert(playlistVideoTable).values(playlistVideos);

          // 4. 更新播放列表统计信息
          const actualTotalDuration = processedVideos.reduce(
            (sum, video) => sum + (video.duration || 0),
            0,
          );

          await tx
            .update(playlistTable)
            .set({
              totalDuration: actualTotalDuration,
              updatedAt: sql`(CURRENT_TIMESTAMP)`,
            })
            .where(eq(playlistTable.id, playlistId));

          console.log(
            `成功创建播放列表: ${playlistId}, 包含 ${processedVideos.length} 个视频`,
          );

          return {
            success: true,
            playlistId,
            videos: processedVideos,
          };
        } catch (txError) {
          console.error("事务执行失败:", txError);
          // 事务会自动回滚
          throw txError;
        }
      });

      return {
        success: true,
        playlistId: result.playlistId,
      };
    } catch (error) {
      console.error("创建播放列表失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "创建播放列表失败",
      };
    }
  }

  /**
   * 获取所有播放列表
   * @returns 播放列表数组
   */
  static async getAllPlaylists(): Promise<Playlist[]> {
    try {
      const db = getDatabase();
      const playlists = await db
        .select()
        .from(playlistTable)
        .orderBy(desc(playlistTable.createdAt));
      return playlists;
    } catch (error) {
      console.error("获取播放列表失败:", error);
      return [];
    }
  }

  /**
   * 根据ID获取播放列表
   * @param id 播放列表ID
   * @returns 播放列表或null
   */
  static async getPlaylistById(id: string): Promise<Playlist | null> {
    try {
      const db = getDatabase();
      const playlist = await db
        .select()
        .from(playlistTable)
        .where(eq(playlistTable.id, id))
        .limit(1);
      return playlist.length > 0 ? playlist[0] : null;
    } catch (error) {
      console.error("获取播放列表失败:", error);
      return null;
    }
  }

  /**
   * 更新播放列表
   * @param id 播放列表ID
   * @param updates 更新数据
   * @returns 更新结果
   */
  static async updatePlaylist(
    id: string,
    updates: Partial<Playlist>,
  ): Promise<CreatePlaylistResult> {
    try {
      const db = getDatabase();

      // 验证必填字段
      if (updates.name && !updates.name.trim()) {
        return {
          success: false,
          error: "播放列表名称不能为空",
        };
      }

      // 准备更新数据
      const updateData = {
        ...updates,
        name: updates.name?.trim(),
        description: updates.description?.trim() || null,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      };

      await db
        .update(playlistTable)
        .set(updateData)
        .where(eq(playlistTable.id, id));

      console.log("更新播放列表:", { id, ...updateData });

      return {
        success: true,
        playlistId: id,
      };
    } catch (error) {
      console.error("更新播放列表失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "更新播放列表失败",
      };
    }
  }

  /**
   * 删除播放列表
   * @param id 播放列表ID
   * @returns 删除结果
   */
  static async deletePlaylist(id: string): Promise<CreatePlaylistResult> {
    try {
      const db = getDatabase();

      // 使用事务确保数据一致性
      await db.transaction(async (tx) => {
        // 先删除播放列表与视频的关联关系
        await tx
          .delete(playlistVideoTable)
          .where(eq(playlistVideoTable.playlistId, id));
        // 再删除播放列表
        await tx.delete(playlistTable).where(eq(playlistTable.id, id));
      });

      console.log("删除播放列表:", id);

      return {
        success: true,
        playlistId: id,
      };
    } catch (error) {
      console.error("删除播放列表失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "删除播放列表失败",
      };
    }
  }

  /**
   * 获取播放列表中的视频
   * @param playlistId 播放列表ID
   * @returns 视频数组
   */
  static async getPlaylistVideos(playlistId: string): Promise<Video[]> {
    try {
      const db = getDatabase();
      const videos = await db
        .select({
          id: videoTable.id,
          title: videoTable.title,
          filePath: videoTable.filePath,
          thumbnailPath: videoTable.thumbnailPath,
          duration: videoTable.duration,
          fileSize: videoTable.fileSize,
          format: videoTable.format,
          resolutionWidth: videoTable.resolutionWidth,
          resolutionHeight: videoTable.resolutionHeight,
          watchProgress: videoTable.watchProgress,
          isFavorite: videoTable.isFavorite,
          playCount: videoTable.playCount,
          lastWatchedAt: videoTable.lastWatchedAt,
          createdAt: videoTable.createdAt,
          updatedAt: videoTable.updatedAt,
        })
        .from(playlistVideoTable)
        .innerJoin(videoTable, eq(playlistVideoTable.videoId, videoTable.id))
        .where(eq(playlistVideoTable.playlistId, playlistId))
        .orderBy(playlistVideoTable.position);

      return videos;
    } catch (error) {
      console.error("获取播放列表视频失败:", error);
      return [];
    }
  }

  /**
   * 从文件系统获取视频文件
   * @param directoryPath 目录路径（可选）
   * @returns 视频文件数组
   */
  static async getVideoFiles(directoryPath?: string): Promise<FileItem[]> {
    try {
      // 这里应该调用实际的文件系统服务
      // const files = await fileSystemService.getVideoFiles(directoryPath);

      // 返回模拟数据
      return [
        {
          id: "1",
          name: "视频1.mp4",
          uri: "/path/to/video1.mp4",
          size: 1024000,
          type: "video/mp4",
          mimeType: "video/mp4",
          createdAt: new Date(),
          modifiedAt: new Date(),
          thumbnailUri: null,
          isFavorite: false,
          isDeleted: false,
          metadata: {
            duration: 120,
            width: 1920,
            height: 1080,
          },
        },
        {
          id: "2",
          name: "视频2.mp4",
          uri: "/path/to/video2.mp4",
          size: 2048000,
          type: "video/mp4",
          mimeType: "video/mp4",
          createdAt: new Date(),
          modifiedAt: new Date(),
          thumbnailUri: null,
          isFavorite: false,
          isDeleted: false,
          metadata: {
            duration: 180,
            width: 1920,
            height: 1080,
          },
        },
        {
          id: "3",
          name: "视频3.mp4",
          uri: "/path/to/video3.mp4",
          size: 3072000,
          type: "video/mp4",
          mimeType: "video/mp4",
          createdAt: new Date(),
          modifiedAt: new Date(),
          thumbnailUri: null,
          isFavorite: false,
          isDeleted: false,
          metadata: {
            duration: 240,
            width: 1920,
            height: 1080,
          },
        },
      ];
    } catch (error) {
      console.error("获取视频文件失败:", error);
      return [];
    }
  }

  /**
   * 获取视频目录
   * @returns 目录数组
   */
  static async getVideoDirectories(): Promise<DirectoryItem[]> {
    try {
      // 这里应该调用实际的文件系统服务
      // const directories = await fileSystemService.getVideoDirectories();

      // 返回模拟数据
      return [
        {
          id: "dir1",
          name: "电影",
          path: "/path/to/movies",
          itemCount: 5,
        },
        {
          id: "dir2",
          name: "音乐视频",
          path: "/path/to/music",
          itemCount: 8,
        },
        {
          id: "dir3",
          name: "纪录片",
          path: "/path/to/documentaries",
          itemCount: 3,
        },
      ];
    } catch (error) {
      console.error("获取视频目录失败:", error);
      return [];
    }
  }

  /**
   * 获取目录中的视频
   * @param directoryPath 目录路径
   * @returns 视频数组
   */
  static async getDirectoryVideos(directoryPath: string): Promise<Video[]> {
    try {
      // 这里应该调用实际的文件系统服务
      // const videos = await fileSystemService.getDirectoryVideos(directoryPath);

      // 返回模拟数据
      return [
        {
          id: "vid1",
          title: "电影1",
          filePath: "/path/to/movies/movie1.mp4",
          duration: 5400,
          thumbnailUri: null,
        },
        {
          id: "vid2",
          title: "电影2",
          filePath: "/path/to/movies/movie2.mp4",
          duration: 7200,
          thumbnailUri: null,
        },
        {
          id: "vid3",
          title: "电影3",
          filePath: "/path/to/movies/movie3.mp4",
          duration: 6300,
          thumbnailUri: null,
        },
      ];
    } catch (error) {
      console.error("获取目录视频失败:", error);
      return [];
    }
  }
}
