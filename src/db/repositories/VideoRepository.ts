/**
 * 视频仓库实现
 * 基于 Drizzle ORM 和 Repository Pattern 的具体实现
 */

import { getDatabase } from "@/db/drizzle";
import {
  type SearchResult,
  type VideoSearchParams,
  type VideoStats,
  type Video as VideoType,
  type VideoWithHistory,
  type VideoWithRelations,
  bookmarkTable,
  folderTable,
  folderVideoTable,
  playlistVideoTable,
  tagTable,
  videoTable,
  videoTagTable,
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
import type {
  IVideoRepository,
  SearchResult as SearchResultInterface,
  UserStats as UserStatsInterface,
  Video,
  VideoStats as VideoStatsInterface,
  VideoWithRelations as VideoWithRelationsInterface,
} from "./interfaces";

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
      category,
      tags,
      isFavorite,
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
      whereConditions.push(
        or(
          ilike(videoTable.title, `%${query}%`),
          ilike(videoTable.description, `%${query}%`),
        ),
      );
    }

    // 分类过滤
    if (category) {
      whereConditions.push(eq(videoTable.category, category));
    }

    // 收藏过滤
    if (isFavorite !== undefined) {
      whereConditions.push(eq(videoTable.isFavorite, isFavorite));
    }

    // 时长过滤
    if (minDuration !== undefined) {
      whereConditions.push(gte(videoTable.duration, minDuration));
    }
    if (maxDuration !== undefined) {
      whereConditions.push(lte(videoTable.duration, maxDuration));
    }

    // 标签过滤
    if (tags && tags.length > 0) {
      const tagFilter = db
        .select({ videoId: videoTagTable.videoId })
        .from(videoTagTable)
        .innerJoin(tagTable, eq(videoTagTable.tagId, tagTable.id))
        .where(inArray(tagTable.name, tags));

      whereConditions.push(inArray(videoTable.id, tagFilter));
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
      rating: videoTable.rating,
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

  getVideosByCategoryQuery(category: string) {
    const db = this.getDb();
    return db
      .select()
      .from(videoTable)
      .where(eq(videoTable.category, category))
      .orderBy(desc(videoTable.createdAt));
  }

  getFavoriteVideosQuery() {
    const db = this.getDb();
    return db
      .select()
      .from(videoTable)
      .where(eq(videoTable.isFavorite, true))
      .orderBy(desc(videoTable.createdAt));
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

    // 获取用户经常观看的分类
    const favoriteCategories = db
      .select({
        category: videoTable.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(videoTable)
      .innerJoin(
        watchHistoryTable,
        eq(videoTable.id, watchHistoryTable.videoId),
      )
      .groupBy(videoTable.category)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(3);

    // 获取这些分类中的视频，排除已观看的
    const watchedVideoIds = db
      .select({ videoId: watchHistoryTable.videoId })
      .from(watchHistoryTable)
      .groupBy(watchHistoryTable.videoId);

    const recommendedQuery = db
      .select()
      .from(videoTable)
      .where(
        and(
          inArray(
            videoTable.category,
            favoriteCategories.map((fc) => fc.category),
          ),
          not(
            inArray(
              videoTable.id,
              watchedVideoIds.map((wv) => wv.videoId),
            ),
          ),
          eq(videoTable.isArchived, false),
        ),
      )
      .orderBy(desc(videoTable.playCount), desc(videoTable.rating))
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

    // 获取标签
    const tagsQuery = db
      .select()
      .from(tagTable)
      .innerJoin(videoTagTable, eq(tagTable.id, videoTagTable.tagId))
      .where(eq(videoTagTable.videoId, id));

    // 获取播放列表
    const playlistsQuery = db
      .select({
        id: playlistVideoTable.playlistId,
        name: playlistVideoTable.playlistId, // 这里需要关联playlist表
        position: playlistVideoTable.position,
      })
      .from(playlistVideoTable)
      .where(eq(playlistVideoTable.videoId, id));

    // 获取书签
    const bookmarksQuery = db
      .select()
      .from(bookmarkTable)
      .where(eq(bookmarkTable.videoId, id))
      .orderBy(asc(bookmarkTable.position));

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
              json_object('id', t.id, 'name', t.name, 'color', t.color, 'description', t.description)
            ) as tags,
            json_group_array(
              json_object('id', p.id, 'position', p.position)
            ) as playlists,
            json_group_array(
              json_object('id', b.id, 'title', b.title, 'position', b.position, 'color', b.color)
            ) as bookmarks,
            json_group_array(
              json_object('id', h.id, 'position', h.position, 'duration', h.duration, 'watchedAt', h.watchedAt)
            ) as watchHistory
          FROM videos v
          LEFT JOIN video_tags vt ON v.id = vt.video_id
          LEFT JOIN tags t ON vt.tag_id = t.id
          LEFT JOIN playlist_videos p ON v.id = p.video_id
          LEFT JOIN bookmarks b ON v.id = b.video_id
          LEFT JOIN watch_history h ON v.id = h.video_id
          WHERE v.id = ?
          GROUP BY v.id
        `,
        params: [id],
      }),
    };
  }

  getVideosByTagQuery(tag: string) {
    const db = this.getDb();
    return db
      .select()
      .from(videoTable)
      .innerJoin(videoTagTable, eq(videoTable.id, videoTagTable.videoId))
      .innerJoin(tagTable, eq(videoTagTable.tagId, tagTable.id))
      .where(eq(tagTable.name, tag))
      .orderBy(desc(videoTable.createdAt));
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
        averageRating: sql<number>`AVG(rating)`,
      })
      .from(videoTable);

    const categoryStatsQuery = db
      .select({
        category: videoTable.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(videoTable)
      .groupBy(videoTable.category);

    return {
      toSQL: () => ({
        sql: `
          SELECT
            s.total_videos,
            s.total_duration,
            s.total_size,
            s.total_play_count,
            s.average_rating,
            json_group_object(
              cs.category,
              cs.count
            ) as categories
          FROM (${statsQuery.toSQL().sql}) s,
          LATERAL (SELECT category, COUNT(*) as count FROM videos GROUP BY category) cs
        `,
        params: statsQuery.toSQL().params,
      }),
    };
  }
}
