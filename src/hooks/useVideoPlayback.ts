import type { Video as VideoType } from "@/db/schema";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useVideoStore } from "@/stores/videoStore";
import { Audio, Video } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

interface VideoPlaybackHookProps {
  video: VideoType;
  isVisible: boolean;
}

export interface VideoPlaybackState {
  isPlaying: boolean;
  isMuted: boolean;
  playbackStatus: AVPlaybackStatus | null;
  videoRef: RefObject<Video | null>;
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
  const videoRef = useRef<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(
    null,
  );
  const [wasPlayingBeforeBackground, setWasPlayingBeforeBackground] =
    useState(false);

  // 使用统一的播放状态管理
  const { play, pause, setMuted } = usePlaybackStore();
  const isMuted = usePlaybackStore((state) => state.isMuted);

  // 获取视频更新函数
  const { updateVideo } = useVideoStore();

  // 监听应用状态变化
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        // 应用进入后台或非活跃状态
        if (isPlaying && isVisible) {
          setWasPlayingBeforeBackground(true);
          videoRef.current?.pauseAsync();
          setIsPlaying(false);
          pause(); // 更新全局状态
        }
      } else if (nextAppState === "active") {
        // 应用回到前台
        if (wasPlayingBeforeBackground && isVisible) {
          videoRef.current?.playAsync();
          setIsPlaying(true);
          play(); // 更新全局状态
          setWasPlayingBeforeBackground(false);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isPlaying, isVisible, wasPlayingBeforeBackground, play, pause]);

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
        // 如果视频正在全屏播放，先退出全屏
        try {
          if (videoRef.current) {
            const status = await videoRef.current.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              await videoRef.current.dismissFullscreenPlayer();
            }
          }
        } catch (error) {
          console.error("Error dismissing fullscreen:", error);
        }

        videoRef.current?.pauseAsync();
        setIsPlaying(false);
      };
      saveProgress();
      return;
    }

    const loadAndPlay = async () => {
      try {
        // 配置音频会话以启用音频播放
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
          playThroughEarpieceAndroid: false,
        });

        if (videoRef.current) {
          await videoRef.current.loadAsync(
            { uri: video.filePath },
            {
              shouldPlay: true,
              isMuted: isMuted,
              progressUpdateIntervalMillis: 100,
              positionMillis: (video.watchProgress || 0) * 1000,
            },
          );
          setIsPlaying(true);
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
