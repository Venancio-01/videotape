import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { useStore } from '@/stores/store/store'; // 保留用于将来可能的视频数据展示

/**
 * 发现屏幕
 */
export const DiscoverScreen: React.FC = () => {
  // const { videos } = useStore(); // 保留用于将来可能的视频数据展示

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
    content: {
      flex: 1,
      padding: 16,
    },
    category: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
      color: '#333',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryItem: {
      backgroundColor: '#f0f0f0',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    categoryItemText: {
      fontSize: 12,
      color: '#666',
    },
    trending: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    trendingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    trendingItemLast: {
      borderBottomWidth: 0,
    },
    trendingNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#007AFF',
      marginRight: 12,
      width: 30,
    },
    trendingInfo: {
      flex: 1,
    },
    trendingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      marginBottom: 4,
    },
    trendingStats: {
      flexDirection: 'row',
      gap: 16,
    },
    trendingStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    trendingStatText: {
      fontSize: 12,
      color: '#666',
    },
    recommendations: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    recommendationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    recommendationItemLast: {
      borderBottomWidth: 0,
    },
    recommendationThumbnail: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: '#f0f0f0',
      marginRight: 12,
    },
    recommendationInfo: {
      flex: 1,
    },
    recommendationTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
      marginBottom: 4,
    },
    recommendationMeta: {
      fontSize: 12,
      color: '#666',
    },
  });

  // 模拟数据
  const categories = [
    '音乐',
    '舞蹈',
    '游戏',
    '美食',
    '旅行',
    '运动',
    '教育',
    '科技',
    '搞笑',
    '宠物',
  ];

  const trendingVideos = [
    { title: '夏日海滩美景', views: '12.3万', likes: '8.5万' },
    { title: '美食制作教程', views: '9.8万', likes: '6.2万' },
    { title: '搞笑动物集锦', views: '8.1万', likes: '5.9万' },
    { title: '健身训练指南', views: '7.2万', likes: '4.8万' },
    { title: '旅行风景记录', views: '6.5万', likes: '4.1万' },
  ];

  const recommendations = [
    { title: '学习React Native开发', author: '技术频道', duration: '15:23' },
    { title: '摄影技巧分享', author: '摄影达人', duration: '8:45' },
    { title: '瑜伽基础教程', author: '健身教练', duration: '20:12' },
  ];

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>发现</Text>
        <Text style={styles.subtitle}>探索精彩视频内容</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 分类 */}
        <View style={styles.category}>
          <Text style={styles.categoryTitle}>热门分类</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity key={index} style={styles.categoryItem}>
                <Text style={styles.categoryItemText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 热门榜单 */}
        <View style={styles.trending}>
          <Text style={styles.categoryTitle}>热门榜单</Text>
          {trendingVideos.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.trendingItem,
                index === trendingVideos.length - 1 && styles.trendingItemLast,
              ]}>
              <Text style={styles.trendingNumber}>{index + 1}</Text>
              <View style={styles.trendingInfo}>
                <Text style={styles.trendingTitle}>{item.title}</Text>
                <View style={styles.trendingStats}>
                  <View style={styles.trendingStat}>
                    <Ionicons name="play" size={12} color="#666" />
                    <Text style={styles.trendingStatText}>{item.views}</Text>
                  </View>
                  <View style={styles.trendingStat}>
                    <Ionicons name="heart" size={12} color="#666" />
                    <Text style={styles.trendingStatText}>{item.likes}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 推荐视频 */}
        <View style={styles.recommendations}>
          <Text style={styles.categoryTitle}>推荐视频</Text>
          {recommendations.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.recommendationItem,
                index === recommendations.length - 1 && styles.recommendationItemLast,
              ]}>
              <View style={styles.recommendationThumbnail} />
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationTitle}>{item.title}</Text>
                <Text style={styles.recommendationMeta}>
                  {item.author} · {item.duration}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
