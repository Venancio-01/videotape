/**
 * 仓库模式使用示例
 * 展示如何在 React 组件中使用 Repository Pattern 和 useLiveQuery
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useAllVideos, useVideoOperations, usePlaylistOperations, useDatabase } from '../db';
import { Video } from '../db/schema';

/**
 * 视频列表组件示例
 */
export function VideoListScreen() {
  const { data: videos, error, isLoading } = useAllVideos();
  const { deleteVideo, toggleFavorite } = useVideoOperations();
  const { addVideoToPlaylist } = usePlaylistOperations();

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteVideo(videoId);
    } catch (error) {
      console.error('删除视频失败:', error);
    }
  };

  const handleToggleFavorite = async (videoId: string, isFavorite: boolean) => {
    try {
      await toggleFavorite(videoId, !isFavorite);
    } catch (error) {
      console.error('更新收藏状态失败:', error);
    }
  };

  const handleAddToPlaylist = async (videoId: string, playlistId: string) => {
    try {
      await addVideoToPlaylist(playlistId, videoId);
    } catch (error) {
      console.error('添加到播放列表失败:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>错误: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.videoItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.duration}秒</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, item.isFavorite && styles.favoriteButton]}
                onPress={() => handleToggleFavorite(item.id, item.isFavorite)}
              >
                <Text style={styles.buttonText}>
                  {item.isFavorite ? '取消收藏' : '收藏'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => handleDeleteVideo(item.id)}
              >
                <Text style={styles.buttonText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

/**
 * 视频搜索组件示例
 */
export function VideoSearchScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>();
  
  const { data: searchResult, isLoading } = useVideoSearch({
    query: searchQuery,
    category: selectedCategory,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20,
  });

  return (
    <View style={styles.container}>
      {/* 搜索输入框 */}
      <View style={styles.searchContainer}>
        <Text>搜索:</Text>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="输入视频标题..."
        />
      </View>

      {/* 分类筛选 */}
      <View style={styles.filterContainer}>
        <Text>分类:</Text>
        <TouchableOpacity
          style={[styles.filterButton, !selectedCategory && styles.activeFilter]}
          onPress={() => setSelectedCategory(undefined)}
        >
          <Text>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedCategory === 'movie' && styles.activeFilter]}
          onPress={() => setSelectedCategory('movie')}
        >
          <Text>电影</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedCategory === 'series' && styles.activeFilter]}
          onPress={() => setSelectedCategory('series')}
        >
          <Text>剧集</Text>
        </TouchableOpacity>
      </View>

      {/* 搜索结果 */}
      {isLoading ? (
        <Text>搜索中...</Text>
      ) : (
        <FlatList
          data={searchResult?.items || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.videoItem}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.category}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

/**
 * 播放列表管理组件示例
 */
export function PlaylistManagementScreen() {
  const { data: playlists, isLoading } = useAllPlaylists();
  const { createPlaylist, deletePlaylist } = usePlaylistOperations();

  const handleCreatePlaylist = async () => {
    try {
      await createPlaylist({
        name: '新建播放列表',
        description: '这是一个新的播放列表',
        isPublic: false,
        videoCount: 0,
        totalDuration: 0,
        isDefault: false,
        sortOrder: 0,
        playCount: 0,
        tags: [],
      });
    } catch (error) {
      console.error('创建播放列表失败:', error);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await deletePlaylist(playlistId);
    } catch (error) {
      console.error('删除播放列表失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createButton} onPress={handleCreatePlaylist}>
        <Text style={styles.buttonText}>创建播放列表</Text>
      </TouchableOpacity>

      {isLoading ? (
        <Text>加载中...</Text>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.playlistItem}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.videoCount} 个视频</Text>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => handleDeletePlaylist(item.id)}
              >
                <Text style={styles.buttonText}>删除</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

/**
 * 数据库状态监控组件示例
 */
export function DatabaseStatusScreen() {
  const { isInitialized, isHealthy, error, checkHealth } = useDatabase();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>数据库状态</Text>
      
      <View style={styles.statusItem}>
        <Text>初始化状态: </Text>
        <Text style={[styles.statusText, isInitialized && styles.success]}>
          {isInitialized ? '已初始化' : '未初始化'}
        </Text>
      </View>

      <View style={styles.statusItem}>
        <Text>健康状态: </Text>
        <Text style={[styles.statusText, isHealthy && styles.success]}>
          {isHealthy ? '健康' : '异常'}
        </Text>
      </View>

      {error && (
        <View style={styles.statusItem}>
          <Text style={styles.error}>错误: {error.message}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={checkHealth}>
        <Text style={styles.buttonText}>检查健康状态</Text>
      </TouchableOpacity>
    </View>
  );
}

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  videoItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  playlistItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  favoriteButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  createButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#34C759',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  statusItem: {
    marginBottom: 12,
  },
  statusText: {
    fontWeight: 'bold',
  },
  success: {
    color: '#34C759',
  },
});

// 占位符组件
const TextInput = ({ style, value, onChangeText, placeholder }: any) => (
  <input 
    style={style} 
    value={value} 
    onChange={(e) => onChangeText(e.target.value)}
    placeholder={placeholder}
  />
);