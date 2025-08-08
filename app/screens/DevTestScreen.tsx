import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TikTokHomeScreen } from '@/screens/TikTokHomeScreen';

/**
 * 开发测试屏幕
 */
export const DevTestScreen: React.FC = () => {
  const [showTikTok, setShowTikTok] = React.useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      backgroundColor: '#007AFF',
      padding: 20,
      paddingTop: 40,
    },
    title: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 16,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    testCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    testCardTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      color: '#333',
    },
    testCardDescription: {
      fontSize: 14,
      color: '#666',
      marginBottom: 16,
      lineHeight: 20,
    },
    testButton: {
      backgroundColor: '#007AFF',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    testButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    featuresList: {
      marginTop: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureIcon: {
      marginRight: 8,
    },
    featureText: {
      fontSize: 14,
      color: '#666',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VideoTape 开发测试</Text>
        <Text style={styles.subtitle}>视频管理应用 - 抖音风格界面</Text>
      </View>

      {showTikTok ? (
        <TikTokHomeScreen />
      ) : (
        <View style={styles.content}>
          <View style={styles.testCard}>
            <Text style={styles.testCardTitle}>🎥 抖音风格界面</Text>
            <Text style={styles.testCardDescription}>
              测试完整的抖音风格视频浏览界面，包括滑动浏览、点赞、评论、分享等功能。
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>全屏视频滑动浏览</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>侧边栏操作按钮</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>视频信息展示</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>点赞和收藏功能</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>搜索和筛选功能</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.testButton}
              onPress={() => setShowTikTok(true)}
            >
              <Text style={styles.testButtonText}>启动抖音界面</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.testCard}>
            <Text style={styles.testCardTitle}>🔧 已实现功能</Text>
            <Text style={styles.testCardDescription}>
              项目已实现完整的视频管理功能，包括数据库、存储、播放器等核心模块。
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>数据库管理 (Dexie.js)</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>文件存储管理</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>视频播放器 (react-native-video)</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>状态管理 (Zustand)</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>搜索和筛选</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>播放列表管理</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>缩略图生成</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};