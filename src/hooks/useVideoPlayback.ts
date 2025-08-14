import type { Video } from "@/db/schema";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { useVideoStore } from "@/stores/videoStore";
import { AndroidPermissionHelper } from "@/utils/androidPermissionHelper";
import type { AVPlaybackStatus } from "expo-av";
import type { Video as ExpoVideo } from "expo-av";
import * as React from "react";

interface VideoPlaybackHookProps {
  video: Video;
  isVisible: boolean;
}

interface VideoPlaybackState {
  isPlaying: boolean;
  isMuted: boolean;
  playbackStatus: AVPlaybackStatus | null;
  videoRef: React.RefObject<ExpoVideo | null>;
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
  const videoRef = React.useRef<ExpoVideo | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [playbackStatus, setPlaybackStatus] =
    React.useState<AVPlaybackStatus | null>(null);
  const [cachedVideoUri, setCachedVideoUri] = React.useState<string | null>(
    null,
  );
  const { updateVideo } = useVideoStore();
  const { requestAllPermissions } = useMediaPermissions();
  const permissionHelper = AndroidPermissionHelper.getInstance();

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
        // 检查并请求权限
        const hasPermission = await requestAllPermissions();
        if (!hasPermission) {
          console.error("缺少媒体访问权限");
          return;
        }

        // 获取可访问的 URI
        const accessibleUri = await permissionHelper.getAccessibleUri(
          video.filePath,
        );

        if (videoRef.current) {
          await videoRef.current.loadAsync(
            { uri: accessibleUri },
            {
              shouldPlay: true,
              isMuted: true,
              progressUpdateIntervalMillis: 100,
              positionMillis: (video.watchProgress || 0) * 1000,
            },
          );
          setIsPlaying(true);
          setCachedVideoUri(accessibleUri);
        }
      } catch (error) {
        console.error("Error loading video:", error);
        // 如果直接访问失败，尝试缓存文件
        try {
          const cachedUri = await permissionHelper.cacheVideoFile(
            video.filePath,
          );
          if (videoRef.current && cachedUri) {
            await videoRef.current.loadAsync(
              { uri: cachedUri },
              {
                shouldPlay: true,
                isMuted: true,
                progressUpdateIntervalMillis: 100,
                positionMillis: (video.watchProgress || 0) * 1000,
              },
            );
            setIsPlaying(true);
            setCachedVideoUri(cachedUri);
          }
        } catch (cacheError) {
          console.error("Error caching and loading video:", cacheError);
        }
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
