import { Text } from "@/components/ui/text";
import { formatDuration } from "@/utils/videoUtils";
import { TouchableOpacity, View } from "react-native";

interface VideoOverlayProps {
  video: {
    title?: string;
    duration?: unknown;
    fileSize?: unknown;
    playCount?: unknown;
  };
  onVideoPress?: () => void;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({
  video,
  onVideoPress,
}) => {
  return (
    <TouchableOpacity
      className="absolute inset-0 z-20"
      onPress={onVideoPress}
      activeOpacity={1}
    >
      {/* 视频信息显示在底部 */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        {video.title && (
          <Text className="text-white text-xl font-bold mb-2" numberOfLines={2}>
            {video.title}
          </Text>
        )}
        <View className="flex-row items-center gap-4">
          {video.duration && typeof video.duration === "number" && (
            <Text className="text-white/80 text-sm">
              {formatDuration(video.duration)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
