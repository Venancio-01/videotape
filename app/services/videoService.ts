import db from '@/services/database';
import { storageService } from '@/services/storage';
import { Video, Playlist, Folder, PlayHistory, FilterOptions, DatabaseResult, PaginatedData } from '@/types';

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
  async addVideo(videoData: Omit<Video, 'id' | 'createdAt' | 'updatedAt' | 'playCount' | 'isFavorite'>): Promise<DatabaseResult<Video>> {
    try {
      // 保存视频文件
      const videoUri = await storageService.saveVideoFile(videoData.uri, `video_${Date.now()}.mp4`);
      
      // 生成缩略图
      const thumbnailUri = await storageService.generateThumbnail(videoUri);
      
      // 获取文件信息
      const fileInfo = await storageService.getFileInfo(videoUri);
      const fileSize = fileInfo.size || 0;

      const video: Video = {
        id: `video_${Date.now()}`,
        ...videoData,
        uri: videoUri,
        thumbnailUri,
        size: fileSize,
        createdAt: new Date(),
        updatedAt: new Date(),
        playCount: 0,
        likeCount: 0,
        isFavorite: false,
      };

      await db.videos.add(video);

      return { success: true, data: video };
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
      const video = await db.videos.get(id);
      if (!video) {
        return { success: false, error: 'Video not found' };
      }
      return { success: true, data: video };
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
      const videos = await db.videos.toArray();
      return { success: true, data: videos };
    } catch (error) {
      console.error('Failed to get all videos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取分页视频
   */
  async getPaginatedVideos(page: number, pageSize: number, options?: FilterOptions): Promise<DatabaseResult<PaginatedData<Video>>> {
    try {
      let query = db.videos.orderBy(options?.sortBy || 'createdAt');

      // 应用排序
      if (options?.sortOrder === 'desc') {
        query = query.reverse();
      }

      // 应用筛选
      if (options?.filterBy === 'favorites') {
        query = query.filter(video => video.isFavorite);
      } else if (options?.filterBy === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.filter(video => video.createdAt >= oneWeekAgo);
      } else if (options?.folderId) {
        query = query.filter(video => video.folderId === options.folderId);
      }

      // 应用搜索
      if (options?.searchQuery) {
        const searchQuery = options.searchQuery.toLowerCase();
        query = query.filter(video => 
          video.title.toLowerCase().includes(searchQuery) ||
          video.description?.toLowerCase().includes(searchQuery)
        );
      }

      // 应用标签筛选
      if (options?.tags && options.tags.length > 0) {
        query = query.filter(video => 
          options.tags!.some(tag => video.tags.includes(tag))
        );
      }

      // 应用文件类型筛选
      if (options?.mimeType) {
        query = query.filter(video => video.mimeType === options.mimeType);
      }

      const total = await query.count();
      const items = await query.offset((page - 1) * pageSize).limit(pageSize).toArray();

      return {
        success: true,
        data: {
          items,
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
      const existingVideo = await db.videos.get(id);
      if (!existingVideo) {
        return { success: false, error: 'Video not found' };
      }

      const updatedVideo = {
        ...existingVideo,
        ...updates,
        updatedAt: new Date(),
      };

      await db.videos.put(updatedVideo);

      return { success: true, data: updatedVideo };
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
      const video = await db.videos.get(id);
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
      const playlists = await db.playlists.toArray();
      for (const playlist of playlists) {
        if (playlist.videoIds.includes(id)) {
          const updatedVideoIds = playlist.videoIds.filter(videoId => videoId !== id);
          await db.playlists.update(playlist.id, { 
            videoIds: updatedVideoIds,
            updatedAt: new Date(),
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
   * 切换收藏状态
   */
  async toggleFavorite(id: string): Promise<DatabaseResult<Video>> {
    try {
      const video = await db.videos.get(id);
      if (!video) {
        return { success: false, error: 'Video not found' };
      }

      const updatedVideo = {
        ...video,
        isFavorite: !video.isFavorite,
        updatedAt: new Date(),
      };

      await db.videos.put(updatedVideo);

      return { success: true, data: updatedVideo };
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 增加播放次数
   */
  async incrementPlayCount(id: string): Promise<DatabaseResult<void>> {
    try {
      const video = await db.videos.get(id);
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
   * 获取收藏视频
   */
  async getFavoriteVideos(): Promise<DatabaseResult<Video[]>> {
    try {
      const videos = await db.videos.filter(video => video.isFavorite).toArray();
      return { success: true, data: videos };
    } catch (error) {
      console.error('Failed to get favorite videos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取最近播放的视频
   */
  async getRecentVideos(limit: number = 10): Promise<DatabaseResult<Video[]>> {
    try {
      const videos = await db.videos
        .orderBy('lastPlayedAt')
        .reverse()
        .filter(video => video.lastPlayedAt !== undefined)
        .limit(limit)
        .toArray();

      return { success: true, data: videos };
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
      const searchTerm = query.toLowerCase();
      const videos = await db.videos
        .filter(video => 
          video.title.toLowerCase().includes(searchTerm) ||
          video.description?.toLowerCase().includes(searchTerm) ||
          video.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        )
        .toArray();

      return { success: true, data: videos };
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

  /**
   * 增加点赞数
   */
  async incrementLikeCount(id: string): Promise<DatabaseResult<number>> {
    try {
      const video = await db.videos.get(id);
      if (!video) {
        return { success: false, error: 'Video not found' };
      }

      const newLikeCount = (video.likeCount || 0) + 1;
      await db.videos.update(id, { likeCount: newLikeCount, updatedAt: new Date() });

      return { success: true, data: newLikeCount };
    } catch (error) {
      console.error('Failed to increment like count:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 减少点赞数
   */
  async decrementLikeCount(id: string): Promise<DatabaseResult<number>> {
    try {
      const video = await db.videos.get(id);
      if (!video) {
        return { success: false, error: 'Video not found' };
      }

      const newLikeCount = Math.max(0, (video.likeCount || 0) - 1);
      await db.videos.update(id, { likeCount: newLikeCount, updatedAt: new Date() });

      return { success: true, data: newLikeCount };
    } catch (error) {
      console.error('Failed to decrement like count:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const videoService = VideoService.getInstance();