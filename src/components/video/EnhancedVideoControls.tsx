import type { Video as VideoType } from "@/db/schema";
import React from "react";
import { View } from "react-native";
import type { VideoPlayer as ExpoVideoPlayer } from "expo-video";
import { VideoProgressBar } from "./VideoProgressBar";
import { VideoControlButtons } from "./VideoControlButtons";
import { ControlsVisibilityManager, type ControlsVisibilityManagerRef } from "./ControlsVisibilityManager";

interface EnhancedVideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => Promise<void>;
  onMuteToggle: () => Promise<void>;
  onSeek: (time: number) => void;
  onRewind?: () => void;
  onForward?: () => void;
  isFullscreen?: boolean;
  showControls?: boolean;
  onShowControls?: () => void;
  // VideoActions 集成的 props
  video?: VideoType;
  player?: ExpoVideoPlayer | null;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export const EnhancedVideoControls = React.forwardRef<
  ControlsVisibilityManagerRef,
  EnhancedVideoControlsProps
>(
  (
    {
      isPlaying,
      isMuted,
      currentTime,
      duration,
      onPlayPause,
      onMuteToggle,
      onSeek,
      onRewind,
      onForward,
      isFullscreen = false,
      showControls = true,
      onShowControls,
      video,
      player,
      onFullscreenChange,
    },
    ref,
  ) => {
    const [sliderValue, setSliderValue] = React.useState(currentTime);
    const [isSeeking, setIsSeeking] = React.useState(false);
    const [displayTime, setDisplayTime] = React.useState(currentTime);

    React.useEffect(() => {
      if (!isSeeking) {
        setSliderValue(currentTime);
        setDisplayTime(currentTime);
      }
    }, [currentTime, isSeeking]);

    // 处理进度条触摸开始
    const handleProgressTouchStart = React.useCallback((event: any) => {
      setIsSeeking(true);
    }, []);

    // 处理进度条触摸移动
    const handleProgressTouchMove = React.useCallback((event: any) => {
      // 处理移动逻辑由 VideoProgressBar 内部处理
    }, []);

    // 处理进度条触摸结束
    const handleProgressTouchEnd = React.useCallback(() => {
      setIsSeeking(false);
      setSliderValue(displayTime);
    }, [displayTime]);

    // 处理进度条seek
    const handleProgressSeek = React.useCallback((time: number) => {
      setDisplayTime(time);
      onSeek(time);
    }, [onSeek]);

    const handleFullscreenToggle = React.useCallback(() => {
      onFullscreenChange?.(!isFullscreen);
    }, [isFullscreen, onFullscreenChange]);

    const handleControlsVisibleChange = React.useCallback((visible: boolean) => {
      // 可以在这里添加额外的控制栏显示逻辑
    }, []);

    return (
      <ControlsVisibilityManager
        ref={ref}
        isPlaying={isPlaying}
        showControls={showControls}
        onShowControls={onShowControls}
        onControlsVisibleChange={handleControlsVisibleChange}
      >
        {/* 底部控制栏 */}
        <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8">
          {/* 进度条 */}
          <VideoProgressBar
            currentTime={currentTime}
            duration={duration}
            displayTime={displayTime}
            isSeeking={isSeeking}
            onSeek={handleProgressSeek}
            onLayout={() => {}}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
          />

          {/* 控制按钮 */}
          <VideoControlButtons
            isPlaying={isPlaying}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            onPlayPause={onPlayPause}
            onMuteToggle={onMuteToggle}
            onRewind={onRewind}
            onForward={onForward}
            onFullscreenToggle={handleFullscreenToggle}
            video={video}
            player={player}
          />
        </View>
      </ControlsVisibilityManager>
    );
  },
);
