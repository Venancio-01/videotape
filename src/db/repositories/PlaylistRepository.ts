/**
 * 播放列表仓库实现
 * 基于 Drizzle ORM 和 Repository Pattern 的具体实现
 */

import { getDatabase } from "@/db/drizzle";
import {
  type Playlist as PlaylistType,
  type PlaylistWithVideos,
  type Video,
  playlistTable,
  playlistVideoTable,
  videoTable,
} from "@/db/schema";
import { and, asc, desc, eq, max, sql } from "drizzle-orm";
import type {
  IPlaylistRepository,
  Playlist,
  PlaylistVideoOptions,
  PlaylistWithVideos as PlaylistWithVideosInterface,
} from "./interfaces";

export class PlaylistRepository implements IPlaylistRepository {
  private getDb() {
    return getDatabase();
  }

  // ===== 基础查询方法 =====

  getAllQuery() {
    const db = this.getDb();
    return db
      .select()
      .from(playlistTable)
      .orderBy(desc(playlistTable.createdAt));
  }

  findByIdQuery(id: string) {
    const db = this.getDb();
    return db
      .select()
      .from(playlistTable)
      .where(eq(playlistTable.id, id))
      .limit(1);
  }

  // ===== 高级查询方法 =====

  getPlaylistWithVideosQuery(playlistId: string) {
    const db = this.getDb();

    const playlistQuery = db
      .select()
      .from(playlistTable)
      .where(eq(playlistTable.id, playlistId))
      .limit(1);

    const videosQuery = db
      .select({
        id: videoTable.id,
        title: videoTable.title,
        filePath: videoTable.filePath,
        thumbnailPath: videoTable.thumbnailPath,
        duration: videoTable.duration,
        fileSize: videoTable.fileSize,
        format: videoTable.format,
        tags: videoTable.tags,
        category: videoTable.category,
        watchProgress: videoTable.watchProgress,
        isFavorite: videoTable.isFavorite,
        playCount: videoTable.playCount,
        createdAt: videoTable.createdAt,
        updatedAt: videoTable.updatedAt,
        position: playlistVideoTable.position,
        customTitle: playlistVideoTable.customTitle,
        customThumbnailPath: playlistVideoTable.customThumbnailPath,
        notes: playlistVideoTable.notes,
      })
      .from(videoTable)
      .innerJoin(
        playlistVideoTable,
        eq(videoTable.id, playlistVideoTable.videoId),
      )
      .where(eq(playlistVideoTable.playlistId, playlistId))
      .orderBy(playlistVideoTable.position);

    return {
      toSQL: () => ({
        sql: `
          SELECT
            p.*,
            json_group_array(
              json_object(
                'id', v.id,
                'title', v.title,
                'filePath', v.file_path,
                'thumbnailPath', v.thumbnail_path,
                'duration', v.duration,
                'fileSize', v.file_size,
                'format', v.format,
                'tags', v.tags,
                'category', v.category,
                'watchProgress', v.watch_progress,
                'isFavorite', v.is_favorite,
                'playCount', v.play_count,
                'createdAt', v.created_at,
                'updatedAt', v.updated_at,
                'position', pv.position,
                'customTitle', pv.custom_title,
                'customThumbnailPath', pv.custom_thumbnail_path,
                'notes', pv.notes
              )
            ) as videos
          FROM playlists p
          LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
          LEFT JOIN videos v ON pv.video_id = v.id
          WHERE p.id = ?
          GROUP BY p.id
        `,
        params: [playlistId],
      }),
    };
  }

  getAllPlaylistsQuery() {
    return this.getAllQuery();
  }

  getPublicPlaylistsQuery() {
    const db = this.getDb();
    return db
      .select()
      .from(playlistTable)
      .where(eq(playlistTable.isPublic, true))
      .orderBy(desc(playlistTable.createdAt));
  }

  // ===== 写操作方法 =====

  async create(data: Omit<Playlist, "id">): Promise<Playlist> {
    const db = this.getDb();
    const [playlist] = await db.insert(playlistTable).values(data).returning();
    return playlist;
  }

  async update(id: string, data: Partial<Playlist>): Promise<Playlist> {
    const db = this.getDb();
    const [playlist] = await db
      .update(playlistTable)
      .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(playlistTable.id, id))
      .returning();
    return playlist;
  }

  async delete(id: string): Promise<boolean> {
    const db = this.getDb();

    // 删除播放列表视频关联
    await db
      .delete(playlistVideoTable)
      .where(eq(playlistVideoTable.playlistId, id));

    // 删除播放列表
    const result = await db
      .delete(playlistTable)
      .where(eq(playlistTable.id, id));
    return result.changes > 0;
  }

  // ===== 视频管理方法 =====

  async addVideoToPlaylist(
    playlistId: string,
    videoId: string,
    options?: PlaylistVideoOptions,
  ): Promise<void> {
    const db = this.getDb();

    await db.transaction(async (tx) => {
      // 获取当前最大位置
      const [maxPosition] = await tx
        .select({ position: max(playlistVideoTable.position) })
        .from(playlistVideoTable)
        .where(eq(playlistVideoTable.playlistId, playlistId));

      const nextPosition = maxPosition?.position ?? 0;

      // 添加视频到播放列表
      await tx.insert(playlistVideoTable).values({
        playlistId,
        videoId,
        position: nextPosition + 1,
        customTitle: options?.customTitle,
        customThumbnailPath: options?.customThumbnailPath,
        notes: options?.notes,
      });

      // 更新播放列表的视频计数
      await this.updatePlaylistStats(playlistId, tx);
    });
  }

  async removeVideoFromPlaylist(
    playlistId: string,
    videoId: string,
  ): Promise<void> {
    const db = this.getDb();

    await db.transaction(async (tx) => {
      // 删除视频从播放列表
      await tx
        .delete(playlistVideoTable)
        .where(
          and(
            eq(playlistVideoTable.playlistId, playlistId),
            eq(playlistVideoTable.videoId, videoId),
          ),
        );

      // 更新播放列表的视频计数
      await this.updatePlaylistStats(playlistId, tx);

      // 重新排序剩余视频
      await this.reorderPlaylistVideos(playlistId, tx);
    });
  }

  async reorderVideos(playlistId: string, videoIds: string[]): Promise<void> {
    const db = this.getDb();

    await db.transaction(async (tx) => {
      // 批量更新视频位置
      for (let i = 0; i < videoIds.length; i++) {
        const videoId = videoIds[i];
        await tx
          .update(playlistVideoTable)
          .set({ position: i + 1 })
          .where(
            and(
              eq(playlistVideoTable.playlistId, playlistId),
              eq(playlistVideoTable.videoId, videoId),
            ),
          );
      }
    });
  }

  // ===== 统计更新方法 =====

  async updatePlaylistStats(
    playlistId: string,
    tx = this.getDb(),
  ): Promise<void> {
    // 计算视频数量
    const [videoCount] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(playlistVideoTable)
      .where(eq(playlistVideoTable.playlistId, playlistId));

    // 计算总时长
    const [totalDuration] = await tx
      .select({
        sum: sql<number>`SUM(v.duration)`,
      })
      .from(playlistVideoTable)
      .innerJoin(videoTable, eq(playlistVideoTable.videoId, videoTable.id))
      .where(eq(playlistVideoTable.playlistId, playlistId));

    // 更新播放列表统计
    await tx
      .update(playlistTable)
      .set({
        videoCount: videoCount.count || 0,
        totalDuration: totalDuration.sum || 0,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      })
      .where(eq(playlistTable.id, playlistId));
  }

  async incrementPlayCount(playlistId: string): Promise<void> {
    const db = this.getDb();
    await db
      .update(playlistTable)
      .set({
        playCount: sql`${playlistTable.playCount} + 1`,
        lastPlayedAt: sql`(CURRENT_TIMESTAMP)`,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      })
      .where(eq(playlistTable.id, playlistId));
  }

  // ===== 私有辅助方法 =====

  private async reorderPlaylistVideos(
    playlistId: string,
    tx = this.getDb(),
  ): Promise<void> {
    // 获取所有视频并按位置排序
    const videos = await tx
      .select()
      .from(playlistVideoTable)
      .where(eq(playlistVideoTable.playlistId, playlistId))
      .orderBy(asc(playlistVideoTable.position));

    // 重新分配位置
    for (let i = 0; i < videos.length; i++) {
      await tx
        .update(playlistVideoTable)
        .set({ position: i + 1 })
        .where(eq(playlistVideoTable.id, videos[i].id));
    }
  }
}
