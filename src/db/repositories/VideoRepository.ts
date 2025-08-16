/**
 * 视频仓库实现
 * 基于 Drizzle ORM 和 Repository Pattern 的具体实现
 */

import { getDatabase } from "@/db/drizzle";
import {
  type VideoSearchParams,
  playlistVideoTable,
  videoTable,
  watchHistoryTable,
} from "@/db/schema";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  not,
  or,
  sql,
} from "drizzle-orm";
import type { IVideoRepository, Video } from "./interfaces";

export class VideoRepository implements IVideoRepository {
  private getDb() {
    return getDatabase();
  }

  // ===== 基础查询方法 =====

  getAllQuery() {
    const db = this.getDb();
    return db.select().from(videoTable).orderBy(desc(videoTable.createdAt));
  }

  findByIdQuery(id: string) {
    const db = this.getDb();
    return db.select().from(videoTable).where(eq(videoTable.id, id)).limit(1);
  }

  // ===== 高级查询方法 =====

  searchVideosQuery(params: VideoSearchParams) {
    const db = this.getDb();
    const {
      query,
      minDuration,
      maxDuration,
      sortBy = "created_at",
      sortOrder = "desc",
      page = 1,
      pageSize = 20,
    } = params;

    const offset = (page - 1) * pageSize;
    const whereConditions = [];

    // 搜索查询
    if (query) {
      whereConditions.push(ilike(videoTable.title, `%${query}%`));
    }


    // 时长过滤
    if (minDuration !== undefined) {
      whereConditions.push(gte(videoTable.duration, minDuration));
    }
    if (maxDuration !== undefined) {
      whereConditions.push(lte(videoTable.duration, maxDuration));
    }

    // 构建基础查询
    const baseQuery = db.select().from(videoTable);

    // 应用where条件
    const filteredQuery =
      whereConditions.length > 0
        ? baseQuery.where(and(...whereConditions))
        : baseQuery;

    // 排序
    const orderByColumn = {
      created_at: videoTable.createdAt,
      title: videoTable.title,
      duration: videoTable.duration,
      play_count: videoTable.playCount,
    }[sortBy];

    const orderByDirection = sortOrder === "desc" ? desc : asc;
    const sortedQuery = filteredQuery.orderBy(orderByDirection(orderByColumn));

    // 获取总数
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(filteredQuery.as("videos_filtered"));

    // 获取分页数据
    const paginatedQuery = sortedQuery.limit(pageSize).offset(offset);

    // 返回一个复合查询对象
    return {
      toSQL: () => ({
        sql: `SELECT * FROM (${paginatedQuery.toSQL().sql}) as items CROSS JOIN (${countQuery.toSQL().sql}) as counts`,
        params: [
          ...paginatedQuery.toSQL().params,
          ...countQuery.toSQL().params,
        ],
      }),
    };
  }


  getRecentVideosQuery(limit = 20) {
    const db = this.getDb();
    return db
      .select()
      .from(videoTable)
      .orderBy(desc(videoTable.createdAt))
      .limit(limit);
  }

  getRecommendedVideosQuery(limit = 10) {
    const db = this.getDb();

    // 获取排除已观看的视频ID
    const watchedVideoIds = db
      .select({ videoId: watchHistoryTable.videoId })
      .from(watchHistoryTable)
      .groupBy(watchHistoryTable.videoId);

    const recommendedQuery = db
      .select()
      .from(videoTable)
      .where(
        not(
          inArray(
            videoTable.id,
            watchedVideoIds.map((wv) => wv.videoId),
          ),
        ),
      )
      .orderBy(desc(videoTable.playCount))
      .limit(limit);

    return recommendedQuery;
  }

  // ===== 关联查询方法 =====

  getVideoWithRelationsQuery(id: string) {
    const db = this.getDb();

    // 获取基础视频信息
    const videoQuery = db
      .select()
      .from(videoTable)
      .where(eq(videoTable.id, id))
      .limit(1);

    // 获取播放列表
    const playlistsQuery = db
      .select({
        id: playlistVideoTable.playlistId,
        position: playlistVideoTable.position,
      })
      .from(playlistVideoTable)
      .where(eq(playlistVideoTable.videoId, id));

    // 获取观看历史
    const historyQuery = db
      .select()
      .from(watchHistoryTable)
      .where(eq(watchHistoryTable.videoId, id))
      .orderBy(desc(watchHistoryTable.watchedAt))
      .limit(10);

    // 返回复合查询
    return {
      toSQL: () => ({
        sql: `
          SELECT
            v.*,
            json_group_array(
              json_object('id', p.id, 'position', p.position)
            ) as playlists,
            json_group_array(
              json_object('id', h.id, 'position', h.position, 'duration', h.duration, 'watchedAt', h.watchedAt)
            ) as watchHistory
          FROM videos v
          LEFT JOIN playlist_videos p ON v.id = p.video_id
          LEFT JOIN watch_history h ON v.id = h.video_id
          WHERE v.id = ?
          GROUP BY v.id
        `,
        params: [id],
      }),
    };
  }

  // ===== 写操作方法 =====

  async create(data: Omit<Video, "id">): Promise<Video> {
    const db = this.getDb();
    const [video] = await db.insert(videoTable).values(data).returning();
    return video;
  }

  async update(id: string, data: Partial<Video>): Promise<Video> {
    const db = this.getDb();
    const [video] = await db
      .update(videoTable)
      .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(videoTable.id, id))
      .returning();
    return video;
  }

  async delete(id: string): Promise<boolean> {
    const db = this.getDb();
    const result = await db.delete(videoTable).where(eq(videoTable.id, id));
    return result.changes > 0;
  }

  // ===== 批量操作方法 =====

  async batchCreate(videos: Omit<Video, "id">[]): Promise<Video[]> {
    const db = this.getDb();
    const result = await db.insert(videoTable).values(videos).returning();
    return Array.isArray(result) ? result : [result];
  }

  async updateWatchProgress(id: string, progress: number): Promise<void> {
    const db = this.getDb();
    await db
      .update(videoTable)
      .set({
        watchProgress: progress,
        lastWatchedAt: sql`(CURRENT_TIMESTAMP)`,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      })
      .where(eq(videoTable.id, id));
  }

  async incrementPlayCount(id: string): Promise<void> {
    const db = this.getDb();
    await db
      .update(videoTable)
      .set({
        playCount: sql`${videoTable.playCount} + 1`,
        lastWatchedAt: sql`(CURRENT_TIMESTAMP)`,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      })
      .where(eq(videoTable.id, id));
  }

  // ===== 统计查询方法 =====

  getVideoStatsQuery() {
    const db = this.getDb();

    const statsQuery = db
      .select({
        totalVideos: sql<number>`COUNT(*)`,
        totalDuration: sql<number>`SUM(duration)`,
        totalSize: sql<number>`SUM(file_size)`,
        totalPlayCount: sql<number>`SUM(play_count)`,
      })
      .from(videoTable);

    return {
      toSQL: () => ({
        sql: `
          SELECT
            s.total_videos,
            s.total_duration,
            s.total_size,
            s.total_play_count
          FROM (${statsQuery.toSQL().sql}) s
        `,
        params: statsQuery.toSQL().params,
      }),
    };
  }
}
