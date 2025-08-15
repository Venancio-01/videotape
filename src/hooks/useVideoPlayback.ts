import type { Video } from "@/db/schema";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useVideoStore } from "@/stores/videoStore";
import type { AVPlaybackStatus } from "expo-av";
import type { Video as ExpoVideo } from "expo-av";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface VideoPlaybackHookProps {
  video: Video;
  isVisible: boolean;
}

export interface VideoPlaybackState {
  isPlaying: boolean;
  isMuted: boolean;
  playbackStatus: AVPlaybackStatus | null;
  videoRef: RefObject<ExpoVideo | null>;
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
  const videoRef = useRef<ExpoVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(
    null,
  );

  // 使用统一的播放状态管理
  const { play, pause, setMuted } = usePlaybackStore();
  const isMuted = usePlaybackStore((state) => state.isMuted);

  // 获取视频更新函数
  const { updateVideo } = useVideoStore();

  useEffect(() => {
    if (!isVisible) {
      const saveProgress = async () => {
        if (videoRef.current && playbackStatus?.isLoaded) {
          const position = playbackStatus.positionMillis / 1000;
          try {
            pause(); // 暂停全局播放状态

            // 更新视频观看进度
            if (video.id) {
              updateVideo(video.id, {
                watchProgress: position,
                playCount: (video.playCount || 0) + 1,
                lastWatchedAt: new Date().toISOString(),
              });
            }
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
        console.log("尝试使用原始路径...");
        if (videoRef.current) {
          await videoRef.current.loadAsync(
            { uri: video.filePath },
            {
              shouldPlay: true,
              isMuted: true,
              progressUpdateIntervalMillis: 100,
              positionMillis: (video.watchProgress || 0) * 1000,
            },
          );
          setIsPlaying(true);
          console.log("原始路径加载成功");
        }
      } catch (finalError) {
        console.error("所有加载方式都失败:", finalError);
        // 不要抛出错误，让用户界面保持可用
      }
    };

    loadAndPlay();

    return () => {
      videoRef.current?.unloadAsync();
    };
  }, [isVisible, video.filePath, video.watchProgress, video.id]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    setPlaybackStatus(status);
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish && status.isLooping) {
        videoRef.current?.replayAsync();
      }
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        pause(); // 更新全局状态
      } else {
        await videoRef.current.playAsync();
        play(); // 更新全局状态
      }
    }
  }, [isPlaying, play, pause]);

  const toggleMute = useCallback(async () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      await videoRef.current.setIsMutedAsync(newMutedState);
      setMuted(newMutedState); // 更新全局状态
    }
  }, [isMuted, setMuted]);

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
