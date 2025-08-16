import { Play } from "@/components/Icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface VideoControlsProps {
  isPlaying: boolean;
  onPlayPause: () => Promise<void>;
  isFullscreen?: boolean;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  onPlayPause,
  isFullscreen = false,
}) => {
  return (
    <>
      {/* 中央播放按钮 - 只在暂停时显示，非全屏状态 */}
      {!isPlaying && !isFullscreen && (
        <TouchableOpacity
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          onPress={onPlayPause}
          activeOpacity={0.8}
        >
          <View className="bg-black/50 rounded-full p-4">
            <Play className="text-white" size={48} fill="white" />
          </View>
        </TouchableOpacity>
      )}

      {/* 播放中的点击区域 - 避开右侧按钮区域，非全屏状态 */}
      {isPlaying && !isFullscreen && (
        <TouchableOpacity
          className="absolute left-0 right-20 top-0 bottom-0 z-10"
          onPress={onPlayPause}
          activeOpacity={0.8}
        />
      )}
    </>
  );
};
