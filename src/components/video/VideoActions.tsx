import { Text } from "@/components/ui/text";
import type { Video } from "@/db/schema";
import { Heart, Volume2, VolumeX, Maximize2, Minimize2, RotateCcw } from "lucide-react-native";
import React from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { Animated, TouchableOpacity, View } from "react-native";
import { ControlButton } from "./ControlButton";
import { useUIStore, useScreenOrientation } from "@/stores";

interface VideoActionsProps {
  video: Video;
  videoRef?: React.RefObject<any>;
  isMuted?: boolean;
  onMuteToggle?: () => Promise<void>;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onFullscreenStateChange?: (isFullscreen: boolean) => void;
}

export const VideoActions: React.FC<VideoActionsProps> = ({ video, videoRef, isMuted = false, onMuteToggle, onFullscreenChange, onFullscreenStateChange }) => {
  const [isLiked, setIsLiked] = React.useState(video.isFavorite);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const likeAnimation = React.useRef(new Animated.Value(1)).current;

  // 使用UI store中的屏幕方向状态
  const screenOrientation = useScreenOrientation();
  const { toggleScreenOrientation } = useUIStore();

  React.useEffect(() => {
    setIsLiked(video.isFavorite);
  }, [video.isFavorite]);

  // 监听全屏状态变化
  React.useEffect(() => {
    onFullscreenStateChange?.(isFullscreen);
  }, [isFullscreen, onFullscreenStateChange]);

  // 组件卸载时不再强制恢复竖屏，让用户保持当前选择的方向

  const onLike = () => {
    setIsLiked(!isLiked);

    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onFullscreenToggle = async () => {
    if (videoRef.current) {
      try {
        const newFullscreenState = !isFullscreen;
        if (isFullscreen) {
          // 退出全屏时不再强制恢复竖屏，保持用户当前选择的方向
          await videoRef.current.dismissFullscreenPlayer();
        } else {
          // 进入全屏时切换到横屏
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          await videoRef.current.presentFullscreenPlayer();
        }

        setIsFullscreen(newFullscreenState);
        onFullscreenChange?.(newFullscreenState);
      } catch (error) {
        console.error("Failed to toggle fullscreen:", error);
      }
    }
  };

  return (
    <View className="absolute right-4 bottom-24 gap-4 z-20">
      {!isFullscreen && (
        <>
          <View className="items-center">
            <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
              <TouchableOpacity onPress={onLike} className="items-center">
                <View
                  className={`
                    bg-black/50 rounded-full p-3 mb-1 transition-colors
                    ${isLiked ? 'bg-red-500/50' : ''}
                  `}
                >
                  <Heart
                    className={isLiked ? "text-red-500" : "text-white"}
                    size={24}
                    fill={isLiked ? "hsl(var(--destructive))" : "none"}
                  />
                </View>
                <Text className="text-white text-xs">
                  {isLiked ? "已收藏" : "收藏"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <ControlButton
            onPress={onMuteToggle}
            icon={
              isMuted ? (
                <VolumeX className="text-white" size={24} />
              ) : (
                <Volume2 className="text-white" size={24} />
              )
            }
            text={isMuted ? "静音" : "有声"}
          />

          {/* 屏幕方向切换按钮 */}
          <ControlButton
            onPress={toggleScreenOrientation}
            icon={
              <RotateCcw className="text-white" size={24} />
            }
          />
        </>
      )}

      {/* 全屏按钮 - 在全屏模式下显示方向控制按钮 */}
      {isFullscreen ? (
        <ControlButton
          onPress={toggleScreenOrientation}
          icon={
            <RotateCcw className="text-white" size={24} />
          }
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
        text={isFullscreen ? "退出全屏" : "全屏"}
        isActive={isFullscreen}
      />
    </View>
  );
};
