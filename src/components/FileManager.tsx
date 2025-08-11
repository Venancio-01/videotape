/**
 * 文件管理主界面组件
 * 集成文件选择器和文件列表的主要界面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useFileStore } from '../stores/fileStore';
import { FilePicker } from './FilePicker';
import { FileList } from './FileList';
import { FileItem, DirectoryItem } from '../types/file';
import { Ionicons } from '@expo/vector-icons';
import { initializeFileStore } from '../stores/fileStore';

const { width } = Dimensions.get('window');

interface FileManagerProps {
  initialPath?: string;
  allowMultiSelect?: boolean;
  maxFiles?: number;
  onFilesSelected?: (files: FileItem[]) => void;
  onDirectoryChanged?: (path: string) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  initialPath = '',
  allowMultiSelect = false,
  maxFiles = 10,
  onFilesSelected,
  onDirectoryChanged,
}) => {
  const {
    files,
    directories,
    selectedFiles,
    isLoading,
    error,
    currentPath,
    uploadFile,
    importVideo,
    importMultipleVideos,
    navigateTo,
    navigateUp,
    navigateHome,
    refreshAll,
    bulkDelete,
    bulkCopy,
    bulkMove,
    bulkFavorite,
    clearSelection,
  } = useFileStore();

  const [initialized, setInitialized] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modifiedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeFileStore();
        setInitialized(true);
        if (initialPath) {
          await navigateTo(initialPath);
        }
      } catch (error) {
        console.error('初始化失败:', error);
        Alert.alert('错误', '初始化文件管理器失败');
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (onDirectoryChanged) {
      onDirectoryChanged(currentPath);
    }
  }, [currentPath, onDirectoryChanged]);

  useEffect(() => {
    if (onFilesSelected && selectedFiles.length > 0) {
      const selectedFileObjects = files.filter(file => 
        selectedFiles.includes(file.id)
      );
      onFilesSelected(selectedFileObjects);
    }
  }, [selectedFiles, files, onFilesSelected]);

  const handleFilePress = (file: FileItem) => {
    // 根据文件类型处理点击事件
    if (file.type === 'video') {
      // 处理视频播放
      Alert.alert('视频文件', `播放视频: ${file.name}`);
    } else if (file.type === 'image') {
      // 处理图片查看
      Alert.alert('图片文件', `查看图片: ${file.name}`);
    } else if (file.type === 'audio') {
      // 处理音频播放
      Alert.alert('音频文件', `播放音频: ${file.name}`);
    } else {
      // 处理其他文件
      Alert.alert('文件信息', `文件名: ${file.name}\n大小: ${formatFileSize(file.size)}\n类型: ${file.mimeType}`);
    }
  };

  const handleDirectoryPress = (directory: DirectoryItem) => {
    navigateTo(directory.path);
  };

  const handleFileLongPress = (file: FileItem) => {
    // 长按显示上下文菜单
    Alert.alert(
      '文件操作',
      file.name,
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => handleDeleteFile(file) },
        { text: '重命名', onPress: () => handleRenameFile(file) },
        { text: '分享', onPress: () => handleShareFile(file) },
        { text: '详情', onPress: () => handleShowFileDetails(file) },
      ]
    );
  };

  const handleDeleteFile = async (file: FileItem) => {
    try {
      await bulkDelete([file.id]);
      Alert.alert('成功', '文件已删除');
    } catch (error) {
      Alert.alert('错误', `删除失败: ${error.message}`);
    }
  };

  const handleRenameFile = (file: FileItem) => {
    Alert.prompt(
      '重命名文件',
      '请输入新的文件名:',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: (newName) => handleConfirmRename(file, newName) },
      ],
      'plain-text',
      file.name
    );
  };

  const handleConfirmRename = async (file: FileItem, newName: string) => {
    if (!newName.trim()) {
      Alert.alert('错误', '文件名不能为空');
      return;
    }

    try {
      // 实现重命名逻辑
      Alert.alert('成功', '文件已重命名');
    } catch (error) {
      Alert.alert('错误', `重命名失败: ${error.message}`);
    }
  };

  const handleShareFile = async (file: FileItem) => {
    try {
      // 实现分享逻辑
      Alert.alert('分享', `分享文件: ${file.name}`);
    } catch (error) {
      Alert.alert('错误', `分享失败: ${error.message}`);
    }
  };

  const handleShowFileDetails = (file: FileItem) => {
    Alert.alert(
      '文件详情',
      `名称: ${file.name}\n大小: ${formatFileSize(file.size)}\n类型: ${file.mimeType}\n创建时间: ${file.createdAt.toLocaleString()}\n修改时间: ${file.modifiedAt.toLocaleString()}`,
      [{ text: '确定' }]
    );
  };

  const handleFilesSelected = (selectedFiles: FileItem[]) => {
    if (onFilesSelected) {
      onFilesSelected(selectedFiles);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // 实现搜索逻辑
  };

  const handleRefresh = async () => {
    try {
      await refreshAll();
    } catch (error) {
      Alert.alert('错误', `刷新失败: ${error.message}`);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'copy' | 'move' | 'favorite') => {
    if (selectedFiles.length === 0) {
      Alert.alert('提示', '请先选择文件');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          await bulkDelete(selectedFiles);
          Alert.alert('成功', `已删除 ${selectedFiles.length} 个文件`);
          clearSelection();
          break;
        case 'copy':
          // 实现批量复制
          Alert.alert('提示', '请选择目标文件夹');
          break;
        case 'move':
          // 实现批量移动
          Alert.alert('提示', '请选择目标文件夹');
          break;
        case 'favorite':
          await bulkFavorite(selectedFiles, true);
          Alert.alert('成功', `已收藏 ${selectedFiles.length} 个文件`);
          clearSelection();
          break;
      }
    } catch (error) {
      Alert.alert('错误', `操作失败: ${error.message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBreadcrumbItems = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const items = [{ name: '首页', path: '' }];
    
    let currentPath = '';
    for (const part of parts) {
      currentPath += '/' + part;
      items.push({ name: part, path: currentPath });
    }
    
    return items;
  };

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>初始化中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <View style={styles.breadcrumb}>
          {getBreadcrumbItems().map((item, index) => (
            <TouchableOpacity
              key={item.path}
              style={styles.breadcrumbItem}
              onPress={() => navigateTo(item.path)}
            >
              <Text style={styles.breadcrumbText}>
                {item.name}
              </Text>
              {index < getBreadcrumbItems().length - 1 && (
                <Text style={styles.breadcrumbSeparator}>/</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <Ionicons 
              name={viewMode === 'list' ? 'grid' : 'list'} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 搜索栏 */}
      {showSearch && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索文件..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={true}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(false)}
          >
            <Ionicons name="close" size={20} color="#6C757D" />
          </TouchableOpacity>
        </View>
      )}

      {/* 统计信息 */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {files.length} 个文件, {directories.length} 个文件夹
        </Text>
        <Text style={styles.statsText}>
          总大小: {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
        </Text>
      </View>

      {/* 批量操作栏 */}
      {allowMultiSelect && selectedFiles.length > 0 && (
        <View style={styles.bulkActionsBar}>
          <Text style={styles.bulkActionsText}>
            已选择 {selectedFiles.length} 个文件
          </Text>
          <View style={styles.bulkActionsButtons}>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction('delete')}
            >
              <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction('copy')}
            >
              <Ionicons name="copy" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction('move')}
            >
              <Ionicons name="move" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction('favorite')}
            >
              <Ionicons name="star" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={clearSelection}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 错误提示 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 文件选择器 */}
      <FilePicker
        onFilesSelected={handleFilesSelected}
        allowMultiple={allowMultiSelect}
        maxFiles={maxFiles}
        style={styles.filePicker}
      />

      {/* 文件列表 */}
      <FileList
        onFilePress={handleFilePress}
        onDirectoryPress={handleDirectoryPress}
        onFileLongPress={handleFileLongPress}
        multiSelect={allowMultiSelect}
      />

      {/* 底部导航 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={navigateHome}
        >
          <Ionicons name="home" size={20} color="#6C757D" />
          <Text style={styles.navText}>首页</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={navigateUp}
        >
          <Ionicons name="arrow-up" size={20} color="#6C757D" />
          <Text style={styles.navText}>上级</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleBulkAction('favorite')}
        >
          <Ionicons name="star" size={20} color="#6C757D" />
          <Text style={styles.navText}>收藏</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={20} color="#6C757D" />
          <Text style={styles.navText}>刷新</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    color: '#fff',
    fontSize: 14,
  },
  breadcrumbSeparator: {
    color: '#fff',
    marginHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 12,
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    padding: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statsText: {
    fontSize: 12,
    color: '#6c757d',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
  },
  bulkActionsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkActionButton: {
    marginLeft: 8,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
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
  filePicker: {
    margin: 16,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  navButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 4,
  },
  navText: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 2,
  },
});

// 添加缺失的TextInput导入
import { TextInput } from 'react-native';