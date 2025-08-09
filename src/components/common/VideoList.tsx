import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { VideoThumbnail } from '@/components/video/VideoThumbnail';
import { Video as VideoType, FilterOptions } from '@/types';
import { useStore } from '@/stores/store/store';
import { videoService } from '@/services/videoService';

interface VideoListProps {
  videos?: VideoType[];
  onVideoPress?: (video: VideoType) => void;
  onVideoLongPress?: (video: VideoType) => void;
  filterOptions?: FilterOptions;
  refreshable?: boolean;
  showEmptyState?: boolean;
  style?: any;
  numColumns?: number;
}

/**
 * 视频列表组件
 */
export const VideoList: React.FC<VideoListProps> = ({
  videos: propVideos,
  onVideoPress,
  onVideoLongPress,
  filterOptions,
  refreshable = true,
  showEmptyState = true,
  style,
  numColumns = 1,
}) => {
  const { setVideos, setLoading } = useStore();
  const [videos, setLocalVideos] = useState<VideoType[]>(propVideos || []);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoadingLocal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 加载视频数据
  const loadVideos = async (isRefresh = false) => {
    if (loading || (!hasMore && !isRefresh)) return;

    try {
      setLoadingLocal(true);
      setLoading(true);

      const currentPage = isRefresh ? 1 : page;
      const result = await videoService.getPaginatedVideos(currentPage, 20, filterOptions);

      if (result.success && result.data) {
        if (isRefresh) {
          setLocalVideos(result.data.items);
          setVideos(result.data.items);
          setPage(1);
        } else {
          setLocalVideos((prev: VideoType[]) => [...prev, ...(result.data?.items || [])]);
          setVideos([...videos, ...(result.data?.items || [])]);
          setPage((prev) => prev + 1);
        }
        setHasMore(result.data.hasMore);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoadingLocal(false);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    loadVideos(true);
  };

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadVideos();
    }
  };

  // 处理视频点击
  const handleVideoPress = (video: VideoType) => {
    onVideoPress?.(video);
  };

  // 处理视频长按
  const handleVideoLongPress = (video: VideoType) => {
    onVideoLongPress?.(video);
  };

  // 渲染视频项
  const renderVideoItem = ({ item }: { item: VideoType }) => (
    <VideoThumbnail
      video={item}
      onPress={() => handleVideoPress(item)}
      onLongPress={() => handleVideoLongPress(item)}
      showTitle={true}
      showDuration={true}
      showPlayIcon={true}
      size="medium"
    />
  );

  // 渲染空状态
  const renderEmptyState = () => {
    if (!showEmptyState) return null;

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>暂无视频</Text>
        <Text style={styles.emptyStateDescription}>
          {filterOptions?.searchQuery ? '没有找到匹配的视频' : '开始添加您的第一个视频吧'}
        </Text>
      </View>
    );
  };

  // 渲染加载更多指示器
  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  };

  // 监听外部视频数据变化
  useEffect(() => {
    if (propVideos) {
      setLocalVideos(propVideos);
    }
  }, [propVideos]);

  // 监听筛选选项变化
  useEffect(() => {
    if (filterOptions) {
      loadVideos(true);
    }
  }, [filterOptions]);

  // 初始加载
  useEffect(() => {
    if (!propVideos) {
      loadVideos();
    }
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    contentContainer: {
      padding: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: '#333',
      marginBottom: 8,
    },
    emptyStateDescription: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
    },
    footer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    listContainer: {
      paddingBottom: 20,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          refreshable ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#666']}
              tintColor="#666"
            />
          ) : undefined
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};
