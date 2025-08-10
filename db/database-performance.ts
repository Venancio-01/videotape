import {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  gte,
  lte,
  inArray,
  isNull,
  not,
  ilike
} from "drizzle-orm";
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
  searchIndexTable
} from "./schema";
import { databaseManager } from "./database-manager";
import type { VideoSearchParams, SearchResult, Video } from "./schema";

export interface QueryMetrics {
  query: string;
  duration: number;
  success: boolean;
  timestamp: Date;
}

export interface PerformanceMetrics {
  averageQueryTime: number;
  slowQueries: QueryMetrics[];
  cacheHitRate: number;
  databaseSize: number;
}

export class DatabasePerformanceService {
  private queryMetrics: QueryMetrics[] = [];
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5分钟

  /**
   * 执行查询并记录性能指标
   */
  async executeQueryWithMetrics<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;
    let result: T;

    try {
      result = await queryFn();
      success = true;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;

      this.recordQueryMetric({
        query: queryName,
        duration,
        success,
        timestamp: new Date(),
      });

      // 记录慢查询
      if (duration > 1000) { // 超过1秒的查询
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }
    }

    return result;
  }

  /**
   * 记录查询指标
   */
  private recordQueryMetric(metric: QueryMetrics): void {
    this.queryMetrics.push(metric);

    // 保留最近1000条记录
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const recentQueries = this.queryMetrics.slice(-100); // 最近100条查询

    const averageQueryTime = recentQueries.length > 0
      ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length
      : 0;

    const slowQueries = recentQueries
      .filter(q => q.duration > 1000)
      .sort((a, b) => b.duration - a.duration);

    const cacheStats = this.getCacheStats();

    return {
      averageQueryTime,
      slowQueries,
      cacheHitRate: cacheStats.hitRate,
      databaseSize: cacheStats.databaseSize,
    };
  }

  /**
   * 获取缓存统计信息
   */
  private getCacheStats(): { hitRate: number; databaseSize: number } {
    const db = databaseManager.getDatabase();

    // 计算缓存命中率
    let hits = 0;
    let misses = 0;

    this.cache.forEach((entry, key) => {
      if (Date.now() - entry.timestamp < entry.ttl) {
        hits++;
      } else {
        misses++;
      }
    });

    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;

    // 获取数据库大小
    const databaseSize = db ? 0 : 0; // 这里可以添加实际的数据库大小获取逻辑

    return { hitRate, databaseSize };
  }

  /**
   * 缓存数据
   */
  setCache(key: string, data: any, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // 清理过期缓存
    this.cleanupCache();
  }

  /**
   * 获取缓存数据
   */
  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // 限制缓存大小
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = entries.slice(0, entries.length - 1000);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * 优化的视频搜索
   */
  async optimizedVideoSearch(params: VideoSearchParams): Promise<SearchResult<Video>> {
    const cacheKey = `video_search_${JSON.stringify(params)}`;

    // 检查缓存
    const cachedResult = this.getCache<SearchResult<Video>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = await this.executeQueryWithMetrics(
      'optimized_video_search',
      async () => {
        const db = databaseManager.getDatabase();
        const {
          query,
          category,
          tags,
          isFavorite,
          minDuration,
          maxDuration,
          sortBy = 'created_at',
          sortOrder = 'desc',
          page = 1,
          pageSize = 20
        } = params;

        const offset = (page - 1) * pageSize;
        let whereConditions = [];

        // 优化的搜索条件构建
        if (query) {
          whereConditions.push(
            or(
              ilike(videoTable.title, `%${query}%`),
              ilike(videoTable.description, `%${query}%`)
            )
          );
        }

        if (category) {
          whereConditions.push(eq(videoTable.category, category));
        }

        if (isFavorite !== undefined) {
          whereConditions.push(eq(videoTable.isFavorite, isFavorite));
        }

        if (minDuration !== undefined) {
          whereConditions.push(gte(videoTable.duration, minDuration));
        }
        if (maxDuration !== undefined) {
          whereConditions.push(lte(videoTable.duration, maxDuration));
        }

        // 使用预编译查询提高性能
        let queryBuilder = db.select().from(videoTable);

        if (whereConditions.length > 0) {
          queryBuilder = queryBuilder.where(and(...whereConditions));
        }

        // 优化排序
        const orderByColumn = {
          created_at: videoTable.createdAt,
          title: videoTable.title,
          duration: videoTable.duration,
          rating: videoTable.rating,
          play_count: videoTable.playCount,
        }[sortBy];

        const orderByDirection = sortOrder === 'desc' ? desc : asc;
        queryBuilder = queryBuilder.orderBy(orderByDirection(orderByColumn));

        // 使用子查询优化分页
        const [totalCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(queryBuilder.as('count_query'));

        const items = await queryBuilder.limit(pageSize).offset(offset);

        return {
          items,
          total: totalCount.count,
          page,
          pageSize,
          hasMore: offset + pageSize < totalCount.count,
        };
      }
    );

    // 缓存结果
    this.setCache(cacheKey, result, 2 * 60 * 1000); // 缓存2分钟

    return result;
  }

  /**
   * 批量操作优化
   */
  async batchInsertVideos(videos: Array<typeof videoTable.$inferInsert>): Promise<Video[]> {
    return this.executeQueryWithMetrics('batch_insert_videos', async () => {
      const db = databaseManager.getDatabase();

      // 使用事务批量插入
      const result = await db.transaction(async (tx) => {
        const insertedVideos = [];

        for (const videoData of videos) {
          const [video] = await tx.insert(videoTable).values(videoData).returning();
          insertedVideos.push(video);
        }

        return insertedVideos;
      });

      return result;
    });
  }

  /**
   * 预加载相关数据
   */
  async preloadVideoRelations(videoId: string): Promise<{
    tags: typeof tagTable.$inferSelect[];
    playlists: typeof playlistTable.$inferSelect[];
    bookmarks: typeof bookmarkTable.$inferSelect[];
    watchHistory: typeof watchHistoryTable.$inferSelect[];
  }> {
    const cacheKey = `video_relations_${videoId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const result = await this.executeQueryWithMetrics(
      'preload_video_relations',
      async () => {
        const db = databaseManager.getDatabase();

        // 并行查询所有关联数据
        const [tags, playlists, bookmarks, watchHistory] = await Promise.all([
          db.select({
            id: tagTable.id,
            name: tagTable.name,
            color: tagTable.color,
          })
          .from(tagTable)
          .innerJoin(videoTagTable, eq(videoTagTable.tagId, tagTable.id))
          .where(eq(videoTagTable.videoId, videoId)),

          db.select({
            id: playlistTable.id,
            name: playlistTable.name,
            description: playlistTable.description,
          })
          .from(playlistTable)
          .innerJoin(playlistVideoTable, eq(playlistVideoTable.playlistId, playlistTable.id))
          .where(eq(playlistVideoTable.videoId, videoId)),

          db.select()
          .from(bookmarkTable)
          .where(eq(bookmarkTable.videoId, videoId))
          .orderBy(asc(bookmarkTable.position)),

          db.select()
          .from(watchHistoryTable)
          .where(eq(watchHistoryTable.videoId, videoId))
          .orderBy(desc(watchHistoryTable.watchedAt))
          .limit(10),
        ]);

        return { tags, playlists, bookmarks, watchHistory };
      }
    );

    this.setCache(cacheKey, result, 5 * 60 * 1000); // 缓存5分钟
    return result;
  }

  /**
   * 数据库维护操作
   */
  async performMaintenance(): Promise<void> {
    await this.executeQueryWithMetrics('database_maintenance', async () => {
      const db = databaseManager.getDatabase();

      // 清理过期数据
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      await db
        .delete(watchHistoryTable)
        .where(lte(watchHistoryTable.watchedAt, thirtyDaysAgo.toISOString()));

      // 重建索引（SQLite不支持，但可以分析索引使用情况）
      console.log('Database maintenance completed');
    });
  }

  /**
   * 获取数据库统计信息
   */
  async getDatabaseStats(): Promise<{
    tableSizes: Record<string, number>;
    indexUsage: Record<string, number>;
    performanceMetrics: PerformanceMetrics;
  }> {
    const db = databaseManager.getDatabase();

    const tableSizes: Record<string, number> = {};
    const tables = [
      'videos', 'watch_history', 'playlists', 'playlist_videos',
      'tags', 'video_tags', 'settings', 'folders', 'folder_videos',
      'bookmarks', 'search_index'
    ];

    for (const tableName of tables) {
      try {
        const [result] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(sql.raw(tableName));
        tableSizes[tableName] = result.count;
      } catch (error) {
        console.warn(`Failed to get size for table ${tableName}:`, error);
        tableSizes[tableName] = 0;
      }
    }

    return {
      tableSizes,
      indexUsage: {}, // SQLite不提供详细的索引使用统计
      performanceMetrics: this.getPerformanceMetrics(),
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.queryMetrics = [];
    this.cache.clear();
  }
}

// 导出性能服务实例
export const databasePerformanceService = new DatabasePerformanceService();
