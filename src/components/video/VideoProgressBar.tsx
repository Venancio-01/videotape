import React from "react";
import { Animated, Text, View } from "react-native";

interface VideoProgressBarProps {
  currentTime: number;
  duration: number;
  displayTime: number;
  isSeeking: boolean;
  onSeek: (time: number) => void;
  onLayout: (event: any) => void;
  onTouchStart: (event: any) => void;
  onTouchMove: (event: any) => void;
  onTouchEnd: () => void;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const VideoProgressBar: React.FC<VideoProgressBarProps> = ({
  currentTime,
  duration,
  displayTime,
  isSeeking,
  onSeek,
  onLayout,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) => {
  const progressAnimatedValue = React.useRef(new Animated.Value(0)).current;
  const progressWidth = React.useRef(0);
  const [progressPosition, setProgressPosition] = React.useState({
    x: 0,
    width: 0,
  });

  // 更新进度条动画
  const updateProgressBar = React.useCallback(
    (time: number) => {
      if (duration > 0) {
        const progress = (time / duration) * 100;
        Animated.timing(progressAnimatedValue, {
          toValue: progress,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }
    },
    [duration, progressAnimatedValue],
  );

  // 处理进度条布局
  const handleProgressLayout = React.useCallback(
    (event: any) => {
      const { x, width } = event.nativeEvent.layout;
      setProgressPosition({ x, width });
      progressWidth.current = width;
      onLayout(event);
      updateProgressBar(currentTime);
    },
    [currentTime, onLayout, updateProgressBar],
  );

  // 计算触摸位置对应的时间
  const calculateTimeFromPosition = React.useCallback(
    (touchX: number): number => {
      if (progressWidth.current === 0) return currentTime;

      const relativeX = touchX - progressPosition.x;
      const clampedX = Math.max(0, Math.min(relativeX, progressWidth.current));
      const progress = clampedX / progressWidth.current;

      return Math.max(0, Math.min(progress * duration, duration));
    },
    [currentTime, duration, progressPosition.x],
  );

  // 处理进度条触摸开始
  const handleProgressTouchStart = React.useCallback(
    (event: any) => {
      const touchX = event.nativeEvent.locationX;
      const newTime = calculateTimeFromPosition(touchX);
      onSeek(newTime);
      onTouchStart(event);
    },
    [calculateTimeFromPosition, onSeek, onTouchStart],
  );

  // 处理进度条触摸移动
  const handleProgressTouchMove = React.useCallback(
    (event: any) => {
      if (!isSeeking) return;

      const touchX = event.nativeEvent.locationX;
      const newTime = calculateTimeFromPosition(touchX);
      onSeek(newTime);
      onTouchMove(event);
    },
    [isSeeking, calculateTimeFromPosition, onSeek, onTouchMove],
  );

  React.useEffect(() => {
    if (!isSeeking) {
      updateProgressBar(currentTime);
    }
  }, [currentTime, isSeeking, updateProgressBar]);

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white text-xs">{formatTime(displayTime)}</Text>
        <Text className="text-white text-xs">{formatTime(duration)}</Text>
      </View>

      {/* 交互式进度条 */}
      <View
        className="h-2 bg-white/30 rounded-full overflow-hidden relative"
        onLayout={handleProgressLayout}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleProgressTouchStart}
        onResponderMove={handleProgressTouchMove}
        onResponderRelease={onTouchEnd}
        onResponderTerminate={onTouchEnd}
      >
        {/* 背景进度条 */}
        <View className="absolute inset-0 bg-white/30 rounded-full" />

        {/* 当前进度条 */}
        <Animated.View
          className="absolute left-0 top-0 bottom-0 bg-white rounded-full"
          style={{
            width: progressAnimatedValue.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
              extrapolate: "clamp",
            }),
          }}
        />

        {/* 缓冲进度条（如果有） */}
        <View
          className="absolute left-0 top-0 bottom-0 bg-white/20 rounded-full"
          style={{
            width: `${Math.min(((currentTime + 5) / duration) * 100, 100)}%`,
          }}
        />

        {/* 拖拽手柄 */}
        <Animated.View
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
          style={{
            left: progressAnimatedValue.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
              extrapolate: "clamp",
            }),
            transform: [
              {
                translateX: progressAnimatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, progressWidth.current],
                  extrapolate: "clamp",
                }),
              },
              { translateY: 0 },
            ],
            opacity: isSeeking ? 1 : 0.8,
          }}
        />
      </View>
    </View>
  );
};
