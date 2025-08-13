/**
 * React Hooks for Drizzle ORM with Live Query support
 * 基于 useLiveQuery 和仓库模式的响应式数据获取
 */

import { databaseService } from "@/db/repositories/DatabaseService";
import type {
  IQuerier,
  Playlist,
  SearchResult,
  Video,
  VideoStats,
} from "@/db/repositories/interfaces";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useCallback, useEffect, useState } from "react";

// ===== 基础 Live Query Hook =====

/**
 * 通用的 Live Query Hook
 * @param query 查询对象
 * @param options 配置选项
 * @returns 响应式查询结果
 */
export function useLiveQueryData<T>(
  query: IQuerier<T>,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  },
) {
  const { enabled = true, onSuccess, onError } = options || {};
  const [isLoading, setIsLoading] = useState(true);

  const { data, error } = useLiveQuery(query, {
    enabled,
  });

  useEffect(() => {
    if (data !== undefined) {
      setIsLoading(false);
      onSuccess?.(data);
    }
  }, [data, onSuccess]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      onError?.(error);
    }
  }, [error, onError]);

  return {
    data,
    error,
    isLoading,
    refetch: () => {
      setIsLoading(true);
    },
  };
}

// ===== 视频 Hook =====

/**
 * 获取所有视频的 Hook
 */
export function useAllVideos(options?: {
  enabled?: boolean;
  limit?: number;
}) {
  const query = databaseService.video.getAllQuery();
  return useLiveQueryData(query, options);
}

/**
 * 搜索视频的 Hook
 */
export function useVideoSearch(
  params: {
    query?: string;
    category?: string;
    tags?: string[];
    isFavorite?: boolean;
    minDuration?: number;
    maxDuration?: number;
    sortBy?: "created_at" | "title" | "duration" | "rating" | "play_count";
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  },
  options?: {
    enabled?: boolean;
    debounceMs?: number;
  },
) {
  const [debouncedParams, setDebouncedParams] = useState(params);

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedParams(params);
    }, options?.debounceMs || 300);

    return () => clearTimeout(timer);
  }, [params, options?.debounceMs]);

  const query = databaseService.video.searchVideosQuery(debouncedParams);
  return useLiveQueryData<SearchResult<Video>>(query, options);
}

/**
 * 获取单个视频的 Hook
 */
export function useVideo(
  id: string,
  options?: {
    enabled?: boolean;
    includeRelations?: boolean;
  },
) {
  const query = options?.includeRelations
    ? databaseService.video.getVideoWithRelationsQuery(id)
    : databaseService.video.findByIdQuery(id);

  return useLiveQueryData(query, options);
}

/**
 * 获取收藏视频的 Hook
 */
export function useFavoriteVideos(options?: {
  enabled?: boolean;
}) {
  const query = databaseService.video.getFavoriteVideosQuery();
  return useLiveQueryData(query, options);
}

/**
 * 获取推荐视频的 Hook
 */
export function useRecommendedVideos(options?: {
  enabled?: boolean;
  limit?: number;
}) {
  const query = databaseService.video.getRecommendedVideosQuery(options?.limit);
  return useLiveQueryData(query, options);
}

/**
 * 获取视频统计信息的 Hook
 */
export function useVideoStats(options?: {
  enabled?: boolean;
}) {
  const query = databaseService.video.getVideoStatsQuery();
  return useLiveQueryData<VideoStats>(query, options);
}

// ===== 播放列表 Hook =====

/**
 * 获取所有播放列表的 Hook
 */
export function useAllPlaylists(options?: {
  enabled?: boolean;
}) {
  const query = databaseService.playlist.getAllPlaylistsQuery();
  return useLiveQueryData(query, options);
}

/**
 * 获取单个播放列表的 Hook
 */
export function usePlaylist(
  id: string,
  options?: {
    enabled?: boolean;
    includeVideos?: boolean;
  },
) {
  const query = options?.includeVideos
    ? databaseService.playlist.getPlaylistWithVideosQuery(id)
    : databaseService.playlist.findByIdQuery(id);

  return useLiveQueryData(query, options);
}

/**
 * 获取公开播放列表的 Hook
 */
export function usePublicPlaylists(options?: {
  enabled?: boolean;
}) {
  const query = databaseService.playlist.getPublicPlaylistsQuery();
  return useLiveQueryData(query, options);
}

// ===== 操作 Hook =====

/**
 * 视频操作 Hook
 */
export function useVideoOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createVideo = useCallback(async (data: Omit<Video, "id">) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await databaseService.video.create(data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("创建视频失败");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateVideo = useCallback(async (id: string, data: Partial<Video>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await databaseService.video.update(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("更新视频失败");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await databaseService.video.delete(id);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("删除视频失败");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWatchProgress = useCallback(
    async (id: string, progress: number) => {
      setIsLoading(true);
      setError(null);

      try {
        await databaseService.video.updateWatchProgress(id, progress);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("更新观看进度失败");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      setIsLoading(true);
      setError(null);

      try {
        await databaseService.video.update(id, { isFavorite });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("更新收藏状态失败");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    createVideo,
    updateVideo,
    deleteVideo,
    updateWatchProgress,
    toggleFavorite,
  };
}

/**
 * 播放列表操作 Hook
 */
export function usePlaylistOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPlaylist = useCallback(async (data: Omit<Playlist, "id">) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await databaseService.playlist.create(data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("创建播放列表失败");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePlaylist = useCallback(
    async (id: string, data: Partial<Playlist>) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await databaseService.playlist.update(id, data);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("更新播放列表失败");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deletePlaylist = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await databaseService.playlist.delete(id);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("删除播放列表失败");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addVideoToPlaylist = useCallback(
    async (
      playlistId: string,
      videoId: string,
      options?: {
        customTitle?: string;
        customThumbnailPath?: string;
        notes?: string;
      },
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        await databaseService.playlist.addVideoToPlaylist(
          playlistId,
          videoId,
          options,
        );
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("添加视频到播放列表失败");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const removeVideoFromPlaylist = useCallback(
    async (playlistId: string, videoId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await databaseService.playlist.removeVideoFromPlaylist(
          playlistId,
          videoId,
        );
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("从播放列表移除视频失败");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
  };
}

// ===== 数据库服务 Hook =====

/**
 * 数据库服务 Hook
 */
export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHealthy, setIsHealthy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async () => {
    try {
      await databaseService.initialize();
      setIsInitialized(true);
      setIsHealthy(await databaseService.isHealthy());
    } catch (err) {
      const error = err instanceof Error ? err : new Error("数据库初始化失败");
      setError(error);
      throw error;
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const healthy = await databaseService.isHealthy();
      setIsHealthy(healthy);
      return healthy;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("健康检查失败");
      setError(error);
      return false;
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isInitialized,
    isHealthy,
    error,
    database: databaseService,
    initialize,
    checkHealth,
  };
}
