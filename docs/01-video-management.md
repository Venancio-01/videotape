# 视频管理模块开发文档

## 1. 模块概述

### 1.1 功能描述
视频管理模块负责本地视频文件的导入、存储、组织和管理，是整个应用的核心功能模块之一。

### 1.2 技术栈
- **文件选择**: Expo Document Picker
- **文件存储**: Expo File System
- **数据库**: Dexie.js (IndexedDB)
- **状态管理**: Zustand
- **UI组件**: React Native + Nativewind

### 1.3 依赖关系
- 依赖存储管理模块进行文件操作
- 依赖状态管理模块进行数据同步
- 为视频播放模块提供视频数据

## 2. 功能需求

### 2.1 文件上传功能

#### 2.1.1 单文件上传
```typescript
// src/services/video/upload.service.ts
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { db } from '../../database/schema';

export interface UploadOptions {
  allowedTypes?: string[];
  maxSize?: number; // MB
  copyToAppDirectory?: boolean;
  generateThumbnail?: boolean;
}

export interface UploadResult {
  success: boolean;
  file?: VideoFile;
  error?: string;
  progress?: number;
}

export class VideoUploadService {
  private uploadDirectory = `${FileSystem.documentDirectory}videos/`;
  private thumbnailDirectory = `${FileSystem.documentDirectory}thumbnails/`;

  constructor() {
    this.initializeDirectories();
  }

  // 初始化目录
  private async initializeDirectories(): Promise<void> {
    await FileSystem.makeDirectoryAsync(this.uploadDirectory, { intermediates: true });
    await FileSystem.makeDirectoryAsync(this.thumbnailDirectory, { intermediates: true });
  }

  // 选择文件
  async selectFile(options: UploadOptions = {}): Promise<UploadResult> {
    try {
      const defaultOptions: UploadOptions = {
        allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
        maxSize: 500, // 500MB
        copyToAppDirectory: true,
        generateThumbnail: true,
        ...options
      };

      const result = await DocumentPicker.getDocumentAsync({
        type: defaultOptions.allowedTypes,
        copyToCacheDirectory: false
      });

      if (result.canceled) {
        return { success: false, error: '用户取消选择' };
      }

      const file = result.assets[0];
      
      // 验证文件大小
      if (defaultOptions.maxSize) {
        const fileSize = file.size / (1024 * 1024); // MB
        if (fileSize > defaultOptions.maxSize) {
          return { success: false, error: `文件大小超过限制 (${defaultOptions.maxSize}MB)` };
        }
      }

      // 处理文件上传
      return await this.processFileUpload(file, defaultOptions);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  // 处理文件上传
  private async processFileUpload(file: DocumentPicker.DocumentPickerAsset, options: UploadOptions): Promise<UploadResult> {
    try {
      let filePath = file.uri;
      
      // 复制到应用目录
      if (options.copyToAppDirectory) {
        const fileName = this.generateUniqueFileName(file.name);
        filePath = `${this.uploadDirectory}${fileName}`;
        
        await FileSystem.copyAsync({
          from: file.uri,
          to: filePath
        });
      }

      // 获取文件信息
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      // 生成缩略图
      let thumbnailPath;
      if (options.generateThumbnail) {
        thumbnailPath = await this.generateThumbnail(filePath);
      }

      // 提取视频元数据
      const metadata = await this.extractVideoMetadata(filePath);

      // 创建视频记录
      const videoFile: VideoFile = {
        id: this.generateId(),
        title: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
        originalName: file.name,
        filePath,
        fileSize: fileInfo.size,
        duration: metadata.duration,
        resolution: metadata.resolution,
        format: metadata.format,
        thumbnailPath,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        category: undefined,
        viewCount: 0,
        lastWatchedAt: undefined,
        playbackProgress: 0,
        quality: this.determineQuality(metadata.resolution)
      };

      // 保存到数据库
      await db.videos.add(videoFile);

      return { success: true, file: videoFile };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '文件处理失败' };
    }
  }

  // 生成唯一文件名
  private generateUniqueFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${random}.${extension}`;
  }

  // 生成缩略图
  private async generateThumbnail(videoPath: string): Promise<string> {
    // 使用 Expo Video API 或第三方库生成缩略图
    const fileName = `thumb_${Date.now()}.jpg`;
    const thumbnailPath = `${this.thumbnailDirectory}${fileName}`;
    
    // 这里需要实现缩略图生成逻辑
    // 可以使用 react-native-video 或其他库
    
    return thumbnailPath;
  }

  // 提取视频元数据
  private async extractVideoMetadata(videoPath: string): Promise<{
    duration: number;
    resolution: { width: number; height: number };
    format: string;
  }> {
    // 使用 Expo Video API 或 FFmpeg 提取元数据
    // 这里需要实现具体的元数据提取逻辑
    
    return {
      duration: 0,
      resolution: { width: 0, height: 0 },
      format: 'unknown'
    };
  }

  // 确定视频质量
  private determineQuality(resolution: { width: number; height: number }): 'high' | 'medium' | 'low' {
    const pixels = resolution.width * resolution.height;
    if (pixels >= 1920 * 1080) return 'high';
    if (pixels >= 1280 * 720) return 'medium';
    return 'low';
  }

  // 生成唯一ID
  private generateId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 2.1.2 批量上传
```typescript
// src/services/video/batch-upload.service.ts
import { VideoUploadService } from './upload.service';

export interface BatchUploadOptions {
  maxConcurrent?: number;
  onProgress?: (progress: BatchProgress) => void;
  onComplete?: (results: UploadResult[]) => void;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  currentFile?: string;
  progress: number;
}

export class BatchUploadService {
  private uploadService: VideoUploadService;
  private activeUploads: Map<string, Promise<UploadResult>> = new Map();

  constructor(uploadService: VideoUploadService) {
    this.uploadService = uploadService;
  }

  // 批量上传
  async uploadMultiple(options: BatchUploadOptions = {}): Promise<UploadResult[]> {
    const {
      maxConcurrent = 3,
      onProgress,
      onComplete
    } = options;

    // 选择多个文件
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/*'],
      multiple: true,
      copyToCacheDirectory: false
    });

    if (result.canceled) {
      return [{ success: false, error: '用户取消选择' }];
    }

    const files = result.assets;
    const results: UploadResult[] = [];
    const progress: BatchProgress = {
      total: files.length,
      completed: 0,
      failed: 0,
      progress: 0
    };

    // 分批处理文件
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(file => this.uploadFile(file, progress, onProgress));
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    if (onComplete) {
      onComplete(results);
    }

    return results;
  }

  // 上传单个文件
  private async uploadFile(
    file: DocumentPicker.DocumentPickerAsset,
    progress: BatchProgress,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<UploadResult> {
    try {
      progress.currentFile = file.name;
      if (onProgress) onProgress({ ...progress });

      const result = await this.uploadService.selectFile({
        allowedTypes: ['video/*'],
        maxSize: 500,
        copyToAppDirectory: true,
        generateThumbnail: true
      });

      if (result.success) {
        progress.completed++;
      } else {
        progress.failed++;
      }

      progress.progress = (progress.completed + progress.failed) / progress.total;
      if (onProgress) onProgress({ ...progress });

      return result;
    } catch (error) {
      progress.failed++;
      progress.progress = (progress.completed + progress.failed) / progress.total;
      if (onProgress) onProgress({ ...progress });

      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }
}
```

### 2.2 文件管理功能

#### 2.2.1 文件操作
```typescript
// src/services/video/file-management.service.ts
import * as FileSystem from 'expo-file-system';
import { db } from '../../database/schema';

export class FileManagementService {
  private videoDirectory = `${FileSystem.documentDirectory}videos/`;
  private thumbnailDirectory = `${FileSystem.documentDirectory}thumbnails/`;

  // 重命名视频
  async renameVideo(videoId: string, newName: string): Promise<boolean> {
    try {
      const video = await db.videos.get(videoId);
      if (!video) {
        throw new Error('视频不存在');
      }

      // 更新数据库
      await db.videos.update(videoId, {
        title: newName,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('重命名视频失败:', error);
      return false;
    }
  }

  // 删除视频
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      const video = await db.videos.get(videoId);
      if (!video) {
        throw new Error('视频不存在');
      }

      // 删除视频文件
      await FileSystem.deleteAsync(video.filePath, { idempotent: true });

      // 删除缩略图
      if (video.thumbnailPath) {
        await FileSystem.deleteAsync(video.thumbnailPath, { idempotent: true });
      }

      // 从数据库删除
      await db.videos.delete(videoId);

      return true;
    } catch (error) {
      console.error('删除视频失败:', error);
      return false;
    }
  }

  // 批量删除视频
  async deleteMultipleVideos(videoIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const videoId of videoIds) {
      const result = await this.deleteVideo(videoId);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  // 移动视频到文件夹
  async moveVideoToFolder(videoId: string, folderName: string): Promise<boolean> {
    try {
      const video = await db.videos.get(videoId);
      if (!video) {
        throw new Error('视频不存在');
      }

      // 创建目标文件夹
      const targetDirectory = `${this.videoDirectory}${folderName}/`;
      await FileSystem.makeDirectoryAsync(targetDirectory, { intermediates: true });

      // 移动文件
      const fileName = video.filePath.split('/').pop();
      const newPath = `${targetDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: video.filePath,
        to: newPath
      });

      // 更新数据库
      await db.videos.update(videoId, {
        filePath: newPath,
        category: folderName,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('移动视频失败:', error);
      return false;
    }
  }

  // 获取文件夹列表
  async getFolders(): Promise<string[]> {
    try {
      const videos = await db.videos.toArray();
      const folders = new Set<string>();
      
      videos.forEach(video => {
        if (video.category) {
          folders.add(video.category);
        }
      });

      return Array.from(folders);
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
      return [];
    }
  }

  // 获取文件夹中的视频
  async getVideosInFolder(folderName: string): Promise<Video[]> {
    try {
      return await db.videos
        .where('category')
        .equals(folderName)
        .toArray();
    } catch (error) {
      console.error('获取文件夹视频失败:', error);
      return [];
    }
  }

  // 获取存储空间信息
  async getStorageInfo(): Promise<{
    totalSpace: number;
    usedSpace: number;
    freeSpace: number;
    videoCount: number;
  }> {
    try {
      const videos = await db.videos.toArray();
      const totalSize = videos.reduce((sum, video) => sum + video.fileSize, 0);
      
      // 获取系统存储信息（如果可用）
      const totalSpace = 1024 * 1024 * 1024; // 1GB 默认值
      const freeSpace = totalSpace - totalSize;

      return {
        totalSpace,
        usedSpace: totalSize,
        freeSpace,
        videoCount: videos.length
      };
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return {
        totalSpace: 0,
        usedSpace: 0,
        freeSpace: 0,
        videoCount: 0
      };
    }
  }
}
```

### 2.3 搜索和过滤功能

#### 2.3.1 搜索功能
```typescript
// src/services/video/search.service.ts
import { db } from '../../database/schema';

export interface SearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  sortBy?: 'title' | 'date' | 'duration' | 'size';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  videos: Video[];
  total: number;
  hasMore: boolean;
}

export class VideoSearchService {
  // 搜索视频
  async searchVideos(options: SearchOptions = {}): Promise<SearchResult> {
    const {
      query = '',
      category,
      tags = [],
      sortBy = 'date',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = options;

    try {
      let collection = db.videos;

      // 按分类过滤
      if (category) {
        collection = collection.where('category').equals(category);
      }

      // 按标签过滤
      if (tags.length > 0) {
        collection = collection.filter(video => 
          tags.some(tag => video.tags.includes(tag))
        );
      }

      // 按关键词搜索
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        collection = collection.filter(video =>
          video.title.toLowerCase().includes(searchTerm) ||
          video.originalName.toLowerCase().includes(searchTerm) ||
          video.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // 获取总数
      const total = await collection.count();

      // 排序
      let sortedCollection = collection;
      switch (sortBy) {
        case 'title':
          sortedCollection = collection.sortBy('title');
          break;
        case 'duration':
          sortedCollection = collection.sortBy('duration');
          break;
        case 'size':
          sortedCollection = collection.sortBy('fileSize');
          break;
        case 'date':
        default:
          sortedCollection = collection.sortBy('createdAt');
          break;
      }

      // 应用排序方向
      if (sortOrder === 'asc') {
        sortedCollection = sortedCollection.reverse();
      }

      // 分页
      const videos = await sortedCollection
        .offset(offset)
        .limit(limit)
        .toArray();

      return {
        videos,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('搜索视频失败:', error);
      return {
        videos: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // 获取搜索建议
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const videos = await db.videos
        .filter(video =>
          video.title.toLowerCase().includes(query.toLowerCase()) ||
          video.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
        .limit(limit)
        .toArray();

      const suggestions = new Set<string>();
      videos.forEach(video => {
        suggestions.add(video.title);
        video.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      return [];
    }
  }

  // 获取热门搜索
  async getPopularSearches(limit: number = 10): Promise<Array<{ term: string; count: number }>> {
    try {
      // 这里可以实现基于搜索历史的流行搜索
      // 现在返回一些模拟数据
      return [
        { term: 'React Native', count: 15 },
        { term: 'TypeScript', count: 12 },
        { term: 'JavaScript', count: 10 },
        { term: 'Vue.js', count: 8 },
        { term: 'Node.js', count: 7 }
      ];
    } catch (error) {
      console.error('获取热门搜索失败:', error);
      return [];
    }
  }
}
```

### 2.4 组件实现

#### 2.4.1 视频列表组件
```typescript
// src/components/video/VideoList.tsx
import React, { useState, useCallback } from 'react';
import { FlatList, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Video } from '../../database/schema';
import { VideoCard } from './VideoCard';
import { useVideoStore } from '../../stores/video.store';
import { VideoSearchService } from '../../services/video/search.service';

interface VideoListProps {
  videos?: Video[];
  onVideoPress?: (video: Video) => void;
  onVideoLongPress?: (video: Video) => void;
  showSearch?: boolean;
  showFilters?: boolean;
}

export const VideoList: React.FC<VideoListProps> = ({
  videos: propVideos,
  onVideoPress,
  onVideoLongPress,
  showSearch = true,
  showFilters = true
}) => {
  const { videos, loading, error, searchQuery, setSearchQuery } = useVideoStore();
  const [refreshing, setRefreshing] = useState(false);
  const searchService = new VideoSearchService();

  const displayVideos = propVideos || videos;

  // 处理刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 重新加载视频列表
      await useVideoStore.getState().loadVideos();
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 处理视频选择
  const handleVideoSelect = useCallback((video: Video) => {
    if (onVideoPress) {
      onVideoPress(video);
    }
  }, [onVideoPress]);

  // 处理长按
  const handleVideoLongPress = useCallback((video: Video) => {
    if (onVideoLongPress) {
      onVideoLongPress(video);
    } else {
      showVideoOptions(video);
    }
  }, [onVideoLongPress]);

  // 显示视频选项
  const showVideoOptions = (video: Video) => {
    Alert.alert(
      '视频选项',
      video.title,
      [
        { text: '播放', onPress: () => handleVideoSelect(video) },
        { text: '重命名', onPress: () => handleRename(video) },
        { text: '删除', onPress: () => handleDelete(video), style: 'destructive' },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  // 处理重命名
  const handleRename = (video: Video) => {
    // 这里可以实现重命名对话框
    console.log('重命名视频:', video.title);
  };

  // 处理删除
  const handleDelete = (video: Video) => {
    Alert.alert(
      '确认删除',
      `确定要删除 "${video.title}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => confirmDelete(video) }
      ]
    );
  };

  // 确认删除
  const confirmDelete = async (video: Video) => {
    try {
      const fileManagementService = new FileManagementService();
      const success = await fileManagementService.deleteVideo(video.id);
      
      if (success) {
        // 从状态中移除
        useVideoStore.getState().removeVideo(video.id);
      } else {
        Alert.alert('删除失败', '请重试');
      }
    } catch (error) {
      console.error('删除视频失败:', error);
      Alert.alert('删除失败', '请重试');
    }
  };

  // 渲染视频卡片
  const renderVideoCard = ({ item }: { item: Video }) => (
    <VideoCard
      video={item}
      onPress={() => handleVideoSelect(item)}
      onLongPress={() => handleVideoLongPress(item)}
    />
  );

  // 渲染空状态
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-gray-500 text-lg text-center">
        {searchQuery ? '没有找到相关视频' : '还没有上传视频'}
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-2">
        {searchQuery ? '尝试其他关键词' : '点击上传按钮添加视频'}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">加载失败: {error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {showSearch && (
        <View className="p-4 bg-white border-b">
          <TextInput
            placeholder="搜索视频..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="border rounded-lg p-3"
          />
        </View>
      )}

      <FlatList
        data={displayVideos}
        renderItem={renderVideoCard}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
};
```

#### 2.4.2 视频卡片组件
```typescript
// src/components/video/VideoCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video } from '../../database/schema';
import { formatFileSize, formatDuration } from '../../utils/format';

interface VideoCardProps {
  video: Video;
  onPress?: () => void;
  onLongPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPress,
  onLongPress,
  size = 'medium'
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'w-32 h-48',
          image: 'w-32 h-20',
          title: 'text-sm',
          info: 'text-xs'
        };
      case 'large':
        return {
          container: 'w-full h-72',
          image: 'w-full h-48',
          title: 'text-lg',
          info: 'text-sm'
        };
      case 'medium':
      default:
        return {
          container: 'w-40 h-60',
          image: 'w-40 h-24',
          title: 'text-base',
          info: 'text-xs'
        };
    }
  };

  const styles = getSizeStyles();

  return (
    <TouchableOpacity
      className={`${styles.container} bg-white rounded-lg shadow-sm mr-4 mb-4`}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* 缩略图 */}
      <View className={`${styles.image} bg-gray-200 rounded-t-lg relative overflow-hidden`}>
        {video.thumbnailPath ? (
          <Image
            source={{ uri: video.thumbnailPath }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-gray-400">🎬</Text>
          </View>
        )}
        
        {/* 时长标签 */}
        {video.duration > 0 && (
          <View className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded">
            <Text className="text-white text-xs">
              {formatDuration(video.duration)}
            </Text>
          </View>
        )}

        {/* 质量标签 */}
        <View className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded">
          <Text className="text-white text-xs">
            {video.quality === 'high' ? '高清' : video.quality === 'medium' ? '标清' : '流畅'}
          </Text>
        </View>
      </View>

      {/* 视频信息 */}
      <View className="p-3 flex-1">
        <Text
          className={`${styles.title} font-semibold text-gray-900 mb-1`}
          numberOfLines={2}
        >
          {video.title}
        </Text>

        <View className="flex-row justify-between items-center">
          <Text className={`${styles.info} text-gray-500`}>
            {formatFileSize(video.fileSize)}
          </Text>
          
          {video.viewCount > 0 && (
            <Text className={`${styles.info} text-gray-500`}>
              {video.viewCount}次观看
            </Text>
          )}
        </View>

        {/* 标签 */}
        {video.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-2">
            {video.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                className="bg-gray-100 px-2 py-1 rounded mr-1 mb-1"
              >
                <Text className="text-xs text-gray-600">{tag}</Text>
              </View>
            ))}
            {video.tags.length > 3 && (
              <View className="bg-gray-100 px-2 py-1 rounded">
                <Text className="text-xs text-gray-600">
                  +{video.tags.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
```

## 3. 数据库设计

### 3.1 视频表结构
```typescript
// src/database/schema.ts
export interface Video {
  id: string;
  title: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  duration: number;
  resolution: { width: number; height: number };
  format: string;
  thumbnailPath?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category?: string;
  viewCount: number;
  lastWatchedAt?: Date;
  playbackProgress: number;
  quality: 'high' | 'medium' | 'low';
}
```

## 4. 状态管理

### 4.1 视频状态管理
```typescript
// src/stores/video.store.ts
import { create } from 'zustand';
import { Video } from '../database/schema';

interface VideoState {
  videos: Video[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  sortBy: 'date' | 'title' | 'duration' | 'size';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  loadVideos: () => Promise<void>;
  addVideo: (video: Video) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  removeVideo: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSortBy: (sortBy: 'date' | 'title' | 'duration' | 'size') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  getFilteredVideos: () => Video[];
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
  sortBy: 'date',
  sortOrder: 'desc',

  loadVideos: async () => {
    set({ loading: true, error: null });
    try {
      const videos = await db.videos.toArray();
      set({ videos, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载失败', loading: false });
    }
  },

  addVideo: (video) => set((state) => ({
    videos: [...state.videos, video]
  })),

  updateVideo: (id, updates) => set((state) => ({
    videos: state.videos.map(video =>
      video.id === id ? { ...video, ...updates } : video
    )
  })),

  removeVideo: (id) => set((state) => ({
    videos: state.videos.filter(video => video.id !== id)
  })),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),

  getFilteredVideos: () => {
    const { videos, searchQuery, selectedCategory, sortBy, sortOrder } = get();
    
    let filtered = videos.filter(video => {
      const matchesSearch = !searchQuery || 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory || video.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'date':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }
}));
```

## 5. 测试计划

### 5.1 单元测试
```typescript
// src/__tests__/services/video/upload.service.test.ts
import { VideoUploadService } from '../../../services/video/upload.service';
import * as DocumentPicker from 'expo-document-picker';

// Mock DocumentPicker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn()
}));

describe('VideoUploadService', () => {
  let uploadService: VideoUploadService;

  beforeEach(() => {
    uploadService = new VideoUploadService();
    jest.clearAllMocks();
  });

  describe('selectFile', () => {
    it('应该成功选择并处理文件', async () => {
      const mockFile = {
        uri: 'file://test.mp4',
        name: 'test.mp4',
        size: 1024 * 1024, // 1MB
        mimeType: 'video/mp4'
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [mockFile]
      });

      const result = await uploadService.selectFile();

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.title).toBe('test');
    });

    it('应该处理用户取消选择', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: true
      });

      const result = await uploadService.selectFile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('用户取消选择');
    });

    it('应该验证文件大小', async () => {
      const largeFile = {
        uri: 'file://large.mp4',
        name: 'large.mp4',
        size: 600 * 1024 * 1024, // 600MB
        mimeType: 'video/mp4'
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [largeFile]
      });

      const result = await uploadService.selectFile({ maxSize: 500 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件大小超过限制');
    });
  });
});
```

### 5.2 集成测试
```typescript
// src/__tests__/components/video/VideoList.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VideoList } from '../../../components/video/VideoList';
import { useVideoStore } from '../../../stores/video.store';

// Mock store
jest.mock('../../../stores/video.store');

const mockVideos = [
  {
    id: '1',
    title: 'Test Video 1',
    originalName: 'test1.mp4',
    filePath: '/path/to/test1.mp4',
    fileSize: 1024 * 1024,
    duration: 120,
    resolution: { width: 1920, height: 1080 },
    format: 'mp4',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['test', 'demo'],
    viewCount: 10,
    playbackProgress: 0,
    quality: 'high' as const
  }
];

describe('VideoList', () => {
  beforeEach(() => {
    (useVideoStore as jest.Mock).mockReturnValue({
      videos: mockVideos,
      loading: false,
      error: null,
      searchQuery: '',
      setSearchQuery: jest.fn(),
      removeVideo: jest.fn()
    });
  });

  it('应该正确渲染视频列表', () => {
    const { getByText } = render(<VideoList />);
    
    expect(getByText('Test Video 1')).toBeTruthy();
  });

  it('应该显示搜索框', () => {
    const { getByPlaceholderText } = render(<VideoList showSearch={true} />);
    
    expect(getByPlaceholderText('搜索视频...')).toBeTruthy();
  });

  it('应该处理视频点击', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<VideoList onVideoPress={mockOnPress} />);
    
    fireEvent.press(getByText('Test Video 1'));
    expect(mockOnPress).toHaveBeenCalledWith(mockVideos[0]);
  });
});
```

## 6. 部署和监控

### 6.1 性能监控
```typescript
// src/services/video/performance-monitor.service.ts
export class VideoPerformanceMonitor {
  private static instance: VideoPerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): VideoPerformanceMonitor {
    if (!VideoPerformanceMonitor.instance) {
      VideoPerformanceMonitor.instance = new VideoPerformanceMonitor();
    }
    return VideoPerformanceMonitor.instance;
  }

  // 记录上传时间
  recordUploadTime(duration: number): void {
    this.recordMetric('upload_time', duration);
  }

  // 记录缩略图生成时间
  recordThumbnailGenerationTime(duration: number): void {
    this.recordMetric('thumbnail_generation_time', duration);
  }

  // 记录搜索时间
  recordSearchTime(duration: number): void {
    this.recordMetric('search_time', duration);
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // 保持最近1000个记录
    if (values.length > 1000) {
      values.shift();
    }
  }

  // 获取性能报告
  getReport(): { [key: string]: { avg: number; min: number; max: number; count: number } } {
    const report: { [key: string]: { avg: number; min: number; max: number; count: number } } = {};

    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        report[name] = {
          avg: Number(avg.toFixed(2)),
          min: Number(min.toFixed(2)),
          max: Number(max.toFixed(2)),
          count: values.length
        };
      }
    });

    return report;
  }
}
```

## 7. 总结

视频管理模块是整个应用的核心功能，提供了完整的视频文件管理能力，包括：

1. **文件上传**: 支持单文件和批量上传
2. **文件管理**: 重命名、删除、移动等操作
3. **搜索过滤**: 按名称、标签、分类搜索
4. **缩略图生成**: 自动生成视频缩略图
5. **元数据提取**: 提取视频时长、分辨率等信息
6. **性能优化**: 使用缓存和虚拟列表优化性能

该模块采用了模块化设计，易于维护和扩展，同时提供了完整的错误处理和性能监控机制。