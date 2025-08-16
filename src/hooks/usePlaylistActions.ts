import type { Playlist } from "@/db/schema";
import { PlaylistService } from "@/services/playlistService";
import { useMediaStore } from "@/stores/mediaStore";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useRouter } from "expo-router";
import * as React from "react";
import { Alert } from "react-native";

interface DeletedPlaylistItem {
  playlist: Playlist;
  videos: any[];
  timestamp: number;
}

interface UsePlaylistActionsReturn {
  busyItems: Set<string>;
  deletedPlaylists: DeletedPlaylistItem[];
  setBusyItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDeletedPlaylists: React.Dispatch<
    React.SetStateAction<DeletedPlaylistItem[]>
  >;
  handleSetCurrentPlaylist: (playlist: Playlist) => Promise<void>;
  handlePlayPlaylist: (playlist: Playlist) => Promise<void>;
  handleDeletePlaylist: (playlist: Playlist) => Promise<void>;
  handleUndoDelete: (deletedItem: DeletedPlaylistItem) => Promise<void>;
}

export const usePlaylistActions = (): UsePlaylistActionsReturn => {
  const router = useRouter();
  const { setCurrentPlaylist, currentPlaylist } = useMediaStore();
  const { setQueue, setCurrentQueueIndex, play } = usePlaybackStore();
  const [busyItems, setBusyItems] = React.useState<Set<string>>(new Set());
  const [deletedPlaylists, setDeletedPlaylists] = React.useState<
    DeletedPlaylistItem[]
  >([]);

  const handleSetCurrentPlaylist = async (playlist: Playlist) => {
    if (busyItems.has(playlist.id)) return;

    setBusyItems((prev) => new Set(prev).add(playlist.id));

    try {
      const videos = await PlaylistService.getPlaylistVideos(playlist.id);
      const playlistWithVideos = { ...playlist, videos };
      setCurrentPlaylist(playlistWithVideos);
    } catch (error) {
      console.error("设置播放列表失败:", error);
      Alert.alert("错误", "无法设置播放列表");
    } finally {
      setBusyItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(playlist.id);
        return newSet;
      });
    }
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    if (busyItems.has(playlist.id)) return;

    setBusyItems((prev) => new Set(prev).add(playlist.id));

    try {
      const videos = await PlaylistService.getPlaylistVideos(playlist.id);
      const playlistWithVideos = { ...playlist, videos };

      setQueue(videos);
      setCurrentQueueIndex(0);
      play();
      setCurrentPlaylist(playlistWithVideos);
      router.push("/");
    } catch (error) {
      console.error("播放播放列表失败:", error);
      Alert.alert("错误", "无法播放此播放列表");
    } finally {
      setBusyItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(playlist.id);
        return newSet;
      });
    }
  };

  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (busyItems.has(playlist.id)) return;

    Alert.alert("删除播放列表", `确定要删除播放列表"${playlist.name}"吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          setBusyItems((prev) => new Set(prev).add(playlist.id));

          try {
            // 获取播放列表的完整视频数据用于撤销
            const videos = await PlaylistService.getPlaylistVideos(playlist.id);

            const result = await PlaylistService.deletePlaylist(playlist.id);
            if (result.success) {
              // 记录删除的播放列表完整信息用于撤销
              setDeletedPlaylists((prev) => [
                ...prev,
                {
                  playlist,
                  videos,
                  timestamp: Date.now(),
                },
              ]);

              if (currentPlaylist?.id === playlist.id) {
                setCurrentPlaylist(null);
              }

              // 5秒后自动清除撤销选项
              setTimeout(() => {
                setDeletedPlaylists((prev) =>
                  prev.filter((item) => item.timestamp > Date.now() - 5000),
                );
              }, 5000);
            } else {
              Alert.alert("错误", result.error || "删除播放列表失败");
            }
          } catch (error) {
            console.error("删除播放列表失败:", error);
            Alert.alert("错误", "删除播放列表失败");
          } finally {
            setBusyItems((prev) => {
              const newSet = new Set(prev);
              newSet.delete(playlist.id);
              return newSet;
            });
          }
        },
      },
    ]);
  };

  const handleUndoDelete = async (deletedItem: DeletedPlaylistItem) => {
    try {
      // 重新创建播放列表，恢复完整的视频关联关系
      const result = await PlaylistService.createPlaylist(
        {
          name: deletedItem.playlist.name,
          description: deletedItem.playlist.description || undefined,
          thumbnailPath: deletedItem.playlist.thumbnailPath || undefined,
        },
        deletedItem.videos || [],
      );

      if (result.success) {
        // 从删除列表中移除
        setDeletedPlaylists((prev) =>
          prev.filter((item) => item.timestamp !== deletedItem.timestamp),
        );
      } else {
        Alert.alert("错误", result.error || "撤销删除失败");
      }
    } catch (error) {
      console.error("撤销删除失败:", error);
      Alert.alert("错误", "撤销删除失败");
    }
  };

  return {
    busyItems,
    deletedPlaylists,
    setBusyItems,
    setDeletedPlaylists,
    handleSetCurrentPlaylist,
    handlePlayPlaylist,
    handleDeletePlaylist,
    handleUndoDelete,
  };
};
