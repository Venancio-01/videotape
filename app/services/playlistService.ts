import db from './database';
import { Playlist, DatabaseResult } from '@/types';

/**
 * 播放列表管理服务
 */
export class PlaylistService {
  private static instance: PlaylistService;

  private constructor() {}

  static getInstance(): PlaylistService {
    if (!PlaylistService.instance) {
      PlaylistService.instance = new PlaylistService();
    }
    return PlaylistService.instance;
  }

  /**
   * 创建播放列表
   */
  async createPlaylist(playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt' | 'videoIds'>): Promise<DatabaseResult<Playlist>> {
    try {
      const playlist: Playlist = {
        id: `playlist_${Date.now()}`,
        ...playlistData,
        createdAt: new Date(),
        updatedAt: new Date(),
        videoIds: [],
      };

      await db.playlists.add(playlist);

      return { success: true, data: playlist };
    } catch (error) {
      console.error('Failed to create playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取播放列表
   */
  async getPlaylist(id: string): Promise<DatabaseResult<Playlist>> {
    try {
      const playlist = await db.playlists.get(id);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }
      return { success: true, data: playlist };
    } catch (error) {
      console.error('Failed to get playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取所有播放列表
   */
  async getAllPlaylists(): Promise<DatabaseResult<Playlist[]>> {
    try {
      const playlists = await db.playlists.toArray();
      return { success: true, data: playlists };
    } catch (error) {
      console.error('Failed to get all playlists:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 更新播放列表
   */
  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<DatabaseResult<Playlist>> {
    try {
      const existingPlaylist = await db.playlists.get(id);
      if (!existingPlaylist) {
        return { success: false, error: 'Playlist not found' };
      }

      const updatedPlaylist = {
        ...existingPlaylist,
        ...updates,
        updatedAt: new Date(),
      };

      await db.playlists.put(updatedPlaylist);

      return { success: true, data: updatedPlaylist };
    } catch (error) {
      console.error('Failed to update playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 删除播放列表
   */
  async deletePlaylist(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const playlist = await db.playlists.get(id);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      await db.playlists.delete(id);

      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 添加视频到播放列表
   */
  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<DatabaseResult<Playlist>> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      if (playlist.videoIds.includes(videoId)) {
        return { success: false, error: 'Video already in playlist' };
      }

      const updatedVideoIds = [...playlist.videoIds, videoId];
      const updatedPlaylist = {
        ...playlist,
        videoIds: updatedVideoIds,
        updatedAt: new Date(),
      };

      await db.playlists.put(updatedPlaylist);

      return { success: true, data: updatedPlaylist };
    } catch (error) {
      console.error('Failed to add video to playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 从播放列表中移除视频
   */
  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<DatabaseResult<Playlist>> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      const updatedVideoIds = playlist.videoIds.filter(id => id !== videoId);
      const updatedPlaylist = {
        ...playlist,
        videoIds: updatedVideoIds,
        updatedAt: new Date(),
      };

      await db.playlists.put(updatedPlaylist);

      return { success: true, data: updatedPlaylist };
    } catch (error) {
      console.error('Failed to remove video from playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 批量添加视频到播放列表
   */
  async addVideosToPlaylist(playlistId: string, videoIds: string[]): Promise<DatabaseResult<Playlist>> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      const uniqueVideoIds = [...new Set([...playlist.videoIds, ...videoIds])];
      const updatedPlaylist = {
        ...playlist,
        videoIds: uniqueVideoIds,
        updatedAt: new Date(),
      };

      await db.playlists.put(updatedPlaylist);

      return { success: true, data: updatedPlaylist };
    } catch (error) {
      console.error('Failed to add videos to playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取播放列表中的视频
   */
  async getPlaylistVideos(playlistId: string): Promise<DatabaseResult<any[]>> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      const videos = await db.videos
        .where('id')
        .anyOf(playlist.videoIds)
        .toArray();

      return { success: true, data: videos };
    } catch (error) {
      console.error('Failed to get playlist videos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 重新排序播放列表
   */
  async reorderPlaylist(playlistId: string, videoIds: string[]): Promise<DatabaseResult<Playlist>> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      const updatedPlaylist = {
        ...playlist,
        videoIds,
        updatedAt: new Date(),
      };

      await db.playlists.put(updatedPlaylist);

      return { success: true, data: updatedPlaylist };
    } catch (error) {
      console.error('Failed to reorder playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 搜索播放列表
   */
  async searchPlaylists(query: string): Promise<DatabaseResult<Playlist[]>> {
    try {
      const searchTerm = query.toLowerCase();
      const playlists = await db.playlists
        .filter(playlist => 
          playlist.name.toLowerCase().includes(searchTerm) ||
          playlist.description?.toLowerCase().includes(searchTerm)
        )
        .toArray();

      return { success: true, data: playlists };
    } catch (error) {
      console.error('Failed to search playlists:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取包含特定视频的播放列表
   */
  async getPlaylistsContainingVideo(videoId: string): Promise<DatabaseResult<Playlist[]>> {
    try {
      const playlists = await db.playlists
        .filter(playlist => playlist.videoIds.includes(videoId))
        .toArray();

      return { success: true, data: playlists };
    } catch (error) {
      console.error('Failed to get playlists containing video:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 复制播放列表
   */
  async duplicatePlaylist(playlistId: string, newName: string): Promise<DatabaseResult<Playlist>> {
    try {
      const originalPlaylist = await db.playlists.get(playlistId);
      if (!originalPlaylist) {
        return { success: false, error: 'Playlist not found' };
      }

      const newPlaylist: Playlist = {
        id: `playlist_${Date.now()}`,
        name: newName,
        description: originalPlaylist.description,
        thumbnailUri: originalPlaylist.thumbnailUri,
        createdAt: new Date(),
        updatedAt: new Date(),
        videoIds: [...originalPlaylist.videoIds],
        isPrivate: originalPlaylist.isPrivate,
      };

      await db.playlists.add(newPlaylist);

      return { success: true, data: newPlaylist };
    } catch (error) {
      console.error('Failed to duplicate playlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const playlistService = PlaylistService.getInstance();