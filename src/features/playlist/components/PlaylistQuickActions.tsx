import { View } from "react-native";
import { Plus, List, Heart, Star, Clock, Users } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import type { Playlist } from "@/db/schema";

interface PlaylistQuickActionsProps {
  onPlaylistCreated?: (playlist: Playlist) => void;
  onCreateNew?: () => void;
  onViewAll?: () => void;
  onViewFavorites?: () => void;
  onViewRecent?: () => void;
  className?: string;
}

export function PlaylistQuickActions({
  onPlaylistCreated,
  onCreateNew,
  onViewAll,
  onViewFavorites,
  onViewRecent,
  className = "",
}: PlaylistQuickActionsProps) {
  const router = useRouter();

  const handleCreateNew = () => {
    router.push("/playlist/create");
  };

  const quickActions = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: "新建播放列表",
      color: "bg-blue-500",
      onPress: handleCreateNew,
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: "收藏夹",
      color: "bg-red-500",
      onPress: onViewFavorites,
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "最近播放",
      color: "bg-green-500",
      onPress: onViewRecent,
    },
    {
      icon: <List className="w-5 h-5" />,
      label: "所有播放列表",
      color: "bg-purple-500",
      onPress: onViewAll,
    },
  ];

  return (
    <View className={`space-y-4 ${className}`}>
      {/* 快速操作按钮 */}
      <View className="flex-row flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            onPress={action.onPress}
            className="flex-1 min-w-[140px] h-20"
          >
            <View className="flex items-center gap-2">
              <View className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center`}>
                <View className="text-white">
                  {action.icon}
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-center">
                  {action.label}
                </Text>
              </View>
            </View>
          </Button>
        ))}
      </View>

      {/* 快速提示 */}
      <View className="bg-muted/50 rounded-lg p-3">
        <View className="flex items-start gap-2">
          <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
          <View className="flex-1">
            <Text className="text-sm font-medium mb-1">快速提示</Text>
            <Text className="text-xs text-muted-foreground">
              • 创建播放列表来组织您的视频内容
            </Text>
            <Text className="text-xs text-muted-foreground">
              • 将播放列表设为公开以与其他用户分享
            </Text>
            <Text className="text-xs text-muted-foreground">
              • 使用描述字段来帮助识别播放列表内容
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
