import { Clock, FolderOpen, Play, Trash2 } from "@/components/Icons";
import { Text } from "@/components/ui/text";
import type { Playlist } from "@/db/schema";
import * as React from "react";
import { TouchableOpacity, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

interface PlaylistCardProps {
  playlist: Playlist;
  isBusy: boolean;
  onPlay: (playlist: Playlist) => void;
  onDelete: (playlist: Playlist) => void;
  onSetCurrent: (playlist: Playlist) => void;
  isCurrent: boolean;
}

const styles = {
  rightAction: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  swipeableContainer: {
    marginBottom: 16,
  },
};

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  isBusy,
  onPlay,
  onDelete,
  onSetCurrent,
  isCurrent,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const swipeableRef = React.useRef<Swipeable>(null);

  const renderRightActions = () => {
    return (
      <RectButton
        style={[
          styles.rightAction,
          { backgroundColor: "hsl(var(--destructive))" },
        ]}
        onPress={handleDelete}
        disabled={isDeleting}
      >
        <View className="items-center">
          <Trash2 className="w-6 h-6 text-destructive-foreground mb-1" />
          <Text className="text-xs text-destructive-foreground font-medium">
            {isDeleting ? "删除中..." : "删除"}
          </Text>
        </View>
      </RectButton>
    );
  };

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(playlist);

    // 延迟重置状态，让删除动画完成
    setTimeout(() => {
      setIsDeleting(false);
      swipeableRef.current?.close();
    }, 500);
  };

  const handleSwipeableOpen = (direction: string) => {
    // 右滑打开时可以添加额外的逻辑
    if (direction === "right") {
      // 可以在这里添加振动反馈等
    }
  };

  const handleSwipeableClose = (direction: string) => {
    // 滑动关闭时的逻辑
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}`;
    }
    return `${minutes}分钟`;
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeableOpen}
      onSwipeableClose={handleSwipeableClose}
      rightThreshold={80}
      friction={2}
      overshootRight={false}
      containerStyle={styles.swipeableContainer}
    >
      <TouchableOpacity
        className={`bg-card rounded-2xl p-5 border-2 shadow-lg ${
          isCurrent ? "border-primary bg-primary/5" : "border-border"
        } ${isDeleting ? "opacity-50" : ""}`}
        onPress={() => onSetCurrent(playlist)}
        disabled={isBusy || isDeleting}
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-xl font-bold text-foreground flex-1">
                {playlist.name}
              </Text>
              {isCurrent && (
                <View className="bg-primary/20 px-2 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-primary">
                    当前播放
                  </Text>
                </View>
              )}
            </View>
            {playlist.description && (
              <Text className="text-muted-foreground text-sm mb-2 leading-relaxed">
                {playlist.description}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onPlay(playlist);
            }}
            disabled={isBusy || isDeleting}
            className="bg-primary/10 p-2 rounded-full"
          >
            {isBusy ? (
              <View className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-5 h-5 text-primary" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <Text className="text-sm text-muted-foreground font-medium">
                {playlist.videoCount || 0} 个视频
              </Text>
            </View>
            {playlist.totalDuration && playlist.totalDuration > 0 && (
              <View className="flex-row items-center gap-1.5">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Text className="text-sm text-muted-foreground font-medium">
                  {formatDuration(playlist.totalDuration)}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-muted-foreground">
            {new Date(playlist.createdAt).toLocaleDateString("zh-CN")}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default PlaylistCard;
