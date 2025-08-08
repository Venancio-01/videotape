import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoList } from '../components/common/VideoList';
import { SearchBar } from '../components/common/SearchBar';
import { FilterBar } from '../components/common/FilterBar';
import { Video as VideoType } from '../app/types';
import { useStore } from '../store/store';

/**
 * 视频列表屏幕
 */
export const VideoListScreen: React.FC = () => {
  const { videos, currentFilter, setCurrentFilter } = useStore();
  const [showSearch, setShowSearch] = React.useState(false);
  const [showFilter, setShowFilter] = React.useState(false);

  // 处理视频点击
  const handleVideoPress = (video: VideoType) => {
    // 导航到视频播放器
  };

  // 处理视频长按
  const handleVideoLongPress = (video: VideoType) => {
    // 显示操作菜单
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      backgroundColor: '#007AFF',
      padding: 16,
      paddingTop: 60,
      paddingBottom: 20,
    },
    title: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      padding: 8,
      borderRadius: 8,
      gap: 8,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    searchOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 100,
      paddingTop: 60,
      paddingBottom: 20,
    },
    filterOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 100,
      paddingTop: 60,
    },
    content: {
      flex: 1,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
    },
    statLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>视频文库</Text>
        <Text style={styles.subtitle}>管理您的所有视频文件</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={16} color="white" />
            <Text style={styles.actionButtonText}>搜索</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Ionicons name="filter" size={16} color="white" />
            <Text style={styles.actionButtonText}>筛选</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.actionButtonText}>添加</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="grid" size={16} color="white" />
            <Text style={styles.actionButtonText}>视图</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 搜索覆盖层 */}
      {showSearch && (
        <View style={styles.searchOverlay}>
          <SearchBar
            placeholder="搜索视频..."
            onSearch={() => setShowSearch(false)}
            onClear={() => setShowSearch(false)}
            autoFocus={true}
          />
        </View>
      )}

      {/* 筛选覆盖层 */}
      {showFilter && (
        <View style={styles.filterOverlay}>
          <FilterBar
            onFilterChange={() => setShowFilter(false)}
          />
        </View>
      )}

      {/* 统计信息 */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{videos.length}</Text>
          <Text style={styles.statLabel}>总视频</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {videos.filter(v => v.isFavorite).length}
          </Text>
          <Text style={styles.statLabel}>收藏</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {videos.reduce((sum, v) => sum + v.playCount, 0)}
          </Text>
          <Text style={styles.statLabel}>播放次数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {Math.round(videos.reduce((sum, v) => sum + v.size, 0) / 1024 / 1024)}MB
          </Text>
          <Text style={styles.statLabel}>总大小</Text>
        </View>
      </View>

      {/* 视频列表 */}
      <View style={styles.content}>
        <VideoList
          onVideoPress={handleVideoPress}
          onVideoLongPress={handleVideoLongPress}
          numColumns={2}
          refreshable={true}
        />
      </View>
    </View>
  );
};