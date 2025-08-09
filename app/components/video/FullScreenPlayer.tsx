import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { PlayerControls } from '@/components/video/PlayerControls';
import { Video as VideoType } from '@/types';
import { useStore } from '@/stores/store/store';
import { videoService } from '@/services/videoService';

interface FullScreenPlayerProps {
  video: VideoType;
  onExit?: () => void;
  style?: any;
}

/**
 * 全屏视频播放器
 */
export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({ video, onExit, style }) => {
  const { playerState, setPlayerState } = useStore();
  const [showControls, setShowControls] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // 隐藏控制面板
  const hideControls = () => {
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    setShowControls(false);
  };

  // 显示控制面板并设置自动隐藏
  const showControlsPanel = () => {
    setShowControls(true);

    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }

    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    setHideControlsTimeout(timeout as any);
  };

  // 处理屏幕点击
  const handleScreenPress = () => {
    if (showControls) {
      hideControls();
    } else {
      showControlsPanel();
    }
  };

  // 处理视频结束
  const handleVideoEnd = async () => {
    try {
      // 增加播放次数
      await videoService.incrementPlayCount(video.id);

      // 如果不是循环播放，自动播放下一个视频
      if (!playerState.isLooping) {
        // 这里可以实现自动播放下一个视频的逻辑
      }
    } catch (error) {
      console.error('Failed to update video stats:', error);
    }
  };

  // 处理视频错误
  const handleVideoError = (error: any) => {
    console.error('Video error:', error);
    Alert.alert('播放错误', '视频播放出现问题，请重试。', [
      { text: '重试', onPress: () => setPlayerState({ isPlaying: true }) },
      { text: '取消', onPress: onExit },
    ]);
  };

  // 处理视频加载
  const handleVideoLoad = (load: any) => {
    console.log('Video loaded:', load);
    setPlayerState({
      duration: load.duration,
      isBuffering: false,
    });
  };

  // 处理进度更新
  const handleProgress = (progress: any) => {
    setPlayerState({
      position: progress.currentTime,
      isBuffering: false,
    });
  };

  // 处理音量变化
  const handleVolumeChange = (volume: number) => {
    setPlayerState({ volume });
  };

  // 处理播放速度变化
  const handleSpeedChange = (speed: number) => {
    setPlayerState({ playbackRate: speed });
  };

  // 处理循环切换
  const handleToggleLoop = () => {
    setPlayerState({ isLooping: !playerState.isLooping });
  };

  // 处理随机播放切换
  const handleToggleShuffle = () => {
    setPlayerState({ isShuffle: !playerState.isShuffle });
  };

  // 处理播放/暂停
  const handleTogglePlayPause = () => {
    setPlayerState({ isPlaying: !playerState.isPlaying });
  };

  // 处理拖动进度
  const handleSeek = (position: number) => {
    setPlayerState({ position });
  };

  // 处理下一个视频
  const handleNext = () => {
    // 这里可以实现播放下一个视频的逻辑
  };

  // 处理上一个视频
  const handlePrevious = () => {
    // 这里可以实现播放上一个视频的逻辑
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
  }, [hideControlsTimeout]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    contentContainer: {
      flex: 1,
      position: 'relative',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backButton: {
      padding: 8,
    },
    videoTitle: {
      flex: 1,
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 16,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <StatusBar hidden={true} />

      <View style={styles.contentContainer}>
        <VideoPlayer
          video={video}
          onEnd={handleVideoEnd}
          onError={handleVideoError}
          onLoad={handleVideoLoad}
          onProgress={handleProgress}
        />

        <TouchableOpacity style={styles.overlay} onPress={handleScreenPress} activeOpacity={1}>
          {/* 顶部栏 */}
          {showControls && (
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={onExit}>
                <Ionicons name="chevron-down" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {video.title}
              </Text>
              <View style={styles.backButton} />
            </View>
          )}

          {/* 播放器控制 */}
          <PlayerControls
            showControls={showControls}
            onTogglePlayPause={handleTogglePlayPause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={handleSpeedChange}
            onToggleLoop={handleToggleLoop}
            onToggleShuffle={handleToggleShuffle}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />

          {/* 加载指示器 */}
          {playerState.isBuffering && (
            <View style={styles.loadingOverlay}>
              <Ionicons name="refresh" size={32} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
