import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TikTokHomeScreen } from '@/screens/TikTokHomeScreen';
import { VideoListScreen } from '@/screens/VideoListScreen';
import { useStore } from '@/stores/store/store';
import { videoService } from '@/services/videoService';

export default function Screen() {
  const { currentViewMode, setLoading, videos } = useStore();
  const [loading, setLoadingLocal] = useState(false);

  // 初始化应用数据
  const initializeApp = async () => {
    try {
      setLoadingLocal(true);
      setLoading(true);
      
      // 加载视频数据
      const result = await videoService.getVideos();
      if (result.success && result.data) {
        // 视频数据已通过 store 设置
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoadingLocal(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videos.length === 0) {
      initializeApp();
    }
  }, [videos.length, initializeApp]);

  // 加载状态
  if (loading && videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在加载视频...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={false} barStyle="light-content" />
      
      {/* 根据当前视图模式显示不同的屏幕 */}
      {currentViewMode === 'tiktok' ? (
        <TikTokHomeScreen />
      ) : (
        <VideoListScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
});
