import { Text } from "@/components/ui/text";
import { formatDuration } from "@/utils/videoUtils";
import { View } from "react-native";

interface VideoOverlayProps {
  video: {
    title?: string;
    duration?: number;
    fileSize?: number;
    playCount?: number;
  };
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({ video }) => {
  return (
    <View className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-15">
      {video.title && (
        <Text className="text-white text-xl font-bold mb-2" numberOfLines={2}>
          {video.title}
        </Text>
      )}
      <View className="flex-row items-center gap-4">
        {video.duration && (
          <Text className="text-white/80 text-sm">
            {formatDuration(video.duration)}
          </Text>
        )}
      </View>
    </View>
  );
};
