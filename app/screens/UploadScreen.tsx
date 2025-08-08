import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '../store/store';
import { videoService } from '../services/videoService';

/**
 * 上传屏幕
 */
export const UploadScreen: React.FC = () => {
  const { setLoading } = useStore();

  // 处理从相册选择视频
  const handlePickVideo = async () => {
    try {
      setLoading(true);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('权限错误', '需要相册权限才能选择视频');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await handleVideoUpload(asset.uri, asset.fileName || '视频文件');
      }
    } catch (error) {
      console.error('Failed to pick video:', error);
      Alert.alert('错误', '选择视频失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理录制视频
  const handleRecordVideo = async () => {
    try {
      setLoading(true);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('权限错误', '需要相机权限才能录制视频');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await handleVideoUpload(asset.uri, asset.fileName || '录制的视频');
      }
    } catch (error) {
      console.error('Failed to record video:', error);
      Alert.alert('错误', '录制视频失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件选择
  const handlePickFile = async () => {
    try {
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await handleVideoUpload(result.uri, result.name);
      }
    } catch (error) {
      console.error('Failed to pick file:', error);
      Alert.alert('错误', '选择文件失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理视频上传
  const handleVideoUpload = async (uri: string, fileName: string) => {
    try {
      const videoData = {
        title: fileName.replace(/\.[^/.]+$/, ''),
        description: '',
        uri,
        duration: 0,
        size: 0,
        mimeType: 'video/mp4',
      };

      const result = await videoService.addVideo(videoData);
      
      if (result.success) {
        Alert.alert('成功', '视频上传成功！');
      } else {
        Alert.alert('失败', result.error || '视频上传失败');
      }
    } catch (error) {
      console.error('Failed to upload video:', error);
      Alert.alert('错误', '视频上传失败');
    }
  };

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
    uploadOptions: {
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: '#333',
    },
    uploadButtons: {
      gap: 12,
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#007AFF',
      padding: 16,
      borderRadius: 8,
      gap: 12,
    },
    uploadButtonSecondary: {
      backgroundColor: '#f0f0f0',
    },
    uploadButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    uploadButtonTextSecondary: {
      color: '#333',
    },
    uploadIcon: {
      fontSize: 24,
    },
    tips: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: 8,
    },
    tipItemLast: {
      marginBottom: 0,
    },
    tipIcon: {
      fontSize: 16,
      color: '#007AFF',
      marginTop: 2,
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      color: '#666',
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>发布视频</Text>
        <Text style={styles.subtitle}>分享您的精彩时刻</Text>
      </View>

      <View style={styles.content}>
        {/* 上传选项 */}
        <View style={styles.uploadOptions}>
          <Text style={styles.sectionTitle}>选择上传方式</Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickVideo}>
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.uploadButtonText}>从相册选择</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.uploadButton, styles.uploadButtonSecondary]} 
              onPress={handleRecordVideo}
            >
              <Ionicons name="videocam" size={24} color="#333" />
              <Text style={[styles.uploadButtonText, styles.uploadButtonTextSecondary]}>
                录制视频
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.uploadButton, styles.uploadButtonSecondary]} 
              onPress={handlePickFile}
            >
              <Ionicons name="document" size={24} color="#333" />
              <Text style={[styles.uploadButtonText, styles.uploadButtonTextSecondary]}>
                选择文件
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 提示信息 */}
        <View style={styles.tips}>
          <Text style={styles.sectionTitle}>上传提示</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.tipIcon} />
            <Text style={styles.tipText}>支持 MP4、MOV、AVI 等常见视频格式</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.tipIcon} />
            <Text style={styles.tipText}>建议视频时长在15秒到10分钟之间</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.tipIcon} />
            <Text style={styles.tipText}>文件大小不超过100MB为佳</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.tipIcon} />
            <Text style={styles.tipText}>上传时请确保网络连接稳定</Text>
          </View>
          <View style={[styles.tipItem, styles.tipItemLast]}>
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.tipIcon} />
            <Text style={styles.tipText}>请遵守社区规范，上传健康内容</Text>
          </View>
        </View>
      </View>
    </View>
  );
};