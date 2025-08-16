import { VideoView, useVideoPlayer } from "expo-video";
import { Dimensions, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface VideoPlayerProps {
  video: {
    filePath?: string;
  };
  player: any;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  player,
  onFullscreenChange,
}) => {
  return (
    <View className="flex-1 relative">
      <VideoView
        player={player}
        style={{ width, height }}
        contentFit="contain"
        allowsFullscreen={true}
        nativeControls={false}
        onFullscreenEnter={() => onFullscreenChange?.(true)}
        onFullscreenExit={() => onFullscreenChange?.(false)}
      />
    </View>
  );
};
