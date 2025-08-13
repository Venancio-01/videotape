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
import { getDatabase } from "./drizzle";
import {
  bookmarkTable,
  folderTable,
  folderVideoTable,
  playlistTable,
  playlistVideoTable,
  settingsTable,
  tagTable,
  videoTable,
  videoTagTable,
  watchHistoryTable,
} from "./schema";
import type {
  Bookmark,
  Folder,
  FolderWithVideos,
  Playlist,
  PlaylistWithVideos,
  SearchResult,
  Settings,
  Tag,
  UserStats,
  Video,
  VideoSearchParams,
  VideoStats,
  WatchHistory,
} from "./schema";

export class DatabaseService {
  private getDb() {
    return getDatabase();
  }

  // ===== 视频操作 =====

  /**
   * 创建视频记录
   */
  async createVideo(
    videoData: Omit<typeof videoTable.$inferInsert, "id">,
  ): Promise<Video> {
    const db = this.getDb();
    const [video] = await db.insert(videoTable).values(videoData).returning();
    return video;
  }

  /**
   * 批量创建视频记录
   */
  async batchCreateVideos(
    videoDataList: Omit<typeof videoTable.$inferInsert, "id">[],
  ): Promise<Video[]> {
    const db = this.getDb();
    const videos = await db
      .insert(videoTable)
      .values(videoDataList)
      .returning();
    return Array.isArray(videos) ? videos : [];
  }

  async getVideos(limit = 20, offset = 0) {
    const db = this.getDb();
    return db
      .select()
      .from(videoTable)
      .orderBy(desc(videoTable.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 根据ID获取视频
   */
  async getVideoById(id: string): Promise<Video | null> {
    const db = this.getDb();
    const [video] = await db
      .select()
      .from(videoTable)
      .where(eq(videoTable.id, id));
    return video || null;
  }

  /**
   * 根据文件路径获取视频
   */
  async getVideoByFilePath(filePath: string): Promise<Video | null> {
    const db = this.getDb();
    const [video] = await db
      .select()
      .from(videoTable)
      .where(eq(videoTable.filePath, filePath));
    return video || null;
  }

  /**
   * 搜索视频
   */
  async searchVideos(params: VideoSearchParams): Promise<SearchResult<Video>> {
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

    // 收藏过滤 - 使用正确的布尔值比较
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

    // 获取总数 - 使用子查询
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(filteredQuery.as("videos_filtered"));

    const [totalCount] = await countQuery;

    // 获取分页数据
    const items = await sortedQuery.limit(pageSize).offset(offset);

    return {
      items,
      total: totalCount.count,
      page,
      pageSize,
      hasMore: offset + pageSize < totalCount.count,
    };
  }

  /**
   * 更新视频信息
   */
  async updateVideo(
    id: string,
    updateData: Partial<Omit<typeof videoTable.$inferSelect, "id">>,
  ): Promise<Video> {
    const db = this.getDb();
    const [video] = await db
      .update(videoTable)
      .set({ ...updateData, updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(videoTable.id, id))
      .returning();
    return video;
  }

  /**
   * 删除视频
   */
  async deleteVideo(id: string): Promise<boolean> {
    const db = this.getDb();
    const result = await db.delete(videoTable).where(eq(videoTable.id, id));
    return result.changes > 0;
  }

  /**
   * 获取视频统计信息
   */
  async getVideoStats(): Promise<VideoStats> {
    const db = this.getDb();

    const [stats] = await db
      .select({
        totalVideos: sql<number>`COUNT(*)`,
        totalDuration: sql<number>`SUM(duration)`,
        totalSize: sql<number>`SUM(file_size)`,
        totalPlayCount: sql<number>`SUM(play_count)`,
        averageRating: sql<number>`AVG(rating)`,
      })
      .from(videoTable);

    const categoryStats = await db
      .select({
        category: videoTable.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(videoTable)
      .groupBy(videoTable.category);

    const categories = categoryStats.reduce(
      (acc, stat) => {
        acc[stat.category] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalVideos: stats.totalVideos || 0,
      totalDuration: stats.totalDuration || 0,
      totalSize: stats.totalSize || 0,
      totalPlayCount: stats.totalPlayCount || 0,
      averageRating: stats.averageRating || 0,
      categories,
    };
  }

  // ===== 播放历史操作 =====

  /**
   * 记录观看历史
   */
  async recordWatchHistory(
    historyData: Omit<typeof watchHistoryTable.$inferInsert, "id">,
  ): Promise<WatchHistory> {
    const db = this.getDb();

    // 开始事务
    const result = await db.transaction(async (tx) => {
      // 插入观看历史
      const [history] = await tx
        .insert(watchHistoryTable)
        .values(historyData)
        .returning();

      // 更新视频的观看进度和统计
      await tx
        .update(videoTable)
        .set({
          watchProgress: historyData.position,
          lastWatchedAt: sql`(CURRENT_TIMESTAMP)`,
          playCount: sql`${videoTable.playCount} + 1`,
        })
        .where(eq(videoTable.id, historyData.videoId));

      return history;
    });

    return result;
  }

  /**
   * 获取视频的观看历史
   */
  async getVideoWatchHistory(
    videoId: string,
    limit = 10,
  ): Promise<WatchHistory[]> {
    const db = this.getDb();
    return db
      .select()
      .from(watchHistoryTable)
      .where(eq(watchHistoryTable.videoId, videoId))
      .orderBy(desc(watchHistoryTable.watchedAt))
      .limit(limit);
  }

  // ===== 播放列表操作 =====

  /**
   * 创建播放列表
   */
  async createPlaylist(
    playlistData: Omit<typeof playlistTable.$inferInsert, "id">,
  ): Promise<Playlist> {
    const db = this.getDb();
    const [playlist] = await db
      .insert(playlistTable)
      .values(playlistData)
      .returning();
    return playlist;
  }

  /**
   * 获取播放列表及其视频
   */
  async getPlaylistWithVideos(
    playlistId: string,
  ): Promise<PlaylistWithVideos | null> {
    const db = this.getDb();

    const [playlist] = await db
      .select()
      .from(playlistTable)
      .where(eq(playlistTable.id, playlistId));

    if (!playlist) return null;

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
      ...playlist,
      videos: videos.map((v) => ({
        id: v.id,
        title: v.title,
        filePath: v.filePath,
        thumbnailPath: v.thumbnailPath,
        duration: v.duration,
        fileSize: v.fileSize,
        format: v.format,
        resolutionWidth: v.resolutionWidth,
        resolutionHeight: v.resolutionHeight,
        tags: v.tags,
        category: v.category,
        watchProgress: v.watchProgress,
        isFavorite: v.isFavorite,
        playCount: v.playCount,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        order: v.position,
        customTitle: v.customTitle,
        customThumbnailPath: v.customThumbnailPath,
        notes: v.notes,
      })),
    };
  }

  /**
   * 添加视频到播放列表
   */
  async addVideoToPlaylist(
    playlistId: string,
    videoId: string,
    options?: {
      customTitle?: string;
      notes?: string;
    },
  ): Promise<void> {
    const db = this.getDb();

    await db.transaction(async (tx) => {
      // 获取当前最大位置
      const [maxPosition] = await tx
        .select({ position: playlistVideoTable.position })
        .from(playlistVideoTable)
        .where(eq(playlistVideoTable.playlistId, playlistId))
        .orderBy(desc(playlistVideoTable.position))
        .limit(1);

      const nextPosition = maxPosition ? maxPosition.position + 1 : 0;

      // 添加视频到播放列表
      await tx.insert(playlistVideoTable).values({
        playlistId,
        videoId,
        position: nextPosition,
        customTitle: options?.customTitle,
        notes: options?.notes,
      });

      // 更新播放列表的视频计数
      await tx
        .update(playlistTable)
        .set({
          videoCount: sql`${playlistTable.videoCount} + 1`,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(playlistTable.id, playlistId));
    });
  }

  // ===== 标签操作 =====

  /**
   * 创建标签
   */
  async createTag(
    tagData: Omit<typeof tagTable.$inferInsert, "id">,
  ): Promise<Tag> {
    const db = this.getDb();
    const [tag] = await db.insert(tagTable).values(tagData).returning();
    return tag;
  }

  /**
   * 获取所有标签
   */
  async getAllTags(): Promise<Tag[]> {
    const db = this.getDb();
    return db
      .select()
      .from(tagTable)
      .orderBy(desc(tagTable.usageCount), asc(tagTable.name));
  }

  /**
   * 为视频添加标签
   */
  async addTagToVideo(videoId: string, tagId: string): Promise<void> {
    const db = this.getDb();
    await db.insert(videoTagTable).values({ videoId, tagId });
  }

  // ===== 设置操作 =====

  /**
   * 获取用户设置
   */
  async getSettings(): Promise<Settings> {
    const db = this.getDb();
    const [settings] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.id, "default"));

    if (!settings) {
      // 如果没有设置，创建默认设置
      const [defaultSettings] = await db
        .insert(settingsTable)
        .values({ id: "default" })
        .returning();
      return defaultSettings;
    }

    return settings;
  }

  /**
   * 更新用户设置
   */
  async updateSettings(
    updateData: Partial<Omit<typeof settingsTable.$inferSelect, "id">>,
  ): Promise<Settings> {
    const db = this.getDb();
    const [settings] = await db
      .update(settingsTable)
      .set({ ...updateData, updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(settingsTable.id, "default"))
      .returning();
    return settings;
  }

  // ===== 文件夹操作 =====

  /**
   * 创建文件夹
   */
  async createFolder(
    folderData: Omit<typeof folderTable.$inferInsert, "id">,
  ): Promise<Folder> {
    const db = this.getDb();
    const result = await db.insert(folderTable).values(folderData).returning();
    const folder = Array.isArray(result) ? result[0] : result;
    return folder;
  }

  /**
   * 获取文件夹及其子文件夹和视频
   */
  async getFolderWithContents(
    folderId: string,
  ): Promise<FolderWithVideos | null> {
    const db = this.getDb();

    const [folder] = await db
      .select()
      .from(folderTable)
      .where(eq(folderTable.id, folderId));

    if (!folder) return null;

    // 获取子文件夹
    const children = await db
      .select()
      .from(folderTable)
      .where(eq(folderTable.parentId, folderId))
      .orderBy(asc(folderTable.name));

    // 获取文件夹中的视频
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
        tags: videoTable.tags,
        category: videoTable.category,
        watchProgress: videoTable.watchProgress,
        isFavorite: videoTable.isFavorite,
        playCount: videoTable.playCount,
        createdAt: videoTable.createdAt,
        updatedAt: videoTable.updatedAt,
      })
      .from(videoTable)
      .innerJoin(folderVideoTable, eq(videoTable.id, folderVideoTable.videoId))
      .where(eq(folderVideoTable.folderId, folderId))
      .orderBy(asc(videoTable.title));

    return {
      ...folder,
      videos,
      children,
    };
  }

  // ===== 书签操作 =====

  /**
   * 创建书签
   */
  async createBookmark(
    bookmarkData: Omit<typeof bookmarkTable.$inferInsert, "id">,
  ): Promise<Bookmark> {
    const db = this.getDb();
    const [bookmark] = await db
      .insert(bookmarkTable)
      .values(bookmarkData)
      .returning();
    return bookmark;
  }

  /**
   * 获取视频的书签
   */
  async getVideoBookmarks(videoId: string): Promise<Bookmark[]> {
    const db = this.getDb();
    return db
      .select()
      .from(bookmarkTable)
      .where(eq(bookmarkTable.videoId, videoId))
      .orderBy(asc(bookmarkTable.position));
  }

  // ===== 用户统计操作 =====

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<UserStats> {
    const db = this.getDb();

    const [watchStats] = await db
      .select({
        totalWatchTime: sql<number>`SUM(watch_time)`,
        videosWatched: sql<number>`COUNT(DISTINCT video_id)`,
      })
      .from(watchHistoryTable);

    const [playlistStats] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(playlistTable);

    const [bookmarkStats] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(bookmarkTable);

    const [favoriteStats] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(videoTable)
      .where(eq(videoTable.isFavorite, true));

    return {
      totalWatchTime: watchStats.totalWatchTime || 0,
      videosWatched: watchStats.videosWatched || 0,
      playlistsCreated: playlistStats.count || 0,
      bookmarksCreated: bookmarkStats.count || 0,
      favoriteVideos: favoriteStats.count || 0,
    };
  }

  /**
   * 获取推荐视频（基于观看历史和收藏）
   */
  async getRecommendedVideos(limit = 10): Promise<Video[]> {
    const db = this.getDb();

    // 获取用户经常观看的分类
    const favoriteCategories = await db
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

    const categoryNames = favoriteCategories.map((fc) => fc.category);

    // 获取这些分类中的视频，排除已观看的
    const watchedVideoIds = await db
      .select({ videoId: watchHistoryTable.videoId })
      .from(watchHistoryTable)
      .groupBy(watchHistoryTable.videoId);

    const recommendedVideos = await db
      .select()
      .from(videoTable)
      .where(
        and(
          inArray(videoTable.category, categoryNames),
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

    return recommendedVideos;
  }
}

// 导出数据库服务实例
export const databaseService = new DatabaseService();
