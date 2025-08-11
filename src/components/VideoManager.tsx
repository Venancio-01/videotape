/**
 * 视频管理模块
 * 专门处理视频文件的导入、管理和播放
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { useFileStore } from '../stores/fileStore';
import { FileItem } from '../types/file';
import { Ionicons } from '@expo/vector-icons';
import { Video, AVPlaybackStatus } from 'expo-av';

const { width } = Dimensions.get('window');

interface VideoManagerProps {
  onVideoSelected?: (video: FileItem) => void;
  allowMultiSelect?: boolean;
  maxVideos?: number;
}

export const VideoManager: React.FC<VideoManagerProps> = ({
  onVideoSelected,
  allowMultiSelect = false,
  maxVideos = 10,
}) => {
  const {
    files,
    selectedFiles,
    isLoading,
    error,
    importVideo,
    importMultipleVideos,
    generateThumbnail,
    deleteFile,
    toggleFavorite,
    selectFile,
    clearSelection,
    filterByType,
  } = useFileStore();

  const [videos, setVideos] = useState<FileItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<FileItem | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    return () => {
      if (video) {
        video.unloadAsync();
      }
    };
  }, [video]);

  const loadVideos = async () => {
    try {
      await filterByType('video');
    } catch (error) {
      console.error('加载视频失败:', error);
    }
  };

  useEffect(() => {
    // 过滤视频文件
    const videoFiles = files.filter(file => file.type === 'video');
    setVideos(videoFiles);
  }, [files]);

  const handleVideoPress = (videoFile: FileItem) => {
    if (allowMultiSelect) {
      selectFile(videoFile.id);
    } else {
      setSelectedVideo(videoFile);
      setShowVideoModal(true);
      onVideoSelected?.(videoFile);
    }
  };

  const handleVideoLongPress = (videoFile: FileItem) => {
    Alert.alert(
      '视频操作',
      videoFile.name,
      [
        { text: '取消', style: 'cancel' },
        { text: '播放', onPress: () => handlePlayVideo(videoFile) },
        { text: '生成缩略图', onPress: () => handleGenerateThumbnail(videoFile) },
        { text: '收藏', onPress: () => handleToggleFavorite(videoFile) },
        { text: '删除', style: 'destructive', onPress: () => handleDeleteVideo(videoFile) },
        { text: '详情', onPress: () => handleShowVideoDetails(videoFile) },
      ]
    );
  };

  const handlePlayVideo = async (videoFile: FileItem) => {
    try {
      setSelectedVideo(videoFile);
      setShowVideoModal(true);
    } catch (error) {
      Alert.alert('错误', `播放失败: ${error.message}`);
    }
  };

  const handleGenerateThumbnail = async (videoFile: FileItem) => {
    try {
      await generateThumbnail(videoFile.id);
      Alert.alert('成功', '缩略图生成成功');
      await loadVideos();
    } catch (error) {
      Alert.alert('错误', `生成缩略图失败: ${error.message}`);
    }
  };

  const handleToggleFavorite = async (videoFile: FileItem) => {
    try {
      await toggleFavorite(videoFile.id);
      await loadVideos();
    } catch (error) {
      Alert.alert('错误', `操作失败: ${error.message}`);
    }
  };

  const handleDeleteVideo = async (videoFile: FileItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除视频 "${videoFile.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFile(videoFile.id);
              Alert.alert('成功', '视频已删除');
              await loadVideos();
            } catch (error) {
              Alert.alert('错误', `删除失败: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleShowVideoDetails = (videoFile: FileItem) => {
    Alert.alert(
      '视频详情',
      `名称: ${videoFile.name}\n大小: ${formatFileSize(videoFile.size)}\n类型: ${videoFile.mimeType}\n创建时间: ${videoFile.createdAt.toLocaleString()}\n修改时间: ${videoFile.modifiedAt.toLocaleString()}`,
      [{ text: '确定' }]
    );
  };

  const handleImportVideos = async (uris: string[]) => {
    try {
      await importMultipleVideos(uris);
      setShowImportModal(false);
      Alert.alert('成功', `已导入 ${uris.length} 个视频`);
      await loadVideos();
    } catch (error) {
      Alert.alert('错误', `导入失败: ${error.message}`);
    }
  };

  const handleVideoPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setPlaybackStatus(status);
  };

  const handleVideoLoad = async () => {
    if (video && selectedVideo) {
      try {
        await video.loadAsync({ uri: selectedVideo.uri });
        await video.playAsync();
      } catch (error) {
        console.error('视频加载失败:', error);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const renderVideoItem = ({ item }: { item: FileItem }) => {
    const isSelected = selectedFiles.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.videoItem,
          isSelected && styles.selectedVideoItem,
        ]}
        onPress={() => handleVideoPress(item)}
        onLongPress={() => handleVideoLongPress(item)}
      >
        <View style={styles.videoThumbnail}>
          {item.thumbnailUri ? (
            <Image
              source={{ uri: item.thumbnailUri }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="videocam" size={32} color="#6C757D" />
            </View>
          )}
          <View style={styles.videoDuration}>
            <Text style={styles.durationText}>
              {item.metadata?.duration ? formatDuration(item.metadata.duration) : '00:00'}
            </Text>
          </View>
        </View>
        
        <View style={styles.videoInfo}>
          <Text style={styles.videoName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.videoDetails}>
            {formatFileSize(item.size)}
          </Text>
          <Text style={styles.videoDetails}>
            {item.createdAt.toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.videoActions}>
          {item.isFavorite && (
            <Ionicons name="star" size={16} color="#FFC107" />
          )}
          <Ionicons name="play-circle" size={24} color="#007AFF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 顶部工具栏 */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>
          视频管理 ({videos.length} 个视频)
        </Text>
        <TouchableOpacity
          style={styles.importButton}
          onPress={() => setShowImportModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.importButtonText}>导入</Text>
        </TouchableOpacity>
      </View>

      {/* 批量操作栏 */}
      {allowMultiSelect && selectedFiles.length > 0 && (
        <View style={styles.bulkActionsBar}>
          <Text style={styles.bulkActionsText}>
            已选择 {selectedFiles.length} 个视频
          </Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSelection}
          >
            <Text style={styles.clearButtonText}>清除选择</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 错误提示 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 视频列表 */}
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.videoList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off" size={48} color="#6C757D" />
            <Text style={styles.emptyText}>
              {isLoading ? '加载中...' : '暂无视频文件'}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowImportModal(true)}
            >
              <Text style={styles.emptyButtonText}>导入视频</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 视频播放模态框 */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVideoModal(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.videoModalTitle}>
              {selectedVideo?.name}
            </Text>
          </View>
          
          {selectedVideo && (
            <Video
              ref={(ref) => setVideo(ref)}
              style={styles.videoPlayer}
              source={{ uri: selectedVideo.uri }}
              useNativeControls
              resizeMode="contain"
              isLooping={false}
              onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
              onLoad={handleVideoLoad}
            />
          )}
          
          {selectedVideo && (
            <View style={styles.videoModalInfo}>
              <ScrollView>
                <Text style={styles.infoText}>
                  名称: {selectedVideo.name}
                </Text>
                <Text style={styles.infoText}>
                  大小: {formatFileSize(selectedVideo.size)}
                </Text>
                <Text style={styles.infoText}>
                  类型: {selectedVideo.mimeType}
                </Text>
                <Text style={styles.infoText}>
                  创建时间: {selectedVideo.createdAt.toLocaleString()}
                </Text>
                {selectedVideo.metadata && (
                  <>
                    <Text style={styles.infoText}>
                      时长: {selectedVideo.metadata.duration ? formatDuration(selectedVideo.metadata.duration) : '未知'}
                    </Text>
                    <Text style={styles.infoText}>
                      分辨率: {selectedVideo.metadata.width}x{selectedVideo.metadata.height}
                    </Text>
                    <Text style={styles.infoText}>
                      编码: {selectedVideo.metadata.codec}
                    </Text>
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* 导入模态框 */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>导入视频</Text>
            
            <TouchableOpacity
              style={styles.importOption}
              onPress={() => {
                // 实现从相册导入
                setShowImportModal(false);
              }}
            >
              <Ionicons name="images" size={24} color="#007AFF" />
              <Text style={styles.importOptionText}>从相册导入</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.importOption}
              onPress={() => {
                // 实现从文件系统导入
                setShowImportModal(false);
              }}
            >
              <Ionicons name="document" size={24} color="#007AFF" />
              <Text style={styles.importOptionText}>从文件系统导入</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.importOption}
              onPress={() => {
                // 实现从相机拍摄
                setShowImportModal(false);
              }}
            >
              <Ionicons name="camera" size={24} color="#007AFF" />
              <Text style={styles.importOptionText}>拍摄视频</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImportModal(false)}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  toolbarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
  },
  bulkActionsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#F8D7DA',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#721C24',
    fontSize: 14,
  },
  videoList: {
    padding: 8,
  },
  videoItem: {
    flex: 1,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedVideoItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  videoThumbnail: {
    position: 'relative',
    height: 120,
    backgroundColor: '#f8f9fa',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 8,
  },
  videoName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  videoDetails: {
    fontSize: 10,
    color: '#6c757d',
    marginBottom: 1,
  },
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 4,
  },
  videoModalTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    textAlign: 'center',
  },
  videoPlayer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoModalInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    maxHeight: 200,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  importOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  importOptionText: {
    fontSize: 16,
    color: '#212529',
    marginLeft: 12,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#6c757d',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});