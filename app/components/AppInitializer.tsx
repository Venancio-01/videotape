/**
 * 应用初始化组件
 * 负责初始化数据库服务和相关配置
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeDatabase } from '@/database';
import { configService } from '@/storage/config-service';

interface AppInitializerProps {
  children: React.ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('开始初始化应用...');
        
        // 1. 初始化数据库
        await initializeDatabase();
        console.log('数据库初始化完成');
        
        // 2. 初始化配置服务
        await configService.getConfig();
        console.log('配置服务初始化完成');
        
        // 3. 预加载配置到 Zustand store
        const { useSettingsStore } = await import('@/stores/settingsStore');
        useSettingsStore.getState().refreshSettings();
        console.log('状态管理初始化完成');
        
        setIsInitialized(true);
        console.log('应用初始化完成');
        
      } catch (err) {
        console.error('应用初始化失败:', err);
        setError(err instanceof Error ? err.message : '初始化失败');
      }
    }

    initializeApp();
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>初始化失败</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在初始化应用...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AppInitializer;