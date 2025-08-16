import type { VideoPlaybackState } from "@/hooks/useVideoPlayback";
import { Video, ResizeMode, VideoFullscreenUpdate } from "expo-av";
import { Dimensions, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface VideoPlayerProps {
  video: {
    filePath?: string;
  };
  playback: VideoPlaybackState & {
    handlePlaybackStatusUpdate: (status: any) => void;
  };
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  playback,
  onFullscreenChange,
}) => {
  return (
    <View className="flex-1 relative">
      <Video
        ref={playback.videoRef}
        source={{ uri: video.filePath }}
        style={{ width, height }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping={true}
        isMuted={playback.isMuted}
        useNativeControls={false}
        onPlaybackStatusUpdate={playback.handlePlaybackStatusUpdate}
        onFullscreenUpdate={(event) => {
          switch (event.fullscreenUpdate) {
            case VideoFullscreenUpdate.PLAYER_WILL_PRESENT:
              break;
            case VideoFullscreenUpdate.PLAYER_DID_PRESENT:
              onFullscreenChange?.(true);
              break;
            case VideoFullscreenUpdate.PLAYER_WILL_DISMISS:
              break;
            case VideoFullscreenUpdate.PLAYER_DID_DISMISS:
              onFullscreenChange?.(false);
              break;
          }
        }}
      />
    </View>
  );
};
