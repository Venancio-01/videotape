import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TikTokStyleFeed } from '@/components/tiktok/TikTokStyleFeed';
import { VideoList } from '@/components/common/VideoList';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterBar } from '@/components/common/FilterBar';
import { Video as VideoType } from '@/types';
import { useStore } from '@/stores/store/store';

/**
 * 抖音风格主屏幕
 */
export const TikTokHomeScreen: React.FC = () => {
  const router = useRouter();
  const { currentViewMode, setCurrentViewMode } = useStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // 处理视图模式切换
  const handleViewModeChange = (mode: 'tiktok' | 'list') => {
    setCurrentViewMode(mode);
  };

  // 处理搜索切换
  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    setShowFilter(false);
  };

  // 处理筛选切换
  const handleFilterToggle = () => {
    setShowFilter(!showFilter);
    setShowSearch(false);
  };

  // 处理视频点击
  const handleVideoPress = (video: VideoType) => {
    router.push(`/video/${video.id}`);
  };

  // 处理视频长按
  const handleVideoLongPress = (video: VideoType) => {
    // 可以在这里实现长按菜单
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    content: {
      flex: 1,
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
      zIndex: 100,
      backgroundColor: 'transparent',
    },
    logo: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
    },
    actions: {
      flexDirection: 'row',
      gap: 16,
    },
    actionButton: {
      padding: 8,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 100,
    },
    tabButton: {
      alignItems: 'center',
      gap: 4,
    },
    tabText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    tabTextActive: {
      color: 'white',
    },
    searchOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 200,
      paddingTop: 60,
      paddingBottom: 20,
    },
    filterOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 200,
      paddingTop: 60,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden={false} barStyle="light-content" />

      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>VideoTape</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSearchToggle}>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleFilterToggle}>
            <Ionicons name="filter" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={24} color="white" />
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
          <FilterBar onFilterChange={() => setShowFilter(false)} />
        </View>
      )}

      {/* 主内容区域 */}
      <View style={styles.content}>
        {currentViewMode === 'tiktok' ? (
          <TikTokStyleFeed
            onVideoPress={handleVideoPress}
            onVideoLongPress={handleVideoLongPress}
          />
        ) : (
          <VideoList
            onVideoPress={handleVideoPress}
            onVideoLongPress={handleVideoLongPress}
            numColumns={2}
          />
        )}
      </View>

      {/* 底部导航栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabButton} onPress={() => handleViewModeChange('tiktok')}>
          <Ionicons
            name="home"
            size={24}
            color={currentViewMode === 'tiktok' ? 'white' : 'rgba(255, 255, 255, 0.6)'}
          />
          <Text style={[styles.tabText, currentViewMode === 'tiktok' && styles.tabTextActive]}>
            首页
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="compass" size={24} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.tabText}>发现</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => router.push('/upload')}>
          <Ionicons name="add-circle" size={24} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.tabText}>发布</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => handleViewModeChange('list')}>
          <Ionicons
            name="folder"
            size={24}
            color={currentViewMode === 'list' ? 'white' : 'rgba(255, 255, 255, 0.6)'}
          />
          <Text style={[styles.tabText, currentViewMode === 'list' && styles.tabTextActive]}>
            文库
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="person" size={24} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.tabText}>我的</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
