import { getUnifiedDatabase } from '@/database';
import { storageService } from '@/services/storage';
import {
  Video,
  // Playlist, // 保留用于将来可能的播放列表功能
  // Folder, // 保留用于将来可能的文件夹功能
  // PlayHistory, // 保留用于将来可能的历史记录功能
  FilterOptions,
  DatabaseResult,
  PaginatedData,
} from '@/types';

/**
 * 视频管理服务
 */
export class VideoService {
  private static instance: VideoService;

  private constructor() {}

  static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  /**
   * 添加视频
   */
  async addVideo(
    videoData: Omit<Video, 'id' | 'createdAt' | 'updatedAt' | 'playCount' | 'isFavorite'>
  ): Promise<DatabaseResult<Video>> {
    try {
      const db = getUnifiedDatabase();

      // 保存视频文件
      const videoUri = await storageService.saveVideoFile(videoData.uri, `video_${Date.now()}.mp4`);

      // 生成缩略图
      const thumbnailUri = await storageService.generateThumbnail(videoUri);

      // 获取文件信息
      const fileInfo = await storageService.getFileInfo(videoUri);
      const fileSize = (fileInfo as any).size || 0;

      const videoInput = {
        title: videoData.title,
        uri: videoUri,
        thumbnailUri,
        duration: videoData.duration,
        size: fileSize,
        mimeType: videoData.mimeType,
        description: videoData.description,
        folderId: videoData.folderId,
        tags: videoData.tags || [],
        playCount: 0,
        isFavorite: false,
        lastPlayedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const video = await db.videos.add(videoInput);

      return { success: true, data: video as Video };
    } catch (error) {
      console.error('Failed to add video:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取视频
   */
  async getVideo(id: string): Promise<DatabaseResult<Video>> {
    try {
      const db = getUnifiedDatabase();
      const video = await db.videos.getById(id);
      if (!video) {
        return { success: false, error: 'Video not found' };
      }
      return { success: true, data: video as Video };
    } catch (error) {
      console.error('Failed to get video:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取所有视频
   */
  async getVideos(): Promise<DatabaseResult<Video[]>> {
    try {
      const db = getUnifiedDatabase();
      const videos = await db.videos.getAll();
      return { success: true, data: videos as Video[] };
    } catch (error) {
      console.error('Failed to get all videos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取分页视频
   */
  async getPaginatedVideos(
    page: number,
    pageSize: number,
    options?: FilterOptions
  ): Promise<DatabaseResult<PaginatedData<Video>>> {
    try {
      const db = getUnifiedDatabase();

      const searchOptions: any = {
        sortBy: options?.sortBy || 'createdAt',
        sortOrder: options?.sortOrder || 'desc',
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };

      // 应用筛选
      if (options?.filterBy === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        searchOptions.filters = { createdAt: { $gte: oneWeekAgo } };
      } else if (options?.folderId) {
        searchOptions.filters = { folderId: options.folderId };
      }

      // 应用搜索
      if (options?.searchQuery) {
        searchOptions.searchQuery = options.searchQuery;
      }

      // 应用标签筛选
      if (options?.tags && options.tags.length > 0) {
        searchOptions.tags = options.tags;
      }

      // 应用文件类型筛选
      if (options?.mimeType) {
        searchOptions.filters = {
          ...searchOptions.filters,
          mimeType: options.mimeType,
        };
      }

      const result = db.videos.search(searchOptions.searchQuery || '', searchOptions);
      const total = result.length;

      return {
        success: true,
        data: {
          items: result as Video[],
          total,
          page,
          pageSize,
          hasMore: page * pageSize < total,
        },
      };
    } catch (error) {
      console.error('Failed to get paginated videos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 更新视频
   */
  async updateVideo(id: string, updates: Partial<Video>): Promise<DatabaseResult<Video>> {
    try {
      const db = getUnifiedDatabase();
      const existingVideo = await db.videos.getById(id);
      if (!existingVideo) {
        return { success: false, error: 'Video not found' };
      }

      const updatedVideo = {
        ...updates,
        updatedAt: new Date(),
      };

      await db.videos.update(id, updatedVideo);
      const updatedVideoResult = await db.videos.getById(id);

      return { success: true, data: updatedVideoResult as Video };
    } catch (error) {
      console.error('Failed to update video:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 删除视频
   */
  async deleteVideo(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const db = getUnifiedDatabase();
      const video = await db.videos.getById(id);
      if (!video) {
        return { success: false, error: 'Video not found' };
      }

      // 删除文件
      await storageService.deleteVideoFile(video.uri);
      if (video.thumbnailUri) {
        await storageService.deleteThumbnail(video.thumbnailUri);
      }

      // 删除数据库记录
      await db.videos.delete(id);

      // 从播放列表中移除
      const playlists = await db.playlists.getAll();
      for (const playlist of playlists) {
        if (playlist.videoIds.includes(id)) {
          const updatedVideoIds = playlist.videoIds.filter((videoId) => videoId !== id);
          await db.playlists.update(playlist.id, {
            videoIds: updatedVideoIds,
          });
        }
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to delete video:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 增加播放次数
   */
  async incrementPlayCount(id: string): Promise<DatabaseResult<void>> {
    try {
      const db = getUnifiedDatabase();
      const video = await db.videos.getById(id);
      if (!video) {
        return { success: false, error: 'Video not found' };
      }

      await db.videos.update(id, {
        playCount: (video.playCount || 0) + 1,
        lastPlayedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to increment play count:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取最近播放的视频
   */
  async getRecentVideos(limit: number = 10): Promise<DatabaseResult<Video[]>> {
    try {
      const db = getUnifiedDatabase();
      const videos = db.videos.search('', {
        sortBy: 'date',
        sortOrder: 'desc',
        limit,
      });

      return { success: true, data: videos as Video[] };
    } catch (error) {
      console.error('Failed to get recent videos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 搜索视频
   */
  async searchVideos(query: string): Promise<DatabaseResult<Video[]>> {
    try {
      const db = getUnifiedDatabase();
      const videos = db.videos.search(query);

      return { success: true, data: videos as Video[] };
    } catch (error) {
      console.error('Failed to search videos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 批量删除视频
   */
  async batchDeleteVideos(ids: string[]): Promise<DatabaseResult<boolean>> {
    try {
      for (const id of ids) {
        await this.deleteVideo(id);
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to batch delete videos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const videoService = VideoService.getInstance();
