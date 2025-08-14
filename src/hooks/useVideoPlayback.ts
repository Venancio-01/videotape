import type { Video } from "@/db/schema";
import { useVideoStore } from "@/stores/videoStore";
import type { AVPlaybackStatus } from "expo-av";
import * as React from "react";

interface VideoPlaybackHookProps {
  video: Video;
  isVisible: boolean;
}

interface VideoPlaybackState {
  isPlaying: boolean;
  isMuted: boolean;
  playbackStatus: AVPlaybackStatus | null;
  videoRef: React.RefObject<any>;
}

interface VideoPlaybackActions {
  togglePlayPause: () => Promise<void>;
  toggleMute: () => Promise<void>;
  handlePlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
}

export const useVideoPlayback = ({
  video,
  isVisible,
}: VideoPlaybackHookProps): VideoPlaybackState & VideoPlaybackActions => {
  const videoRef = React.useRef<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [playbackStatus, setPlaybackStatus] =
    React.useState<AVPlaybackStatus | null>(null);
  const { updateVideo } = useVideoStore();

  React.useEffect(() => {
    if (!isVisible) {
      const saveProgress = async () => {
        if (videoRef.current && playbackStatus?.isLoaded) {
          const position = playbackStatus.positionMillis / 1000;
          try {
            await updateVideo(video.id, {
              watchProgress: position,
              playCount: video.playCount + 1,
              lastWatchedAt: new Date().toISOString(),
            });
          } catch (error) {
            console.error("Error saving progress:", error);
          }
        }
        videoRef.current?.pauseAsync();
        setIsPlaying(false);
      };
      saveProgress();
      return;
    }

    const loadAndPlay = async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.loadAsync(
            { uri: video.filePath },
            {
              shouldPlay: true,
              isMuted: true,
              progressUpdateIntervalMillis: 100,
              positionMillis: video.watchProgress * 1000,
            },
          );
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Error loading video:", error);
      }
    };

    loadAndPlay();

    return () => {
      videoRef.current?.unloadAsync();
    };
  }, [
    isVisible,
    video.filePath,
    video.watchProgress,
    video.playCount,
    video.id,
    updateVideo,
    playbackStatus,
  ]);

  const handlePlaybackStatusUpdate = React.useCallback(
    (status: AVPlaybackStatus) => {
      setPlaybackStatus(status);
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying);

        if (status.didJustFinish && status.isLooping) {
          videoRef.current?.replayAsync();
        }
      }
    },
    [],
  );

  const togglePlayPause = React.useCallback(async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  }, [isPlaying]);

  const toggleMute = React.useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return {
    isPlaying,
    isMuted,
    playbackStatus,
    videoRef,
    togglePlayPause,
    toggleMute,
    handlePlaybackStatusUpdate,
  };
};
