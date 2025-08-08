import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video as VideoType } from '@/types';
import { useStore } from '@/stores/store/store';
import { videoService } from '@/services/videoService';

interface ActionMenuProps {
  video: VideoType;
  onEdit?: (video: VideoType) => void;
  onDelete?: (video: VideoType) => void;
  onShare?: (video: VideoType) => void;
  onAddToPlaylist?: (video: VideoType) => void;
  onDownload?: (video: VideoType) => void;
  style?: any;
}

/**
 * 视频操作菜单组件
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  video,
  onEdit,
  onDelete,
  onShare,
  onAddToPlaylist,
  onDownload,
  style,
}) => {
  const { removeVideo, updateVideo } = useStore();

  // 处理编辑
  const handleEdit = () => {
    onEdit?.(video);
  };

  // 处理删除
  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除视频"${video.title}"吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      const result = await videoService.deleteVideo(video.id);
      if (result.success) {
        removeVideo(video.id);
        onDelete?.(video);
      } else {
        Alert.alert('删除失败', result.error || '删除视频时发生错误');
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      Alert.alert('删除失败', '删除视频时发生错误');
    }
  };

  // 处理分享
  const handleShare = () => {
    onShare?.(video);
  };

  // 处理添加到播放列表
  const handleAddToPlaylist = () => {
    onAddToPlaylist?.(video);
  };

  // 处理下载
  const handleDownload = () => {
    onDownload?.(video);
  };

  // 处理切换收藏
  const handleToggleFavorite = async () => {
    try {
      const result = await videoService.toggleFavorite(video.id);
      if (result.success) {
        updateVideo(video.id, { isFavorite: result.data.isFavorite });
      } else {
        Alert.alert('操作失败', result.error || '更新收藏状态时发生错误');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Alert.alert('操作失败', '更新收藏状态时发生错误');
    }
  };

  // 处理重命名
  const handleRename = () => {
    Alert.prompt(
      '重命名',
      '请输入新的视频名称',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: confirmRename },
      ],
      'plain-text',
      video.title
    );
  };

  // 确认重命名
  const confirmRename = async (newTitle: string) => {
    if (!newTitle.trim()) {
      Alert.alert('提示', '视频名称不能为空');
      return;
    }

    try {
      const result = await videoService.updateVideo(video.id, { title: newTitle });
      if (result.success) {
        updateVideo(video.id, { title: newTitle });
      } else {
        Alert.alert('重命名失败', result.error || '重命名视频时发生错误');
      }
    } catch (error) {
      console.error('Failed to rename video:', error);
      Alert.alert('重命名失败', '重命名视频时发生错误');
    }
  };

  // 菜单项
  const menuItems = [
    {
      icon: 'create-outline',
      label: '编辑',
      color: '#007AFF',
      onPress: handleEdit,
    },
    {
      icon: 'text-outline',
      label: '重命名',
      color: '#007AFF',
      onPress: handleRename,
    },
    {
      icon: video.isFavorite ? 'heart' : 'heart-outline',
      label: video.isFavorite ? '取消收藏' : '收藏',
      color: video.isFavorite ? '#ff4444' : '#666',
      onPress: handleToggleFavorite,
    },
    {
      icon: 'list-outline',
      label: '添加到播放列表',
      color: '#007AFF',
      onPress: handleAddToPlaylist,
    },
    {
      icon: 'share-outline',
      label: '分享',
      color: '#007AFF',
      onPress: handleShare,
    },
    {
      icon: 'download-outline',
      label: '下载',
      color: '#007AFF',
      onPress: handleDownload,
    },
    {
      icon: 'trash-outline',
      label: '删除',
      color: '#ff4444',
      onPress: handleDelete,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuIcon: {
      marginRight: 12,
      fontSize: 20,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      color: '#333',
    },
    dangerText: {
      color: '#ff4444',
    },
  });

  return (
    <View style={[styles.container, style]}>
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={item.label}
          style={[
            styles.menuItem,
            index === menuItems.length - 1 && styles.menuItemLast,
          ]}
          onPress={item.onPress}
          activeOpacity={0.6}
        >
          <Ionicons
            name={item.icon as any}
            size={20}
            color={item.color}
            style={styles.menuIcon}
          />
          <Text style={[
            styles.menuText,
            item.color === '#ff4444' && styles.dangerText,
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};