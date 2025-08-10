/**
 * 状态管理集成示例 - 主页面
 * 展示如何使用新的状态管理系统
 */

import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useVideoStore, usePlaybackStore, useSettingsStore } from '@/src/stores';
import { VideoCard } from '@/components/video/VideoCard';
import { type Video } from '@/db/schema';

// 模拟视频数据
const mockVideos: Video[] = [
  {
    id: 'video-1',
    title: '测试视频 1',
    filePath: '/path/to/video1.mp4',
    duration: 120,
    fileSize: 1024000,
    format: 'mp4',
    category: 'general',
    watchProgress: 0,
    isFavorite: false,
    playCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'video-2',
    title: '测试视频 2',
    filePath: '/path/to/video2.mp4',
    duration: 180,
    fileSize: 2048000,
    format: 'mp4',
    category: 'entertainment',
    watchProgress: 0,
    isFavorite: false,
    playCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const StateManagementDemo: React.FC = () => {
  // 使用各个 store
  const { 
    videos, 
    currentVideo, 
    favorites, 
    isLoading, 
    error, 
    addVideo, 
    removeVideo, 
    toggleFavorite, 
    playVideo, 
    pauseVideo,
    setSearchQuery,
    setFilter,
    clearFilters
  } = useVideoStore();

  const { 
    isPlaying, 
    position, 
    duration, 
    volume, 
    playbackRate, 
    play, 
    pause, 
    setPosition, 
    setVolume, 
    setPlaybackRate 
  } = usePlaybackStore();

  const { 
    theme, 
    language, 
    fontSize, 
    defaultPlaybackSpeed, 
    setTheme, 
    setLanguage, 
    setFontSize, 
    setDefaultPlaybackSpeed 
  } = useSettingsStore();

  // 状态统计
  const videoStats = useVideoStore.getState().getVideoStats();
  const playbackControls = usePlaybackStore.getState().getPlaybackControls();
  const settingsValidation = useSettingsStore.getState().getSettingsValidation();

  // 添加示例视频
  const handleAddVideos = () => {
    mockVideos.forEach(video => addVideo(video));
  };

  // 播放视频
  const handlePlayVideo = (videoId: string) => {
    playVideo(videoId);
  };

  // 切换收藏
  const handleToggleFavorite = (videoId: string) => {
    toggleFavorite(videoId);
  };

  // 更改主题
  const handleChangeTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // 渲染视频项
  const renderVideoItem = ({ item }: { item: Video }) => (
    <View style={styles.videoItem}>
      <VideoCard video={item} />
      <View style={styles.videoActions}>
        <Pressable 
          style={[styles.button, favorites.has(item.id) && styles.favoriteButton]}
          onPress={() => handleToggleFavorite(item.id)}
        >
          <Text style={styles.buttonText}>
            {favorites.has(item.id) ? '❤️' : '🤍'}
          </Text>
        </Pressable>
        <Pressable 
          style={styles.button}
          onPress={() => handlePlayVideo(item.id)}
        >
          <Text style={styles.buttonText}>▶️</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>状态管理演示</Text>
      
      {/* 状态统计 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          总视频: {videoStats.totalVideos} | 
          总时长: {Math.floor(videoStats.totalDuration / 60)}分钟 | 
          收藏: {favorites.size}
        </Text>
      </View>

      {/* 播放控制 */}
      <View style={styles.playbackContainer}>
        <Text style={styles.sectionTitle}>播放控制</Text>
        <Text style={styles.playbackInfo}>
          状态: {isPlaying ? '播放中' : '已暂停'} | 
          进度: {Math.floor(position)}/{Math.floor(duration)}秒 | 
          音量: {Math.round(volume * 100)}%
        </Text>
        <View style={styles.playbackControls}>
          <Pressable 
            style={styles.button} 
            onPress={isPlaying ? pause : play}
          >
            <Text style={styles.buttonText}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={() => setPosition(Math.max(0, position - 10))}
          >
            <Text style={styles.buttonText}>⏪️</Text>
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={() => setPosition(Math.min(duration, position + 10))}
          >
            <Text style={styles.buttonText}>⏩️</Text>
          </Pressable>
        </View>
      </View>

      {/* 设置控制 */}
      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>设置控制</Text>
        <Text style={styles.settingsInfo}>
          主题: {theme} | 
          语言: {language} | 
          字体: {fontSize} | 
          默认速度: {defaultPlaybackSpeed}x
        </Text>
        <View style={styles.settingsControls}>
          <Pressable 
            style={styles.button} 
            onPress={handleChangeTheme}
          >
            <Text style={styles.buttonText}>🌓</Text>
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={() => setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN')}
          >
            <Text style={styles.buttonText}>🌐</Text>
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={() => setFontSize(fontSize === 'medium' ? 'large' : 'medium')}
          >
            <Text style={styles.buttonText}>📝</Text>
          </Pressable>
        </View>
      </View>

      {/* 视频列表 */}
      <View style={styles.videosContainer}>
        <View style={styles.videosHeader}>
          <Text style={styles.sectionTitle}>视频列表 ({videos.length})</Text>
          <Pressable 
            style={styles.addButton} 
            onPress={handleAddVideos}
          >
            <Text style={styles.addButtonText}>添加示例视频</Text>
          </Pressable>
        </View>
        
        {isLoading ? (
          <Text style={styles.loadingText}>加载中...</Text>
        ) : error ? (
          <Text style={styles.errorText}>错误: {error}</Text>
        ) : (
          <FlatList
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={item => item.id}
            style={styles.videoList}
          />
        )}
      </View>

      {/* 当前播放视频 */}
      {currentVideo && (
        <View style={styles.currentVideoContainer}>
          <Text style={styles.sectionTitle}>当前播放</Text>
          <Text style={styles.currentVideoTitle}>{currentVideo.title}</Text>
          <Text style={styles.currentVideoInfo}>
            时长: {Math.floor(currentVideo.duration)}秒 | 
            大小: {Math.round(currentVideo.fileSize / 1024 / 1024)}MB
          </Text>
        </View>
      )}

      {/* 验证状态 */}
      <View style={styles.validationContainer}>
        <Text style={styles.sectionTitle}>设置验证</Text>
        <Text style={styles.validationText}>
          状态: {settingsValidation.isValid ? '✅ 有效' : '❌ 无效'}
        </Text>
        {!settingsValidation.isValid && (
          <Text style={styles.validationErrors}>
            错误: {settingsValidation.errors.join(', ')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#1976d2',
  },
  playbackContainer: {
    backgroundColor: '#f3e5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playbackInfo: {
    fontSize: 14,
    marginBottom: 8,
    color: '#7b1fa2',
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 8,
  },
  settingsContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  settingsInfo: {
    fontSize: 14,
    marginBottom: 8,
    color: '#388e3c',
  },
  settingsControls: {
    flexDirection: 'row',
    gap: 8,
  },
  videosContainer: {
    flex: 1,
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  videosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    color: '#f44336',
    fontSize: 16,
  },
  videoList: {
    flex: 1,
  },
  videoItem: {
    marginBottom: 12,
  },
  videoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  currentVideoContainer: {
    backgroundColor: '#e1f5fe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentVideoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#0277bd',
  },
  currentVideoInfo: {
    fontSize: 14,
    color: '#0277bd',
  },
  validationContainer: {
    backgroundColor: '#fce4ec',
    padding: 12,
    borderRadius: 8,
  },
  validationText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#c2185b',
  },
  validationErrors: {
    fontSize: 12,
    color: '#f44336',
  },
});

export default StateManagementDemo;