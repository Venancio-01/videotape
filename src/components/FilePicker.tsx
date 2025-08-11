/**
 * 文件选择器组件
 * 支持单文件和多文件选择
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useFileStore } from '../stores/fileStore';
import { FileItem } from '../types/file';

interface FilePickerProps {
  onFilesSelected?: (files: FileItem[]) => void;
  allowMultiple?: boolean;
  allowedTypes?: string[];
  maxFiles?: number;
  disabled?: boolean;
  style?: any;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  onFilesSelected,
  allowMultiple = false,
  allowedTypes,
  maxFiles = 10,
  disabled = false,
  style,
}) => {
  const [loading, setLoading] = useState(false);
  const [status, requestPermission] = MediaLibrary.usePermissions();
  const { uploadFile, importVideo, importMultipleVideos } = useFileStore();

  const handleDocumentPicker = useCallback(async () => {
    if (disabled) return;

    try {
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
        multiple: allowMultiple,
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        if (allowMultiple && result.assets) {
          // 多文件选择
          const videoFiles = result.assets.filter(asset => 
            asset.mimeType?.startsWith('video/')
          );
          
          const otherFiles = result.assets.filter(asset => 
            !asset.mimeType?.startsWith('video/')
          );

          // 批量导入视频文件
          if (videoFiles.length > 0) {
            await importMultipleVideos(videoFiles.map(asset => asset.uri));
          }

          // 单个导入其他文件
          for (const asset of otherFiles) {
            await uploadFile(asset.uri);
          }

          onFilesSelected?.(result.assets.map(asset => ({
            id: asset.uri,
            name: asset.name,
            uri: asset.uri,
            size: asset.size || 0,
            type: getAssetType(asset.mimeType || ''),
            mimeType: asset.mimeType || 'application/octet-stream',
            createdAt: new Date(),
            modifiedAt: new Date(),
            isFavorite: false,
            isDeleted: false,
          })));
        } else if (!allowMultiple && result.assets && result.assets[0]) {
          // 单文件选择
          const asset = result.assets[0];
          
          if (asset.mimeType?.startsWith('video/')) {
            await importVideo(asset.uri);
          } else {
            await uploadFile(asset.uri);
          }

          onFilesSelected?.([{
            id: asset.uri,
            name: asset.name,
            uri: asset.uri,
            size: asset.size || 0,
            type: getAssetType(asset.mimeType || ''),
            mimeType: asset.mimeType || 'application/octet-stream',
            createdAt: new Date(),
            modifiedAt: new Date(),
            isFavorite: false,
            isDeleted: false,
          }]);
        }
      }
    } catch (error) {
      console.error('文件选择失败:', error);
      Alert.alert('错误', `选择文件失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [disabled, allowMultiple, allowedTypes, uploadFile, importVideo, importMultipleVideos, onFilesSelected]);

  const handleImagePicker = useCallback(async () => {
    if (disabled) return;

    try {
      setLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: allowMultiple,
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          await uploadFile(asset.uri);
        }

        onFilesSelected?.(result.assets.map(asset => ({
          id: asset.uri,
          name: `image_${Date.now()}.${asset.uri.split('.').pop()}`,
          uri: asset.uri,
          size: 0, // ImagePicker 不提供文件大小
          type: asset.type === 'video' ? 'video' : 'image',
          mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          createdAt: new Date(),
          modifiedAt: new Date(),
          isFavorite: false,
          isDeleted: false,
        })));
      }
    } catch (error) {
      console.error('图片选择失败:', error);
      Alert.alert('错误', `选择图片失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [disabled, allowMultiple, uploadFile, onFilesSelected]);

  const handleCameraPicker = useCallback(async () => {
    if (disabled) return;

    try {
      setLoading(true);
      
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('权限错误', '需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFile(asset.uri);

        onFilesSelected?.([{
          id: asset.uri,
          name: `camera_${Date.now()}.jpg`,
          uri: asset.uri,
          size: 0,
          type: 'image',
          mimeType: 'image/jpeg',
          createdAt: new Date(),
          modifiedAt: new Date(),
          isFavorite: false,
          isDeleted: false,
        }]);
      }
    } catch (error) {
      console.error('相机拍照失败:', error);
      Alert.alert('错误', `拍照失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [disabled, uploadFile, onFilesSelected]);

  const handleMediaLibraryPicker = useCallback(async () => {
    if (disabled) return;

    try {
      setLoading(true);
      
      if (status === null) {
        await requestPermission();
      }
      
      if (status?.granted) {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.video,
          first: allowMultiple ? maxFiles : 1,
        });

        if (media.assets.length > 0) {
          const selectedAssets = media.assets.slice(0, allowMultiple ? maxFiles : 1);
          const assetInfo = await MediaLibrary.getAssetInfoAsync(selectedAssets[0].id);
          
          if (allowMultiple) {
            await importMultipleVideos(selectedAssets.map(asset => asset.uri));
          } else {
            await importVideo(assetInfo.localUri || assetInfo.uri);
          }

          onFilesSelected?.(selectedAssets.map(asset => ({
            id: asset.id,
            name: asset.filename,
            uri: asset.uri,
            size: 0,
            type: 'video',
            mimeType: 'video/mp4',
            createdAt: new Date(asset.creationTime),
            modifiedAt: new Date(asset.modificationTime),
            isFavorite: false,
            isDeleted: false,
          })));
        }
      } else {
        Alert.alert('权限错误', '需要媒体库权限才能访问视频');
      }
    } catch (error) {
      console.error('媒体库选择失败:', error);
      Alert.alert('错误', `从媒体库选择失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [disabled, allowMultiple, maxFiles, status, requestPermission, importVideo, importMultipleVideos, onFilesSelected]);

  const getAssetType = (mimeType: string): string => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('text')) return 'text';
    return 'unknown';
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在处理...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabledButton]}
        onPress={handleDocumentPicker}
        disabled={disabled || loading}
      >
        <Text style={styles.buttonText}>
          {allowMultiple ? '选择文件' : '选择文件'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, disabled && styles.disabledButton]}
        onPress={handleImagePicker}
        disabled={disabled || loading}
      >
        <Text style={styles.buttonText}>
          {allowMultiple ? '选择图片/视频' : '选择图片/视频'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, disabled && styles.disabledButton]}
        onPress={handleCameraPicker}
        disabled={disabled || loading}
      >
        <Text style={styles.buttonText}>拍照</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, disabled && styles.disabledButton]}
        onPress={handleMediaLibraryPicker}
        disabled={disabled || loading}
      >
        <Text style={styles.buttonText}>
          {allowMultiple ? '选择视频' : '选择视频'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  disabledButton: {
    backgroundColor: '#dee2e6',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});