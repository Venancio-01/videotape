# 用户界面模块开发文档

## 1. 模块概述

### 1.1 功能描述
用户界面模块负责提供抖音风格的用户界面和交互体验，包括垂直滑动切换视频、手势控制、动画效果等功能。该模块是整个应用的用户交互核心。

### 1.2 技术栈
- **UI框架**: React Native + Nativewind
- **手势处理**: React Native Gesture Handler
- **动画效果**: React Native Reanimated
- **导航**: Expo Router
- **状态管理**: Zustand

### 1.3 依赖关系
- 依赖视频播放模块处理视频播放
- 依赖视频管理模块获取视频数据
- 依赖状态管理模块同步UI状态

## 2. 功能需求

### 2.1 抖音风格界面

#### 2.1.1 主界面组件
```typescript
// src/components/ui/TikTokStyleFeed.tsx
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native';
import { useVideoStore } from '../../stores/video.store';
import { usePlaybackStore } from '../../stores/playback.store';
import { VideoPlayer } from '../video/VideoPlayer';
import { Video } from '../../database/schema';

interface TikTokStyleFeedProps {
  videos?: Video[];
  onVideoChange?: (video: Video, index: number) => void;
  onScroll?: (isScrolling: boolean) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TikTokStyleFeed: React.FC<TikTokStyleFeedProps> = ({
  videos: propVideos,
  onVideoChange,
  onScroll
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [viewConfig, setViewConfig] = useState({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300
  });

  const { videos, loading } = useVideoStore();
  const { currentVideoId, setCurrentVideoId, setIsPlaying } = usePlaybackStore();

  const displayVideos = propVideos || videos;

  // 处理滚动
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / SCREEN_HEIGHT);
    
    if (index !== currentIndex && index >= 0 && index < displayVideos.length) {
      setCurrentIndex(index);
      setIsScrolling(false);
      
      const video = displayVideos[index];
      setCurrentVideoId(video.id);
      setIsPlaying(true);
      
      onVideoChange?.(video, index);
    }
  }, [currentIndex, displayVideos, setCurrentVideoId, setIsPlaying, onVideoChange]);

  // 处理滚动开始
  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(true);
    setIsPlaying(false);
    onScroll?.(true);
  }, [setIsPlaying, onScroll]);

  // 处理滚动结束
  const handleScrollEndDrag = useCallback(() => {
    setIsScrolling(false);
    onScroll?.(false);
  }, [onScroll]);

  // 处理Momentum滚动开始
  const handleMomentumScrollBegin = useCallback(() => {
    setIsScrolling(true);
    setIsPlaying(false);
    onScroll?.(true);
  }, [setIsPlaying, onScroll]);

  // 处理Momentum滚动结束
  const handleMomentumScrollEnd = useCallback(() => {
    setIsScrolling(false);
    onScroll?.(false);
  }, [onScroll]);

  // 滚动到指定视频
  const scrollToVideo = useCallback((index: number) => {
    if (index >= 0 && index < displayVideos.length) {
      flatListRef.current?.scrollToOffset({
        offset: index * SCREEN_HEIGHT,
        animated: true
      });
      setCurrentIndex(index);
    }
  }, [displayVideos.length]);

  // 滚动到下一个视频
  const scrollToNext = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, displayVideos.length - 1);
    scrollToVideo(nextIndex);
  }, [currentIndex, displayVideos.length, scrollToVideo]);

  // 滚动到上一个视频
  const scrollToPrevious = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    scrollToVideo(prevIndex);
  }, [currentIndex, scrollToVideo]);

  // 渲染视频项
  const renderVideoItem = useCallback(({ item, index }: { item: Video; index: number }) => {
    const isActive = index === currentIndex;
    const isVisible = Math.abs(index - currentIndex) <= 1; // 预加载相邻视频

    return (
      <View style={styles.videoContainer}>
        <VideoPlayer
          video={item}
          autoPlay={isActive && !isScrolling}
          showControls={isActive}
          onPlaybackEnd={() => {
            if (index === currentIndex) {
              scrollToNext();
            }
          }}
        />
        
        {/* 视频信息覆盖层 */}
        {isActive && (
          <View style={styles.overlay}>
            <VideoInfoOverlay video={item} />
            <VideoActions video={item} />
          </View>
        )}
      </View>
    );
  }, [currentIndex, isScrolling, scrollToNext]);

  // 获取Item布局
  const getItemLayout = useCallback((data: Video[], index: number) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index
  }), []);

  // 获取ItemKey
  const getKey = useCallback((item: Video) => item.id, []);

  // 视图配置变更回调
  const onViewableItemsChanged = useCallback(({ changed }: any) => {
    changed.forEach((item: any) => {
      if (item.isViewable && Math.abs(item.index - currentIndex) <= 1) {
        // 预加载相邻视频
        console.log(`Preloading video at index ${item.index}`);
      }
    });
  }, [currentIndex]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={displayVideos}
        renderItem={renderVideoItem}
        keyExtractor={getKey}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  videoContainer: {
    width: Dimensions.get('window').width,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000'
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    right: 0,
    padding: 16
  }
});
```

#### 2.1.2 视频信息覆盖层
```typescript
// src/components/ui/VideoInfoOverlay.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video } from '../../database/schema';
import { formatDuration, formatNumber } from '../../utils/format';

interface VideoInfoOverlayProps {
  video: Video;
  showFullDescription?: boolean;
}

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({
  video,
  showFullDescription = false
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(showFullDescription);

  return (
    <View style={styles.container}>
      {/* 视频标题 */}
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>

      {/* 视频统计信息 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {formatNumber(video.viewCount)} 次观看
        </Text>
        <Text style={styles.statsText}>
          {formatDuration(video.duration)}
        </Text>
        <Text style={styles.statsText}>
          {video.quality === 'high' ? '高清' : video.quality === 'medium' ? '标清' : '流畅'}
        </Text>
      </View>

      {/* 视频描述 */}
      {video.description && (
        <TouchableOpacity
          style={styles.descriptionContainer}
          onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
        >
          <Text
            style={styles.description}
            numberOfLines={isDescriptionExpanded ? 0 : 3}
          >
            {video.description}
          </Text>
          {video.description.length > 100 && (
            <Text style={styles.moreButton}>
              {isDescriptionExpanded ? '收起' : '展开'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* 标签 */}
      {video.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {video.tags.slice(0, 5).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {video.tags.length > 5 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>+{video.tags.length - 5}</Text>
            </View>
          )}
        </View>
      )}

      {/* 分类 */}
      {video.category && (
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>分类: {video.category}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  statsText: {
    fontSize: 12,
    color: '#ccc',
    marginRight: 16
  },
  descriptionContainer: {
    marginBottom: 12
  },
  description: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20
  },
  moreButton: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8
  },
  tagText: {
    fontSize: 12,
    color: '#fff'
  },
  categoryContainer: {
    marginTop: 8
  },
  categoryText: {
    fontSize: 12,
    color: '#999'
  }
});
```

#### 2.1.3 视频操作按钮
```typescript
// src/components/ui/VideoActions.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from '../../database/schema';
import { useVideoStore } from '../../stores/video.store';

interface VideoActionsProps {
  video: Video;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
}

export const VideoActions: React.FC<VideoActionsProps> = ({
  video,
  onLike,
  onComment,
  onShare,
  onSave
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  const { removeVideo } = useVideoStore();

  // 处理点赞
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.();
  };

  // 处理评论
  const handleComment = () => {
    onComment?.();
  };

  // 处理分享
  const handleShare = () => {
    onShare?.();
  };

  // 处理收藏
  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.();
  };

  // 处理删除
  const handleDelete = () => {
    Alert.alert(
      '删除视频',
      `确定要删除 "${video.title}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => {
            removeVideo(video.id);
          }
        }
      ]
    );
  };

  // 处理更多选项
  const handleMoreOptions = () => {
    Alert.alert(
      '更多选项',
      video.title,
      [
        { text: '重命名', onPress: () => console.log('重命名') },
        { text: '移动到文件夹', onPress: () => console.log('移动') },
        { text: '查看详情', onPress: () => console.log('详情') },
        { text: '删除', style: 'destructive', onPress: handleDelete },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 点赞按钮 */}
      <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
        <View style={[styles.iconContainer, isLiked && styles.likedIcon]}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#ff0066' : '#fff'}
          />
        </View>
        <Text style={styles.actionText}>
          {likeCount > 0 ? likeCount : '点赞'}
        </Text>
      </TouchableOpacity>

      {/* 评论按钮 */}
      <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
        </View>
        <Text style={styles.actionText}>评论</Text>
      </TouchableOpacity>

      {/* 分享按钮 */}
      <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
        <View style={styles.iconContainer}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </View>
        <Text style={styles.actionText}>分享</Text>
      </TouchableOpacity>

      {/* 收藏按钮 */}
      <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
        <View style={[styles.iconContainer, isSaved && styles.savedIcon]}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isSaved ? '#3B82F6' : '#fff'}
          />
        </View>
        <Text style={styles.actionText}>
          {isSaved ? '已收藏' : '收藏'}
        </Text>
      </TouchableOpacity>

      {/* 更多选项 */}
      <TouchableOpacity style={styles.actionButton} onPress={handleMoreOptions}>
        <View style={styles.iconContainer}>
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </View>
        <Text style={styles.actionText}>更多</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 8,
    bottom: 80,
    alignItems: 'center'
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  likedIcon: {
    backgroundColor: 'rgba(255, 0, 102, 0.2)'
  },
  savedIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)'
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500'
  }
});
```

### 2.2 手势控制

#### 2.2.1 高级手势处理
```typescript
// src/components/ui/AdvancedGestureHandler.tsx
import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { usePlaybackStore } from '../../stores/playback.store';

interface AdvancedGestureHandlerProps {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onRightSwipe?: (progress: number) => void;
  onLeftSwipe?: (progress: number) => void;
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AdvancedGestureHandler: React.FC<AdvancedGestureHandlerProps> = ({
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress,
  onRightSwipe,
  onLeftSwipe,
  children
}) => {
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  const [showProgressIndicator, setShowProgressIndicator] = useState(false);
  
  const volumeAnim = useRef(new Animated.Value(0.5)).current;
  const brightnessAnim = useRef(new Animated.Value(0.5)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const {
    volume,
    setVolume,
    currentTime,
    duration,
    seekTo,
    togglePlayPause
  } = usePlaybackStore();

  // 创建手势响应器
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt, gestureState) => {
        // 记录初始状态
        gestureState.startX = gestureState.x0;
        gestureState.startY = gestureState.y0;
        gestureState.startTime = Date.now();
        gestureState.startVolume = volume;
        gestureState.startProgress = currentTime;
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy, x0, y0 } = gestureState;
        
        // 判断手势类型
        if (Math.abs(dx) > Math.abs(dy)) {
          // 水平滑动 - 调节播放进度
          const progressChange = dx / SCREEN_WIDTH;
          const newProgress = Math.max(0, Math.min(1, gestureState.startProgress / duration + progressChange));
          
          progressAnim.setValue(newProgress);
          setShowProgressIndicator(true);
          
          onRightSwipe?.(newProgress);
        } else {
          // 垂直滑动
          if (x0 < SCREEN_WIDTH / 2) {
            // 左侧屏幕 - 调节亮度
            const brightnessChange = -dy / SCREEN_HEIGHT;
            const newBrightness = Math.max(0, Math.min(1, 0.5 + brightnessChange));
            
            brightnessAnim.setValue(newBrightness);
            setShowBrightnessIndicator(true);
            
            // 设置屏幕亮度
            // Brightness.setBrightnessAsync(newBrightness);
          } else {
            // 右侧屏幕 - 调节音量
            const volumeChange = -dy / SCREEN_HEIGHT;
            const newVolume = Math.max(0, Math.min(1, gestureState.startVolume + volumeChange));
            
            volumeAnim.setValue(newVolume);
            setShowVolumeIndicator(true);
          }
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy, vx, vy } = gestureState;
        const tapTime = Date.now();
        
        // 隐藏所有指示器
        setShowVolumeIndicator(false);
        setShowBrightnessIndicator(false);
        setShowProgressIndicator(false);
        
        // 处理进度调整
        if (Math.abs(dx) > Math.abs(dy)) {
          const progressChange = dx / SCREEN_WIDTH;
          const newTime = Math.max(0, Math.min(duration, gestureState.startProgress + progressChange * duration));
          seekTo(newTime);
        }
        
        // 处理快速滑动
        if (Math.abs(vy) > 1.5) {
          if (vy > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
        
        // 处理点击
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          // 检测双击
          if (tapTime - lastTapTime < 300) {
            onDoubleTap?.();
          }
          setLastTapTime(tapTime);
        }
      }
    })
  ).current;

  return (
    <View {...panResponder.panHandlers} style={styles.container}>
      {children}
      
      {/* 音量指示器 */}
      {showVolumeIndicator && (
        <View style={styles.indicatorContainer}>
          <View style={styles.indicator}>
            <Ionicons name="volume-high" size={24} color="#fff" />
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: volumeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            />
            <Text style={styles.indicatorText}>
              {Math.round(volumeAnim.__getValue() * 100)}%
            </Text>
          </View>
        </View>
      )}
      
      {/* 亮度指示器 */}
      {showBrightnessIndicator && (
        <View style={styles.indicatorContainer}>
          <View style={styles.indicator}>
            <Ionicons name="sunny" size={24} color="#fff" />
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: brightnessAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            />
            <Text style={styles.indicatorText}>
              {Math.round(brightnessAnim.__getValue() * 100)}%
            </Text>
          </View>
        </View>
      )}
      
      {/* 进度指示器 */}
      {showProgressIndicator && (
        <View style={styles.progressIndicatorContainer}>
          <View style={styles.progressIndicator}>
            <Text style={styles.progressText}>
              {Math.floor(progressAnim.__getValue() * duration / 60)}:
              {Math.floor(progressAnim.__getValue() * duration % 60).toString().padStart(2, '0')}
            </Text>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  indicatorContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -30 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12
  },
  indicator: {
    alignItems: 'center',
    width: 120
  },
  progressBar: {
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginVertical: 8
  },
  indicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  progressIndicatorContainer: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12
  },
  progressIndicator: {
    alignItems: 'center',
    width: 200
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3
  }
});
```

### 2.3 动画效果

#### 2.3.1 页面切换动画
```typescript
// src/components/ui/PageTransitionAnimation.tsx
import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface PageTransitionAnimationProps {
  children: React.ReactNode;
  animationType?: 'fade' | 'slide' | 'scale' | 'flip';
  duration?: number;
}

export const PageTransitionAnimation: React.FC<PageTransitionAnimationProps> = ({
  children,
  animationType = 'fade',
  duration = 300
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(100)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      // 进入动画
      switch (animationType) {
        case 'fade':
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true
          }).start();
          break;
        case 'slide':
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration,
              useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration,
              useNativeDriver: true
            })
          ]).start();
          break;
        case 'scale':
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration,
              useNativeDriver: true
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration,
              useNativeDriver: true
            })
          ]).start();
          break;
        case 'flip':
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration,
              useNativeDriver: true
            }),
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration,
              useNativeDriver: true
            })
          ]).start();
          break;
      }

      return () => {
        // 退出动画重置
        fadeAnim.setValue(0);
        slideAnim.setValue(100);
        scaleAnim.setValue(0.8);
        rotateAnim.setValue(0);
      };
    }, [animationType, duration, fadeAnim, slideAnim, scaleAnim, rotateAnim])
  );

  const getTransform = () => {
    switch (animationType) {
      case 'slide':
        return [
          {
            translateY: slideAnim
          }
        ];
      case 'scale':
        return [
          {
            scale: scaleAnim
          }
        ];
      case 'flip':
        return [
          {
            rotateY: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['90deg', '0deg']
            })
          }
        ];
      default:
        return [];
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: getTransform()
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
```

#### 2.3.2 微交互动画
```typescript
// src/components/ui/MicroInteractions.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';

interface MicroInteractionsProps {
  children: React.ReactNode;
  onPress?: () => void;
  type?: 'scale' | 'bounce' | 'ripple' | 'shine';
  disabled?: boolean;
}

export const MicroInteractions: React.FC<MicroInteractionsProps> = ({
  children,
  onPress,
  type = 'scale',
  disabled = false
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;
  const shineAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;

    switch (type) {
      case 'scale':
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }).start();
        break;
      case 'bounce':
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true
          })
        ]).start();
        break;
      case 'ripple':
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true
        }).start();
        break;
      case 'shine':
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        }).start();
        break;
    }
  };

  const handlePressOut = () => {
    if (disabled) return;

    switch (type) {
      case 'scale':
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }).start();
        break;
      case 'ripple':
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }).start();
        break;
      case 'shine':
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true
        }).start();
        break;
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const renderShineEffect = () => {
    if (type !== 'shine') return null;

    return (
      <Animated.View
        style={[
          styles.shineEffect,
          {
            opacity: shineAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.8, 0]
            })
          }
        ]}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim
          }
        ]}
      >
        {children}
        {renderShineEffect()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative'
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8
  }
});
```

## 3. 导航系统

### 3.1 底部导航栏
```typescript
// src/components/ui/BottomNavigation.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

interface NavigationItem {
  name: string;
  icon: string;
  label: string;
  screen: string;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'home',
    icon: 'home',
    label: '首页',
    screen: 'Home'
  },
  {
    name: 'library',
    icon: 'library',
    label: '库',
    screen: 'Library'
  },
  {
    name: 'upload',
    icon: 'add-circle',
    label: '上传',
    screen: 'Upload'
  },
  {
    name: 'playlists',
    icon: 'list',
    label: '播放列表',
    screen: 'Playlists'
  },
  {
    name: 'settings',
    icon: 'settings',
    label: '设置',
    screen: 'Settings'
  }
];

export const BottomNavigation: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const handleNavigation = (screen: string) => {
    navigation.navigate(screen as never);
  };

  return (
    <View style={styles.container}>
      {navigationItems.map((item) => {
        const isActive = route.name === item.screen;
        
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navigationItem}
            onPress={() => handleNavigation(item.screen)}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Ionicons
                name={item.icon}
                size={24}
                color={isActive ? '#3B82F6' : '#666'}
              />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 20
  },
  navigationItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)'
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  activeLabel: {
    color: '#3B82F6',
    fontWeight: '600'
  }
});
```

## 4. 主题系统

### 4.1 主题切换
```typescript
// src/components/ui/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/theme.store';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    primaryLight: string;
    error: string;
    success: string;
    warning: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightColors = {
  background: '#ffffff',
  surface: '#f9fafb',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b'
};

const darkColors = {
  background: '#111827',
  surface: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  border: '#374151',
  primary: '#60a5fa',
  primaryLight: '#1e40af',
  error: '#f87171',
  success: '#34d399',
  warning: '#fbbf24'
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const { theme: storedTheme, setTheme: storeSetTheme } = useThemeStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(storedTheme === 'system' ? colorScheme || 'light' : storedTheme);

  useEffect(() => {
    if (storedTheme === 'system') {
      setTheme(colorScheme || 'light');
    } else {
      setTheme(storedTheme);
    }
  }, [storedTheme, colorScheme]);

  const handleSetTheme = (newTheme: Theme) => {
    storeSetTheme(newTheme);
    if (newTheme === 'system') {
      setTheme(colorScheme || 'light');
    } else {
      setTheme(newTheme);
    }
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  const value: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    colors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## 5. 性能优化

### 5.1 列表虚拟化
```typescript
// src/components/ui/VirtualizedVideoList.tsx
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { FlatList, View, StyleSheet, Dimensions } from 'react-native';
import { Video } from '../../database/schema';
import { VideoCard } from '../video/VideoCard';

interface VirtualizedVideoListProps {
  videos: Video[];
  onVideoPress?: (video: Video) => void;
  onVideoLongPress?: (video: Video) => void;
  itemHeight?: number;
  overscan?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VirtualizedVideoList: React.FC<VirtualizedVideoListProps> = ({
  videos,
  onVideoPress,
  onVideoLongPress,
  itemHeight = 200,
  overscan = 5
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [layoutHeight, setLayoutHeight] = useState(0);

  // 计算可见项目
  const getVisibleRange = useCallback((scrollOffset: number) => {
    const startIndex = Math.floor(scrollOffset / itemHeight);
    const endIndex = Math.ceil((scrollOffset + layoutHeight) / itemHeight);
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(videos.length - 1, endIndex + overscan)
    };
  }, [itemHeight, layoutHeight, videos.length, overscan]);

  // 获取Item布局
  const getItemLayout = useCallback((data: Video[], index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index
  }), [itemHeight]);

  // 渲染视频卡片
  const renderItem = useCallback(({ item, index }: { item: Video; index: number }) => {
    return (
      <View style={[styles.itemContainer, { height: itemHeight }]}>
        <VideoCard
          video={item}
          onPress={() => onVideoPress?.(item)}
          onLongPress={() => onVideoLongPress?.(item)}
          size="medium"
        />
      </View>
    );
  }, [onVideoPress, onVideoLongPress]);

  // 获取ItemKey
  const keyExtractor = useCallback((item: Video) => item.id, []);

  // 处理布局变化
  const handleLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    setLayoutHeight(height);
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={Math.ceil(SCREEN_HEIGHT / itemHeight) + overscan * 2}
        maxToRenderPerBatch={10}
        windowSize={Math.ceil(SCREEN_HEIGHT / itemHeight) + overscan * 2}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contentContainer: {
    paddingHorizontal: 16
  },
  itemContainer: {
    marginBottom: 16
  }
});
```

## 6. 测试计划

### 6.1 手势测试
```typescript
// src/__tests__/components/ui/AdvancedGestureHandler.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AdvancedGestureHandler } from '../../../components/ui/AdvancedGestureHandler';

describe('AdvancedGestureHandler', () => {
  const mockOnSwipeUp = jest.fn();
  const mockOnSwipeDown = jest.fn();
  const mockOnDoubleTap = jest.fn();
  const mockOnRightSwipe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染子组件', () => {
    const { getByText } = render(
      <AdvancedGestureHandler>
        <View>
          <Text>Test Content</Text>
        </View>
      </AdvancedGestureHandler>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('应该处理双击手势', () => {
    const { getByText } = render(
      <AdvancedGestureHandler onDoubleTap={mockOnDoubleTap}>
        <View>
          <Text>Test Content</Text>
        </View>
      </AdvancedGestureHandler>
    );

    const touchable = getByText('Test Content').parent;
    
    // 模拟双击
    fireEvent.press(touchable);
    fireEvent.press(touchable);

    expect(mockOnDoubleTap).toHaveBeenCalled();
  });

  it('应该处理右滑手势', () => {
    const { getByText } = render(
      <AdvancedGestureHandler onRightSwipe={mockOnRightSwipe}>
        <View>
          <Text>Test Content</Text>
        </View>
      </AdvancedGestureHandler>
    );

    const touchable = getByText('Test Content');
    
    // 模拟右滑
    fireEvent(touchable, 'ResponderGrant', {
      touchHistory: { mostRecentTimeStamp: 1000 },
      touches: [{ pageX: 100, pageY: 200 }]
    });
    
    fireEvent(touchable, 'ResponderMove', {
      touchHistory: { mostRecentTimeStamp: 1010 },
      touches: [{ pageX: 150, pageY: 200 }]
    });
    
    fireEvent(touchable, 'ResponderRelease', {
      touchHistory: { mostRecentTimeStamp: 1020 },
      touches: []
    });

    expect(mockOnRightSwipe).toHaveBeenCalled();
  });
});
```

## 7. 总结

用户界面模块提供了完整的抖音风格用户体验，包括：

1. **核心界面**: 垂直滑动视频流、视频信息展示、操作按钮
2. **手势控制**: 复杂的多点触控手势、滑动切换、音量/亮度调节
3. **动画效果**: 流畅的页面切换动画、微交互动画效果
4. **导航系统**: 底部导航栏、页面路由管理
5. **主题系统**: 深色/浅色主题切换、系统主题适配
6. **性能优化**: 列表虚拟化、内存管理、预加载策略

该模块充分考虑了移动端的用户体验，提供了直观、流畅的交互体验。