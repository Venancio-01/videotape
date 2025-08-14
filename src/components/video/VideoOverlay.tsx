import { Text } from "@/components/ui/text";
import { formatDuration, formatFileSize } from "@/utils/videoUtils";
import { View } from "react-native";

interface VideoOverlayProps {
  video: {
    title: string;
    duration: number;
    fileSize: number;
    playCount: number;
  };
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({ video }) => {
  return (
    <View className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
      <Text className="text-white text-xl font-bold mb-2" numberOfLines={2}>
        {video.title}
      </Text>
      <View className="flex-row items-center gap-4">
        <Text className="text-white/80 text-sm">
          {formatDuration(video.duration)}
        </Text>
        <Text className="text-white/80 text-sm">
          {formatFileSize(video.fileSize)}
        </Text>
        {video.playCount > 0 && (
          <Text className="text-white/80 text-sm">
            播放 {video.playCount} 次
          </Text>
        )}
      </View>
    </View>
  );
};
