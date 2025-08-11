/**
 * 文件列表组件
 * 显示文件和目录的列表视图
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFileStore } from '../stores/fileStore';
import { FileItem, DirectoryItem } from '../types/file';
import { Ionicons } from '@expo/vector-icons';

interface FileListProps {
  onFilePress?: (file: FileItem) => void;
  onDirectoryPress?: (directory: DirectoryItem) => void;
  onFileLongPress?: (file: FileItem) => void;
  multiSelect?: boolean;
  showHidden?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  onFilePress,
  onDirectoryPress,
  onFileLongPress,
  multiSelect = false,
  showHidden = false,
}) => {
  const {
    files,
    directories,
    selectedFiles,
    isLoading,
    error,
    currentPath,
    loadFiles,
    loadDirectories,
    deleteFile,
    toggleFavorite,
    selectFile,
    selectAll,
    clearSelection,
    createDirectory,
    copyFile,
    moveFile,
  } = useFileStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FileItem | DirectoryItem | null>(null);

  useEffect(() => {
    loadData();
  }, [currentPath]);

  const loadData = async () => {
    try {
      await Promise.all([loadFiles(), loadDirectories()]);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFilePress = (file: FileItem) => {
    if (multiSelect) {
      selectFile(file.id);
    } else {
      onFilePress?.(file);
    }
  };

  const handleDirectoryPress = (directory: DirectoryItem) => {
    if (multiSelect) {
      // 目录不支持多选
      onDirectoryPress?.(directory);
    } else {
      onDirectoryPress?.(directory);
    }
  };

  const handleFileLongPress = (file: FileItem) => {
    setSelectedItem(file);
    setShowActionModal(true);
    onFileLongPress?.(file);
  };

  const handleDelete = async (item: FileItem | DirectoryItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除 "${item.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              if ('type' in item) {
                await deleteFile(item.id);
              } else {
                // 删除目录的逻辑
              }
              setShowActionModal(false);
            } catch (error) {
              Alert.alert('错误', `删除失败: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (item: FileItem) => {
    try {
      await toggleFavorite(item.id);
    } catch (error) {
      Alert.alert('错误', `操作失败: ${error.message}`);
    }
  };

  const handleCreateDirectory = async () => {
    if (!newDirectoryName.trim()) {
      Alert.alert('错误', '请输入目录名称');
      return;
    }

    try {
      await createDirectory(newDirectoryName.trim());
      setNewDirectoryName('');
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert('错误', `创建目录失败: ${error.message}`);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return 'videocam';
      case 'image':
        return 'image';
      case 'audio':
        return 'musical-notes';
      case 'document':
        return 'document';
      case 'text':
        return 'document-text';
      default:
        return 'document';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN');
  };

  const renderItem = ({ item }: { item: FileItem | DirectoryItem }) => {
    const isSelected = 'type' in item ? selectedFiles.includes(item.id) : false;
    const isDirectory = !('type' in item);

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.selectedItem,
        ]}
        onPress={() => {
          if (isDirectory) {
            handleDirectoryPress(item as DirectoryItem);
          } else {
            handleFilePress(item as FileItem);
          }
        }}
        onLongPress={() => {
          if (!isDirectory) {
            handleFileLongPress(item as FileItem);
          }
        }}
      >
        <View style={styles.itemLeft}>
          {multiSelect && !isDirectory && (
            <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          )}
          <Ionicons
            name={isDirectory ? 'folder' : getFileIcon((item as FileItem).type)}
            size={24}
            color={isDirectory ? '#FFC107' : '#6C757D'}
            style={styles.itemIcon}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemDetails}>
              {isDirectory ? '文件夹' : `${formatFileSize((item as FileItem).size)} • ${formatDate(item.modifiedAt)}`}
            </Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          {!isDirectory && (item as FileItem).isFavorite && (
            <Ionicons name="star" size={20} color="#FFC107" style={styles.favoriteIcon} />
          )}
          <Ionicons name="chevron-forward" size={20} color="#6C757D" />
        </View>
      </TouchableOpacity>
    );
  };

  const allItems = [...directories, ...files].filter(item => {
    if (!showHidden && item.name.startsWith('.')) {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* 顶部工具栏 */}
      <View style={styles.toolbar}>
        <Text style={styles.pathText}>{currentPath || '根目录'}</Text>
        <View style={styles.toolbarActions}>
          {multiSelect && (
            <>
              <TouchableOpacity onPress={selectAll} style={styles.toolbarButton}>
                <Ionicons name="checkmark-done" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={clearSelection} style={styles.toolbarButton}>
                <Ionicons name="close" size={20} color="#6C757D" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.toolbarButton}>
            <Ionicons name="add" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 选择状态栏 */}
      {multiSelect && selectedFiles.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            已选择 {selectedFiles.length} 个文件
          </Text>
        </View>
      )}

      {/* 错误提示 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 文件列表 */}
      <FlatList
        data={allItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open" size={48} color="#6C757D" />
            <Text style={styles.emptyText}>
              {isLoading ? '加载中...' : '此文件夹为空'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />

      {/* 创建目录模态框 */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>创建新文件夹</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入文件夹名称"
              value={newDirectoryName}
              onChangeText={setNewDirectoryName}
              autoFocus={true}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateDirectory}
              >
                <Text style={styles.confirmButtonText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 操作模态框 */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>文件操作</Text>
            {selectedItem && (
              <Text style={styles.modalItemName}>{selectedItem.name}</Text>
            )}
            <ScrollView style={styles.actionList}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  if (selectedItem && 'type' in selectedItem) {
                    handleToggleFavorite(selectedItem);
                  }
                  setShowActionModal(false);
                }}
              >
                <Ionicons name="star" size={20} color="#FFC107" />
                <Text style={styles.actionText}>
                  {selectedItem && 'type' in selectedItem && selectedItem.isFavorite ? '取消收藏' : '添加收藏'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  // 复制功能
                  setShowActionModal(false);
                }}
              >
                <Ionicons name="copy" size={20} color="#007AFF" />
                <Text style={styles.actionText}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  // 移动功能
                  setShowActionModal(false);
                }}
              >
                <Ionicons name="move" size={20} color="#28A745" />
                <Text style={styles.actionText}>移动</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  if (selectedItem) {
                    handleDelete(selectedItem);
                  }
                }}
              >
                <Ionicons name="trash" size={20} color="#DC3545" />
                <Text style={styles.actionText}>删除</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.closeButtonText}>取消</Text>
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
    backgroundColor: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  pathText: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    marginLeft: 12,
    padding: 4,
  },
  selectionBar: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  listContainer: {
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  selectedItem: {
    backgroundColor: '#E3F2FD',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#6c757d',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteIcon: {
    marginRight: 8,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItemName: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionList: {
    maxHeight: 200,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 16,
    color: '#212529',
    marginLeft: 12,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6c757d',
  },
});