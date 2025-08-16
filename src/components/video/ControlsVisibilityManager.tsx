import React from "react";
import { View } from "react-native";

interface ControlsVisibilityManagerProps {
  isPlaying: boolean;
  showControls: boolean;
  onShowControls?: () => void;
  onControlsVisibleChange: (visible: boolean) => void;
  children: React.ReactNode;
}

export const ControlsVisibilityManager = React.forwardRef<
  { showControls: () => void },
  ControlsVisibilityManagerProps
>(
  (
    {
      isPlaying,
      showControls,
      onShowControls,
      onControlsVisibleChange,
      children,
    },
    ref,
  ) => {
    const [controlsVisible, setControlsVisible] = React.useState(false);
    const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const startHideTimer = React.useCallback(() => {
      clearHideTimeout();
      hideTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        onControlsVisibleChange(false);
      }, 1000);
    }, [onControlsVisibleChange]);

    const clearHideTimeout = React.useCallback(() => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }, []);

    const showControlsAndStartTimer = React.useCallback(() => {
      setControlsVisible(true);
      onControlsVisibleChange(true);
      clearHideTimeout();
      if (isPlaying) {
        startHideTimer();
      }
      // 通知父组件控制栏已显示
      onShowControls?.();
    }, [isPlaying, onShowControls, onControlsVisibleChange, startHideTimer]);

    // 暂停时显示控制栏，播放时隐藏
    React.useEffect(() => {
      if (!isPlaying) {
        setControlsVisible(true);
        onControlsVisibleChange(true);
        clearHideTimeout();
      } else {
        // 播放时延迟隐藏控制栏
        startHideTimer();
      }
    }, [isPlaying, onControlsVisibleChange, startHideTimer]);

    // 组件卸载时清理计时器
    React.useEffect(() => {
      return () => clearHideTimeout();
    }, [clearHideTimeout]);

    // 暴露显示控制栏的函数
    React.useImperativeHandle(ref, () => ({
      showControls: showControlsAndStartTimer,
    }));

    if (!showControls || (!controlsVisible && isPlaying)) {
      return null;
    }

    return (
      <View
        className="absolute inset-0 z-30"
        onStartShouldSetResponder={() => true}
        onResponderRelease={showControlsAndStartTimer}
      >
        {children}
      </View>
    );
  },
);

// 导出类型以供父组件使用
export type ControlsVisibilityManagerRef = {
  showControls: () => void;
};