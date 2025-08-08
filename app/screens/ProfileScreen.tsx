import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/store';

/**
 * 个人中心屏幕
 */
export const ProfileScreen: React.FC = () => {
  const { videos, settings } = useStore();

  // 计算统计数据
  const totalVideos = videos.length;
  const totalPlayCount = videos.reduce((sum, video) => sum + video.playCount, 0);
  const totalLikes = videos.reduce((sum, video) => sum + (video.likeCount || 0), 0);
  const favoriteVideos = videos.filter(video => video.isFavorite).length;
  const totalSize = videos.reduce((sum, video) => sum + video.size, 0);

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
    profileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 32,
      color: 'white',
      fontWeight: 'bold',
    },
    profileDetails: {
      flex: 1,
    },
    username: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    userBio: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
      marginBottom: 8,
    },
    editButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'flex-start',
    },
    editButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '500',
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
      color: '#333',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      color: '#333',
    },
    menuValue: {
      fontSize: 14,
      color: '#666',
    },
    menuArrow: {
      marginLeft: 8,
    },
    storageInfo: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    storageBar: {
      height: 8,
      backgroundColor: '#e0e0e0',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    storageBarFill: {
      height: '100%',
      backgroundColor: '#007AFF',
      width: '30%',
    },
    storageText: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    storageUsed: {
      fontSize: 12,
      color: '#666',
    },
    storageTotal: {
      fontSize: 12,
      color: '#666',
    },
  });

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>V</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.username}>VideoTape 用户</Text>
            <Text style={styles.userBio}>热爱视频，记录生活每一刻</Text>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>编辑资料</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalVideos}</Text>
            <Text style={styles.statLabel}>视频</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPlayCount}</Text>
            <Text style={styles.statLabel}>播放</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalLikes}</Text>
            <Text style={styles.statLabel}>获赞</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoriteVideos}</Text>
            <Text style={styles.statLabel}>收藏</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 存储信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>存储空间</Text>
          <View style={styles.storageInfo}>
            <View style={styles.storageBar}>
              <View style={styles.storageBarFill} />
            </View>
            <View style={styles.storageText}>
              <Text style={styles.storageUsed}>
                已使用 {Math.round(totalSize / 1024 / 1024)}MB
              </Text>
              <Text style={styles.storageTotal}>总计 1GB</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>我的内容</Text>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="videocam" size={20} color="#007AFF" />
            </View>
            <Text style={styles.menuText}>我的作品</Text>
            <Text style={styles.menuValue}>{totalVideos}个</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="heart" size={20} color="#ff4444" />
            </View>
            <Text style={styles.menuText}>我的收藏</Text>
            <Text style={styles.menuValue}>{favoriteVideos}个</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="time" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.menuText}>观看历史</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
            <View style={styles.menuIcon}>
              <Ionicons name="download" size={20} color="#FF9800" />
            </View>
            <Text style={styles.menuText}>离线下载</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
        </View>

        {/* 设置菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置</Text>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="settings" size={20} color="#666" />
            </View>
            <Text style={styles.menuText}>通用设置</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.menuText}>隐私设置</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="notifications" size={20} color="#FF9800" />
            </View>
            <Text style={styles.menuText}>通知设置</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle" size={20} color="#007AFF" />
            </View>
            <Text style={styles.menuText}>帮助与反馈</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
        </View>

        {/* 其他 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="information-circle" size={20} color="#666" />
            </View>
            <Text style={styles.menuText}>关于</Text>
            <Text style={styles.menuValue}>v1.0.0</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.menuArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
            <View style={styles.menuIcon}>
              <Ionicons name="log-out" size={20} color="#ff4444" />
            </View>
            <Text style={styles.menuText}>退出登录</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};