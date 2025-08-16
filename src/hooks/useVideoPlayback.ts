import type { Video as VideoType } from "@/db/schema";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useVideoStore } from "@/stores/videoStore";
import { AudioModule } from "expo-audio";
import { useVideoPlayer } from "expo-video";
import {
  useCallback,
  useEffect,
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
  player: any;
}

interface VideoPlaybackActions {
  togglePlayPause: () => Promise<void>;
  toggleMute: () => Promise<void>;
}

export const useVideoPlayback = ({
  video,
  isVisible,
}: VideoPlaybackHookProps): VideoPlaybackState & VideoPlaybackActions => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasPlayingBeforeBackground, setWasPlayingBeforeBackground] =
    useState(false);

  const player = useVideoPlayer(video.filePath, (player) => {
    player.loop = true;
    player.muted = usePlaybackStore.getState().isMuted;
  });

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
          player.pause();
          setIsPlaying(false);
          pause(); // 更新全局状态
        }
      } else if (nextAppState === "active") {
        // 应用回到前台
        if (wasPlayingBeforeBackground && isVisible) {
          player.play();
          setIsPlaying(true);
          play(); // 更新全局状态
          setWasPlayingBeforeBackground(false);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isPlaying, isVisible, wasPlayingBeforeBackground, play, pause, player]);

  useEffect(() => {
    if (!isVisible) {
      const saveProgress = async () => {
        try {
          pause(); // 暂停全局播放状态
          
          // 更新视频观看进度
          if (video.id) {
            updateVideo(video.id, {
              watchProgress: player.currentTime,
              playCount: (video.playCount || 0) + 1,
              lastWatchedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error saving progress:", error);
        }

        player.pause();
        setIsPlaying(false);
      };
      saveProgress();
      return;
    }

    const loadAndPlay = async () => {
      try {
        // 配置音频会话以启用音频播放
        await AudioModule.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: 'doNotMix',
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: 'doNotMix',
          playThroughEarpieceAndroid: false,
        });

        // 设置播放位置并开始播放
        player.currentTime = video.watchProgress || 0;
        player.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("加载视频失败:", error);
        // 不要抛出错误，让用户界面保持可用
      }
    };

    loadAndPlay();
  }, [isVisible, video.filePath, video.watchProgress, video.id, player]);

  // 监听播放状态变化
  useEffect(() => {
    const subscription = player.addListener('playingChange', (event) => {
      const isPlaying = event.isPlaying;
      setIsPlaying(isPlaying);
      if (isPlaying) {
        play();
      } else {
        pause();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, play, pause]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      player.pause();
      pause(); // 更新全局状态
    } else {
      player.play();
      play(); // 更新全局状态
    }
  }, [isPlaying, play, pause, player]);

  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    player.muted = newMutedState;
    setMuted(newMutedState); // 更新全局状态
  }, [isMuted, setMuted, player]);

  return {
    isPlaying,
    isMuted,
    player,
    togglePlayPause,
    toggleMute,
  };
};
