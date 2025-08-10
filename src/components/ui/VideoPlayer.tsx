/**
 * 视频播放器组件 - 基于状态管理的完整播放器
 */

import { usePlaybackManager, useQueueManager } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { type AVPlaybackStatus, Video } from "expo-av";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface VideoPlayerProps {
  videoUri: string;
  videoId: string;
  onVideoEnd?: () => void;
  onVideoError?: (error: any) => void;
  style?: any;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUri,
  videoId,
  onVideoEnd,
  onVideoError,
  style,
}) => {
  const videoRef = useRef<Video>(null);
  const { status, progress, volume, speed, modes, error, buffering, controls } =
    usePlaybackManager();

  const { playNext, playPrevious } = useQueueManager();

  // 处理视频状态更新
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        // 更新播放状态
        if (status.isPlaying) {
          // 播放中
        } else {
          // 暂停或停止
        }
      }

      if (status.positionMillis !== undefined) {
        // 更新播放位置
      }

      if (status.durationMillis !== undefined) {
        // 更新总时长
      }

      if (status.isBuffering) {
        // 缓冲中
      }

      if (status.didJustFinish) {
        // 播放结束
        onVideoEnd?.();
        if (modes.repeatMode === "single") {
          // 单曲循环
          videoRef.current?.replayAsync();
        } else if (modes.repeatMode === "all") {
          // 列表循环
          playNext();
        }
      }

      if (status.error) {
        // 播放错误
        onVideoError?.(status.error);
      }
    },
    [onVideoEnd, onVideoError, modes.repeatMode, playNext],
  );

  // 播放控制
  const togglePlayPause = async () => {
    if (status === "loading") return;

    try {
      if (status === "playing") {
        await videoRef.current?.pauseAsync();
      } else {
        await videoRef.current?.playAsync();
      }
    } catch (error) {
      onVideoError?.(error);
    }
  };

  // 快进/快退
  const seekForward = async () => {
    try {
      const newPosition = Math.min(
        progress.position + 10000, // 10秒
        progress.duration,
      );
      await videoRef.current?.setPositionAsync(newPosition);
    } catch (error) {
      onVideoError?.(error);
    }
  };

  const seekBackward = async () => {
    try {
      const newPosition = Math.max(
        progress.position - 10000, // 10秒
        0,
      );
      await videoRef.current?.setPositionAsync(newPosition);
    } catch (error) {
      onVideoError?.(error);
    }
  };

  // 音量控制
  const adjustVolume = async (increase: boolean) => {
    try {
      const adjustment = increase ? 0.1 : -0.1;
      const newVolume = Math.max(0, Math.min(1, volume.volume + adjustment));
      await videoRef.current?.setVolumeAsync(newVolume);
    } catch (error) {
      onVideoError?.(error);
    }
  };

  // 播放速率控制
  const adjustSpeed = async (increase: boolean) => {
    try {
      const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
      const currentIndex = speeds.indexOf(speed.playbackRate);
      const newIndex = increase
        ? Math.min(currentIndex + 1, speeds.length - 1)
        : Math.max(currentIndex - 1, 0);
      await videoRef.current?.setRateAsync(speeds[newIndex]);
    } catch (error) {
      onVideoError?.(error);
    }
  };

  // 格式化时间
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* 视频播放器 */}
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        useNativeControls={false}
        resizeMode="contain"
        isLooping={modes.isLooping}
        shouldPlay={status === "playing"}
        volume={volume.volume}
        rate={speed.playbackRate}
        isMuted={volume.isMuted}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />

      {/* 加载指示器 */}
      {status === "loading" && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      )}

      {/* 缓冲指示器 */}
      {buffering.isBuffering && (
        <View style={styles.bufferingContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      )}

      {/* 错误显示 */}
      {error.hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#ff4444" />
          <Text style={styles.errorText}>播放错误</Text>
        </View>
      )}

      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        {/* 播放/暂停按钮 */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={togglePlayPause}
          disabled={status === "loading"}
        >
          <Ionicons
            name={status === "playing" ? "pause" : "play"}
            size={32}
            color="#ffffff"
          />
        </TouchableOpacity>

        {/* 快退按钮 */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={seekBackward}
          disabled={status === "loading"}
        >
          <Ionicons name="play-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* 快进按钮 */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={seekForward}
          disabled={status === "loading"}
        >
          <Ionicons name="play-forward" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* 上一曲按钮 */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={playPrevious}
          disabled={status === "loading" || !controls.hasPrevious}
        >
          <Ionicons name="play-skip-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* 下一曲按钮 */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={playNext}
          disabled={status === "loading" || !controls.hasNext}
        >
          <Ionicons name="play-skip-forward" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.progress * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
      </View>

      {/* 信息显示 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {speed.formattedPlaybackRate} | {volume.volumePercentage}%
        </Text>
        <Text style={styles.infoText}>
          {modes.repeatMode} | {modes.shuffleMode ? "随机" : "顺序"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  video: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 10,
  },
  bufferingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  errorContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
  },
  errorText: {
    color: "#ffffff",
    marginTop: 10,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  controlButton: {
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  progressContainer: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    color: "#ffffff",
    fontSize: 12,
    minWidth: 45,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    marginHorizontal: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },
  infoContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoText: {
    color: "#ffffff",
    fontSize: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
