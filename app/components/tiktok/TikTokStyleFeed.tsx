import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '../video/VideoPlayer';
import { Video as VideoType } from '../../app/types';
import { useStore } from '../../store/store';
import { videoService } from '../../app/services/videoService';

const { width, height } = Dimensions.get('window');

interface TikTokStyleFeedProps {
  videos?: VideoType[];
  onVideoPress?: (video: VideoType) => void;
  onVideoLongPress?: (video: VideoType) => void;
  style?: any;
}

/**
 * 抖音风格视频流组件
 */
export const TikTokStyleFeed: React.FC<TikTokStyleFeedProps> = ({
  videos: propVideos,
  onVideoPress,
  onVideoLongPress,
  style,
}) => {
  const { videos: storeVideos, setVideos, setLoading } = useStore();
  const [videos, setLocalVideos] = useState<VideoType[]>(propVideos || storeVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoadingLocal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  });

  // 加载视频数据
  const loadVideos = async () => {
    try {
      setLoadingLocal(true);
      setLoading(true);
      
      const result = await videoService.getVideos();
      if (result.success && result.data) {
        setLocalVideos(result.data);
        setVideos(result.data);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoadingLocal(false);
      setLoading(false);
    }
  };

  // 处理视图变化
  const handleViewableItemsChanged = useRef(({ changed }: any) => {
    changed.forEach((item: any) => {
      if (item.isViewable) {
        setCurrentIndex(item.index);
      }
    });
  });

  // 处理视频点击
  const handleVideoPress = (video: VideoType) => {
    onVideoPress?.(video);
  };

  // 处理视频长按
  const handleVideoLongPress = (video: VideoType) => {
    onVideoLongPress?.(video);
  };

  // 渲染视频项
  const renderVideoItem = ({ item, index }: { item: VideoType; index: number }) => (
    <TikTokVideoItem
      video={item}
      isActive={index === currentIndex}
      onPress={() => handleVideoPress(item)}
      onLongPress={() => handleVideoLongPress(item)}
    />
  );

  // 监听外部视频数据变化
  useEffect(() => {
    if (propVideos) {
      setLocalVideos(propVideos);
    }
  }, [propVideos]);

  // 初始加载
  useEffect(() => {
    if (!propVideos && storeVideos.length === 0) {
      loadVideos();
    }
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    flatList: {
      flex: 1,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={handleViewableItemsChanged.current}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

interface TikTokVideoItemProps {
  video: VideoType;
  isActive: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * 抖音风格视频项组件
 */
const TikTokVideoItem: React.FC<TikTokVideoItemProps> = ({
  video,
  isActive,
  onPress,
  onLongPress,
}) => {
  const { playerState, setPlayerState } = useStore();

  // 处理视频加载
  const handleVideoLoad = (load: any) => {
    if (isActive) {
      setPlayerState({
        duration: load.duration,
        isBuffering: false,
      });
    }
  };

  // 处理进度更新
  const handleProgress = (progress: any) => {
    if (isActive) {
      setPlayerState({
        position: progress.currentTime,
        isBuffering: false,
      });
    }
  };

  // 处理视频结束
  const handleVideoEnd = async () => {
    if (isActive) {
      try {
        await videoService.incrementPlayCount(video.id);
        setPlayerState({ isPlaying: false });
      } catch (error) {
        console.error('Failed to update video stats:', error);
      }
    }
  };

  // 处理视频错误
  const handleVideoError = (error: any) => {
    console.error('Video error:', error);
    if (isActive) {
      setPlayerState({ isPlaying: false });
    }
  };

  const styles = StyleSheet.create({
    container: {
      width: width,
      height: height,
      position: 'relative',
    },
    videoContainer: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <VideoPlayer
          video={video}
          isPlaying={isActive && playerState.isPlaying}
          isMuted={playerState.isMuted}
          onLoad={handleVideoLoad}
          onProgress={handleProgress}
          onEnd={handleVideoEnd}
          onError={handleVideoError}
          showControls={false}
          repeat={true}
        />
      </View>
      
      <TikTokVideoOverlay
        video={video}
        isActive={isActive}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    </View>
  );
};

interface TikTokVideoOverlayProps {
  video: VideoType;
  isActive: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * 抖音风格视频覆盖层组件
 */
const TikTokVideoOverlay: React.FC<TikTokVideoOverlayProps> = ({
  video,
  isActive,
  onPress,
  onLongPress,
}) => {
  const { playerState, setPlayerState } = useStore();
  const [showControls, setShowControls] = useState(false);

  // 处理屏幕点击
  const handleScreenPress = () => {
    setShowControls(!showControls);
    if (isActive) {
      setPlayerState({ isPlaying: !playerState.isPlaying });
    }
    onPress?.();
  };

  // 处理长按
  const handleLongPress = () => {
    onLongPress?.();
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
    },
    content: {
      flex: 1,
      justifyContent: 'flex-end',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleScreenPress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <TikTokVideoInfo video={video} />
        <TikTokSideActions video={video} isActive={isActive} />
      </View>
    </TouchableOpacity>
  );
};

interface TikTokVideoInfoProps {
  video: VideoType;
}

/**
 * 抖音风格视频信息组件
 */
const TikTokVideoInfo: React.FC<TikTokVideoInfoProps> = ({ video }) => {
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 80,
      left: 16,
      right: 80,
      zIndex: 10,
    },
    title: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    description: {
      color: 'white',
      fontSize: 14,
      lineHeight: 20,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      color: 'white',
      fontSize: 12,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {video.description || '暂无描述'}
      </Text>
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="play" size={12} color="white" />
          <Text style={styles.statText}>{video.playCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={12} color="white" />
          <Text style={styles.statText}>{video.likeCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={12} color="white" />
          <Text style={styles.statText}>{formatDuration(video.duration)}</Text>
        </View>
      </View>
    </View>
  );
};

interface TikTokSideActionsProps {
  video: VideoType;
  isActive: boolean;
}

/**
 * 抖音风格侧边操作按钮组件
 */
const TikTokSideActions: React.FC<TikTokSideActionsProps> = ({ video, isActive }) => {
  const { playerState, setPlayerState } = useStore();
  const [isLiked, setIsLiked] = useState(video.isFavorite);
  const [likeCount, setLikeCount] = useState(video.likeCount || 0);

  // 处理点赞
  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      // 更新点赞数
      if (newLikedState) {
        await videoService.incrementLikeCount(video.id);
      } else {
        await videoService.decrementLikeCount(video.id);
      }
      
      // 更新收藏状态
      const result = await videoService.toggleFavorite(video.id);
      if (result.success) {
        // 更新本地状态
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // 处理静音切换
  const handleMuteToggle = () => {
    if (isActive) {
      setPlayerState({ isMuted: !playerState.isMuted });
    }
  };

  // 处理分享
  const handleShare = () => {
    // 实现分享功能
  };

  // 处理评论
  const handleComment = () => {
    // 实现评论功能
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 80,
      right: 16,
      alignItems: 'center',
      gap: 20,
      zIndex: 10,
    },
    actionButton: {
      alignItems: 'center',
      gap: 4,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '500',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
        <View style={styles.actionIcon}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#ff4444" : "white"} 
          />
        </View>
        <Text style={styles.actionText}>{likeCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
        <View style={styles.actionIcon}>
          <Ionicons name="chatbubble-outline" size={24} color="white" />
        </View>
        <Text style={styles.actionText}>评论</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
        <View style={styles.actionIcon}>
          <Ionicons name="share-outline" size={24} color="white" />
        </View>
        <Text style={styles.actionText}>分享</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleMuteToggle}>
        <View style={styles.actionIcon}>
          <Ionicons 
            name={playerState.isMuted ? "volume-mute" : "volume-high"} 
            size={24} 
            color="white" 
          />
        </View>
        <Text style={styles.actionText}>
          {playerState.isMuted ? "静音" : "音量"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// 格式化时长
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};