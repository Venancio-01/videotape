import { View, StyleSheet } from "react-native";
import {
  Heart,
  Play,
  Clock,
  Users,
  MoreVertical,
  Edit,
  Trash2,
} from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { Playlist } from "@/db/schema";

interface PlaylistCardProps {
  playlist: Playlist;
  onPress?: () => void;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  showActions?: boolean;
  className?: string;
}

export function PlaylistCard({
  playlist,
  onPress,
  onPlay,
  onEdit,
  onDelete,
  onToggleFavorite,
  showActions = true,
  className = "",
}: PlaylistCardProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "今天";
    if (diffDays === 2) return "昨天";
    if (diffDays <= 7) return `${diffDays} 天前`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} 周前`;
    return `${Math.floor(diffDays / 30)} 月前`;
  };

  return (
    <View
      className={`bg-card rounded-lg border border-border p-4 ${className}`}
    >
      {/* 主要内容 */}
      <View className="flex-1">
        {/* 头部信息 */}
        <View className="flex items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-semibold mb-1" numberOfLines={2}>
              {playlist.name}
            </Text>
            <View className="flex items-center gap-4">
              <View className="flex items-center gap-1">
                <Play className="w-3 h-3 text-muted-foreground" />
                <Text className="text-xs text-muted-foreground">
                  {playlist.videoCount} 个视频
                </Text>
              </View>
              <View className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <Text className="text-xs text-muted-foreground">
                  {formatDuration(playlist.totalDuration)}
                </Text>
              </View>
            </View>
          </View>

          {/* 公开/私密标识 */}
          {playlist.isPublic && (
            <View className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
              <Users className="w-3 h-3 text-green-600" />
              <Text className="text-xs text-green-600">公开</Text>
            </View>
          )}
        </View>

        {/* 描述信息 */}
        {playlist.description && (
          <Text
            className="text-sm text-muted-foreground mb-3"
            numberOfLines={2}
          >
            {playlist.description}
          </Text>
        )}

        {/* 统计信息 */}
        <View className="flex items-center gap-4 mb-3">
          <View className="flex items-center gap-1">
            <Play className="w-3 h-3 text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">
              {playlist.playCount} 次播放
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            {formatDate(playlist.createdAt)}
          </Text>
        </View>

        {/* 标签 */}
        {playlist.tags && playlist.tags.length > 0 && (
          <View className="flex flex-wrap gap-1 mb-3">
            {playlist.tags.slice(0, 3).map((tag, index) => (
              <View key={index} className="bg-muted px-2 py-1 rounded-full">
                <Text className="text-xs text-muted-foreground">#{tag}</Text>
              </View>
            ))}
            {playlist.tags.length > 3 && (
              <View className="bg-muted px-2 py-1 rounded-full">
                <Text className="text-xs text-muted-foreground">
                  +{playlist.tags.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 操作按钮 */}
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onPress={onPlay}
              className="flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              <Text className="text-xs">播放</Text>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onPress={onToggleFavorite}
              className="flex items-center gap-1"
            >
              <Heart
                className={`w-3 h-3 ${playlist.isDefault ? "text-red-500" : "text-muted-foreground"}`}
              />
            </Button>
          </View>

          {showActions && (
            <View className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onPress={onEdit}
                className="p-1"
              >
                <Edit className="w-3 h-3 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={onDelete}
                className="p-1"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

interface PlaylistGridProps {
  playlists: Playlist[];
  onPlaylistPress?: (playlist: Playlist) => void;
  onPlaylistPlay?: (playlist: Playlist) => void;
  onPlaylistEdit?: (playlist: Playlist) => void;
  onPlaylistDelete?: (playlist: Playlist) => void;
  onPlaylistToggleFavorite?: (playlist: Playlist) => void;
  showActions?: boolean;
  className?: string;
}

export function PlaylistGrid({
  playlists,
  onPlaylistPress,
  onPlaylistPlay,
  onPlaylistEdit,
  onPlaylistDelete,
  onPlaylistToggleFavorite,
  showActions = true,
  className = "",
}: PlaylistGridProps) {
  if (playlists.length === 0) {
    return (
      <View className={`flex items-center justify-center py-12 ${className}`}>
        <View className="items-center">
          <Text className="text-lg font-medium mb-2">暂无播放列表</Text>
          <Text className="text-muted-foreground text-center">
            创建您的第一个播放列表来开始组织视频
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`space-y-4 ${className}`}>
      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          onPress={() => onPlaylistPress?.(playlist)}
          onPlay={() => onPlaylistPlay?.(playlist)}
          onEdit={() => onPlaylistEdit?.(playlist)}
          onDelete={() => onPlaylistDelete?.(playlist)}
          onToggleFavorite={() => onPlaylistToggleFavorite?.(playlist)}
          showActions={showActions}
        />
      ))}
    </View>
  );
}
