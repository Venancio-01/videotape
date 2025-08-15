import {
  Check,
  FolderOpen,
  MoreVertical,
  Play,
  Plus,
  Trash2,
} from "@/components/Icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Text } from "@/components/ui/text";
import { useDatabase } from "@/db/provider";
import { type Playlist, playlistTable } from "@/db/schema";
import { PlaylistService } from "@/services/playlistService";
import { useMediaStore } from "@/stores/mediaStore";
import { usePlaybackStore } from "@/stores/playbackStore";
import { FlashList } from "@shopify/flash-list";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useRouter } from "expo-router";
import * as React from "react";
import { Alert, TouchableOpacity, View } from "react-native";

export default function PlaylistsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { setCurrentPlaylist } = useMediaStore();
  const { setQueue, setCurrentQueueIndex, play } = usePlaybackStore();
  const [loadingPlaylists, setLoadingPlaylists] = React.useState<Set<string>>(
    new Set(),
  );
  const [deletingPlaylists, setDeletingPlaylists] = React.useState<Set<string>>(
    new Set(),
  );
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const { data: playlists } = useLiveQuery(
    db.select().from(playlistTable).orderBy(desc(playlistTable.createdAt)),
  );

  const handlePlayPlaylist = async (playlist: Playlist) => {
    if (loadingPlaylists.has(playlist.id)) {
      return;
    }

    setLoadingPlaylists((prev) => new Set(prev).add(playlist.id));

    try {
      // 获取播放列表中的视频
      const videos = await PlaylistService.getPlaylistVideos(playlist.id);

      // 创建带有视频信息的完整播放列表对象
      const playlistWithVideos = {
        ...playlist,
        videos,
      };

      // 同步到播放store
      setQueue(videos);
      setCurrentQueueIndex(0);
      play();

      // 设置为当前播放列表
      setCurrentPlaylist(playlistWithVideos);

      // 跳转到 index tab
      router.push("/");
    } catch (error) {
      console.error("播放播放列表失败:", error);
      Alert.alert("错误", "无法播放此播放列表");
    } finally {
      setLoadingPlaylists((prev) => {
        const newSet = new Set(prev);
        newSet.delete(playlist.id);
        return newSet;
      });
    }
  };

  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (deletingPlaylists.has(playlist.id)) {
      return;
    }

    // 显示确认对话框
    Alert.alert(
      "删除播放列表",
      `确定要删除播放列表"${playlist.name}"吗？此操作不可撤销。`,
      [
        {
          text: "取消",
          style: "cancel",
        },
        {
          text: "删除",
          style: "destructive",
          onPress: async () => {
            setDeletingPlaylists((prev) => new Set(prev).add(playlist.id));

            try {
              const result = await PlaylistService.deletePlaylist(playlist.id);

              if (result.success) {
                // 如果删除的是当前播放列表，清除当前播放列表
                if (playlists.find((p) => p.id === playlist.id)) {
                  setCurrentPlaylist(null);
                }
                console.log("删除播放列表成功:", playlist.id);
              } else {
                Alert.alert("错误", result.error || "删除播放列表失败");
              }
            } catch (error) {
              console.error("删除播放列表失败:", error);
              Alert.alert("错误", "删除播放列表失败");
            } finally {
              setDeletingPlaylists((prev) => {
                const newSet = new Set(prev);
                newSet.delete(playlist.id);
                return newSet;
              });
            }
          },
        },
      ],
    );
  };

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center bg-secondary/30">
        <Text>加载数据库...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity className="mb-4">
      <Card className="rounded-2xl">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <View className="flex-row items-center gap-2">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            {playlists.find((p) => p.id === item.id) && (
              <View className="bg-green-500 px-2 py-1 rounded-full flex-row items-center gap-1">
                <Check className="w-3 h-3 text-white" />
                <Text className="text-white text-xs">当前</Text>
              </View>
            )}
          </View>
          <DropdownMenu
            open={openDropdown === item.id}
            onOpenChange={(isOpen) => setOpenDropdown(isOpen ? item.id : null)}
          >
            <DropdownMenuTrigger asChild>
              <TouchableOpacity
                disabled={deletingPlaylists.has(item.id)}
                onPress={() =>
                  setOpenDropdown(openDropdown === item.id ? null : item.id)
                }
              >
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </TouchableOpacity>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom">
              <DropdownMenuItem
                onPress={() => {
                  setOpenDropdown(null);
                  handleDeletePlaylist(item);
                }}
                disabled={deletingPlaylists.has(item.id)}
                className="flex-row items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
                <Text className="text-destructive">删除</Text>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {item.description && (
            <Text className="text-muted-foreground mb-3">
              {item.description}
            </Text>
          )}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">
                {String(item.videoCount || 0)} 个视频
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="bg-primary px-3 py-1 rounded-full flex-row items-center gap-1"
                onPress={() => handlePlayPlaylist(item)}
                disabled={
                  loadingPlaylists.has(item.id) ||
                  deletingPlaylists.has(item.id)
                }
              >
                {loadingPlaylists.has(item.id) ? (
                  <Text className="text-primary-foreground text-sm">
                    加载中...
                  </Text>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-primary-foreground" />
                    <Text className="text-primary-foreground text-sm">
                      播放
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background p-4">
      <Stack.Screen
        options={{
          title: "播放列表",
          headerRight: () => (
            <TouchableOpacity
              className="mr-4"
              onPress={() => router.push("/playlist/create")}
            >
              <Plus className="w-6 h-6 text-foreground" />
            </TouchableOpacity>
          ),
        }}
      />

      <FlashList
        data={playlists}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center pt-24">
            <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <Text className="text-lg font-semibold mb-2">暂无播放列表</Text>
            <Text className="text-muted-foreground text-center mb-6">
              创建播放列表来组织您的视频
            </Text>
          </View>
        )}
        ListFooterComponent={<View className="py-20" />}
      />
    </View>
  );
}
