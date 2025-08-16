import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from "@/components/Icons";
import type { Video as VideoType } from "@/db/schema";
import { useUIStore } from "@/stores";
import * as ScreenOrientation from "expo-screen-orientation";
import type { VideoPlayer as ExpoVideoPlayer } from "expo-video";
import type React from "react";
import { TouchableOpacity, View } from "react-native";

interface VideoControlButtonsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onRewind?: () => void;
  onForward?: () => void;
  onFullscreenToggle: () => void;
  video?: VideoType;
  player?: ExpoVideoPlayer | null;
}

const handleControlPress = (event: any, callback: () => void) => {
  event?.stopPropagation?.();
  callback();
};

export const VideoControlButtons: React.FC<VideoControlButtonsProps> = ({
  isPlaying,
  isMuted,
  isFullscreen,
  onPlayPause,
  onMuteToggle,
  onRewind,
  onForward,
  onFullscreenToggle,
  video,
  player,
}) => {
  const { toggleScreenOrientation } = useUIStore();

  const handleFullscreenToggle = async () => {
    if (player) {
      try {
        const newFullscreenState = !isFullscreen;

        if (isFullscreen) {
          // 退出全屏时恢复到用户之前的方向偏好
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT,
          );
        } else {
          // 进入全屏时切换到横屏
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE,
          );
        }

        onFullscreenToggle();
      } catch (error) {
        console.error("Failed to toggle fullscreen:", error);
      }
    }
  };

  return (
    <View className="flex-row items-center justify-between">
      {/* 左侧控制 */}
      <View className="flex-row items-center space-x-4">
        {onRewind && (
          <TouchableOpacity
            onPress={(event) => handleControlPress(event, onRewind)}
            activeOpacity={0.8}
            className="p-2"
          >
            <Rewind className="text-white" size={24} />
          </TouchableOpacity>
        )}
        {onForward && (
          <TouchableOpacity
            onPress={(event) => handleControlPress(event, onForward)}
            activeOpacity={0.8}
            className="p-2"
          >
            <SkipForward className="text-white" size={24} />
          </TouchableOpacity>
        )}
      </View>

      {/* 中央播放按钮 */}
      <TouchableOpacity
        onPress={(event) => handleControlPress(event, onPlayPause)}
        activeOpacity={0.8}
        className="p-1"
      >
        <View className="bg-white rounded-full p-3 items-center justify-center">
          {isPlaying ? (
            <Pause className="text-black" size={24} />
          ) : (
            <Play className="text-black" size={24} fill="black" />
          )}
        </View>
      </TouchableOpacity>

      {/* 右侧控制 */}
      <View className="flex-row items-center space-x-4">
        {/* 右侧操作按钮（VideoActions 功能） */}
        {video && (
          <View className="flex-row items-center space-x-4">
            {!isFullscreen && (
              <>
                {/* 静音按钮 */}
                <TouchableOpacity
                  onPress={(event) => handleControlPress(event, onMuteToggle)}
                  activeOpacity={0.8}
                  className="p-2"
                >
                  {isMuted ? (
                    <VolumeX className="text-white" size={24} />
                  ) : (
                    <Volume2 className="text-white" size={24} />
                  )}
                </TouchableOpacity>

                {/* 屏幕方向切换按钮 */}
                <TouchableOpacity
                  onPress={(event) =>
                    handleControlPress(event, toggleScreenOrientation)
                  }
                  activeOpacity={0.8}
                  className="p-2"
                >
                  <RotateCcw className="text-white" size={24} />
                </TouchableOpacity>
              </>
            )}

            {/* 全屏按钮 - 在全屏模式下显示方向控制按钮 */}
            {isFullscreen ? (
              <TouchableOpacity
                onPress={(event) =>
                  handleControlPress(event, toggleScreenOrientation)
                }
                activeOpacity={0.8}
                className="p-2"
              >
                <RotateCcw className="text-white" size={24} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={(event) =>
                handleControlPress(event, handleFullscreenToggle)
              }
              activeOpacity={0.8}
              className="p-2"
            >
              {isFullscreen ? (
                <Minimize2 className="text-white" size={24} />
              ) : (
                <Maximize2 className="text-white" size={24} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};
