import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Search, Plus, Filter, SortAsc, SortDesc } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { PlaylistQuickActions } from "./PlaylistQuickActions";
import { PlaylistGrid } from "./PlaylistCard";
import { databaseService } from "@/db/database-service";
import { type Playlist } from "@/db/schema";

interface PlaylistManagerProps {
  className?: string;
}

export function PlaylistManager({ className = "" }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "videoCount" | "playCount">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // 加载播放列表
  const loadPlaylists = async () => {
    try {
      setLoading(true);
      // 这里需要实现获取所有播放列表的方法
      // const data = await databaseService.getAllPlaylists();
      // setPlaylists(data);
      setPlaylists([]); // 临时设置空数组
    } catch (error) {
      console.error("加载播放列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlaylists();
    setRefreshing(false);
  };

  // 初始化加载
  useEffect(() => {
    loadPlaylists();
  }, []);

  // 过滤和排序播放列表
  useEffect(() => {
    let filtered = [...playlists];

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (playlist) =>
          playlist.name.toLowerCase().includes(query) ||
          playlist.description?.toLowerCase().includes(query) ||
          playlist.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 公开过滤
    if (showOnlyPublic) {
      filtered = filtered.filter((playlist) => playlist.isPublic);
    }

    // 收藏过滤
    if (showOnlyFavorites) {
      filtered = filtered.filter((playlist) => playlist.isDefault);
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "videoCount":
          aValue = a.videoCount;
          bValue = b.videoCount;
          break;
        case "playCount":
          aValue = a.playCount;
          bValue = b.playCount;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredPlaylists(filtered);
  }, [playlists, searchQuery, sortBy, sortOrder, showOnlyPublic, showOnlyFavorites]);

  const handlePlaylistCreated = (playlist: Playlist) => {
    setPlaylists((prev) => [playlist, ...prev]);
  };

  const handlePlaylistDelete = async (playlist: Playlist) => {
    // 这里需要实现删除播放列表的方法
    // await databaseService.deletePlaylist(playlist.id);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));
  };

  const handlePlaylistToggleFavorite = async (playlist: Playlist) => {
    // 这里需要实现切换收藏状态的方法
    // const updated = await databaseService.updatePlaylist(playlist.id, { 
    //   isDefault: !playlist.isDefault 
    // });
    // setPlaylists((prev) => 
    //   prev.map((p) => (p.id === playlist.id ? updated : p))
    // );
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <View className={`flex-1 bg-background ${className}`}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4 space-y-6">
          {/* 快速操作 */}
          <PlaylistQuickActions
            onPlaylistCreated={handlePlaylistCreated}
            onViewFavorites={() => setShowOnlyFavorites(!showOnlyFavorites)}
            onViewRecent={() => {
              setSortBy("createdAt");
              setSortOrder("desc");
            }}
            onViewAll={() => {
              setSearchQuery("");
              setShowOnlyPublic(false);
              setShowOnlyFavorites(false);
            }}
          />

          {/* 搜索和过滤 */}
          <View className="space-y-3">
            <View className="flex items-center gap-2">
              <View className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索播放列表..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="pl-10"
                />
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={() => setShowOnlyPublic(!showOnlyPublic)}
                className={showOnlyPublic ? "bg-blue-50 border-blue-200" : ""}
              >
                <Text className="text-xs">公开</Text>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={showOnlyFavorites ? "bg-red-50 border-red-200" : ""}
              >
                <Text className="text-xs">收藏</Text>
              </Button>
            </View>

            {/* 排序选项 */}
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <Text className="text-sm text-muted-foreground">排序:</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setSortBy("name")}
                  className={sortBy === "name" ? "bg-muted" : ""}
                >
                  <Text className="text-xs">名称</Text>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setSortBy("createdAt")}
                  className={sortBy === "createdAt" ? "bg-muted" : ""}
                >
                  <Text className="text-xs">创建时间</Text>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setSortBy("videoCount")}
                  className={sortBy === "videoCount" ? "bg-muted" : ""}
                >
                  <Text className="text-xs">视频数量</Text>
                </Button>
              </View>
              <Button
                variant="ghost"
                size="sm"
                onPress={toggleSort}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </View>
          </View>

          {/* 播放列表网格 */}
          <PlaylistGrid
            playlists={filteredPlaylists}
            onPlaylistDelete={handlePlaylistDelete}
            onPlaylistToggleFavorite={handlePlaylistToggleFavorite}
            loading={loading}
          />

          {/* 统计信息 */}
          {playlists.length > 0 && (
            <View className="bg-muted/50 rounded-lg p-4">
              <Text className="text-sm font-medium mb-2">统计信息</Text>
              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs text-muted-foreground">总播放列表</Text>
                  <Text className="text-lg font-semibold">{playlists.length}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted-foreground">公开播放列表</Text>
                  <Text className="text-lg font-semibold">
                    {playlists.filter((p) => p.isPublic).length}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-muted-foreground">总视频数</Text>
                  <Text className="text-lg font-semibold">
                    {playlists.reduce((sum, p) => sum + p.videoCount, 0)}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-muted-foreground">总时长</Text>
                  <Text className="text-lg font-semibold">
                    {Math.floor(playlists.reduce((sum, p) => sum + p.totalDuration, 0) / 3600)}h
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}