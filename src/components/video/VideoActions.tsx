import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Volume2,
  VolumeX,
} from "@/components/Icons";
import type { Video as VideoType } from "@/db/schema";
import { useUIStore } from "@/stores";
import * as ScreenOrientation from "expo-screen-orientation";
import type React from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import { ControlButton } from "./ControlButton";

interface VideoActionsProps {
  video: VideoType;
  player?: any;
  isMuted?: boolean;
  isFullscreen?: boolean;
  onMuteToggle?: () => Promise<void>;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export const VideoActions: React.FC<VideoActionsProps> = ({
  video,
  player,
  isMuted = false,
  isFullscreen = false,
  onMuteToggle,
  onFullscreenChange,
}) => {
  const { toggleScreenOrientation } = useUIStore();

  // 组件卸载时不再强制恢复竖屏，让用户保持当前选择的方向

  const onFullscreenToggle = async () => {
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
      } catch (error) {
        console.error("Failed to toggle fullscreen:", error);
      }
    }
  };

  return (
    <View className="absolute right-4 top-0 bottom-0 justify-center items-center z-25">
      <View className="flex-col gap-4">
        {!isFullscreen && (
          <>
            <ControlButton
              onPress={onMuteToggle}
              icon={
                isMuted ? (
                  <VolumeX className="text-white" size={24} />
                ) : (
                  <Volume2 className="text-white" size={24} />
                )
              }
            />

            {/* 屏幕方向切换按钮 */}
            <ControlButton
              onPress={toggleScreenOrientation}
              icon={<RotateCcw className="text-white" size={24} />}
            />
          </>
        )}

        {/* 全屏按钮 - 在全屏模式下显示方向控制按钮 */}
        {isFullscreen ? (
          <ControlButton
            onPress={toggleScreenOrientation}
            icon={<RotateCcw className="text-white" size={24} />}
          />
        ) : null}

        <ControlButton
          onPress={onFullscreenToggle}
          icon={
            isFullscreen ? (
              <Minimize2 className="text-white" size={24} />
            ) : (
              <Maximize2 className="text-white" size={24} />
            )
          }
          isActive={isFullscreen}
        />
      </View>
    </View>
  );
};
