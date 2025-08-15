import type { VideoPlaybackState } from "@/hooks/useVideoPlayback";
import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { Dimensions, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface VideoPlayerProps {
  video: {
    filePath: string;
  };
  playback: VideoPlaybackState & {
    handlePlaybackStatusUpdate: (status: any) => void;
  };
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  playback,
}) => {
  return (
    <View className="flex-1 relative">
      <ExpoVideo
        ref={playback.videoRef}
        source={{ uri: video.filePath }}
        style={{ width, height }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={true}
        isMuted={playback.isMuted}
        useNativeControls={false}
        onPlaybackStatusUpdate={playback.handlePlaybackStatusUpdate}
      />
    </View>
  );
};
