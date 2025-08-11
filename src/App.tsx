/**
 * 文件管理应用示例
 * 演示文件管理功能的完整应用
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FileManager } from './components/FileManager';
import { VideoManager } from './components/VideoManager';
import { FileItem } from './types/file';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'files' | 'videos' | 'settings';

export const FileManagementApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

  const handleFilesSelected = (files: FileItem[]) => {
    setSelectedFiles(files);
    if (files.length > 0) {
      Alert.alert(
        '文件选择',
        `已选择 ${files.length} 个文件\n${files.map(f => f.name).join('\n')}`
      );
    }
  };

  const handleVideoSelected = (video: FileItem) => {
    Alert.alert(
      '视频选择',
      `已选择视频: ${video.name}`
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <FileManager
            allowMultiSelect={true}
            maxFiles={10}
            onFilesSelected={handleFilesSelected}
            onDirectoryChanged={(path) => {
              console.log('目录变更:', path);
            }}
          />
        );
      case 'videos':
        return (
          <VideoManager
            allowMultiSelect={true}
            maxVideos={5}
            onVideoSelected={handleVideoSelected}
          />
        );
      case 'settings':
        return (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>设置</Text>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>存储信息</Text>
              <Text style={styles.settingsText}>应用存储: 100MB</Text>
              <Text style={styles.settingsText}>可用空间: 2.5GB</Text>
              <Text style={styles.settingsText}>缓存大小: 50MB</Text>
            </View>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>功能设置</Text>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsItemText}>自动备份</Text>
                <Ionicons name="chevron-forward" size={16} color="#6C757D" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsItemText}>文件压缩</Text>
                <Ionicons name="chevron-forward" size={16} color="#6C757D" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsItemText}>隐私保护</Text>
                <Ionicons name="chevron-forward" size={16} color="#6C757D" />
              </TouchableOpacity>
            </View>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>关于</Text>
              <Text style={styles.settingsText}>版本: 1.0.0</Text>
              <Text style={settingsText}>文件管理系统</Text>
              <Text style={settingsText}>基于 React Native + Expo</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>文件管理系统</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="notifications" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 主内容区域 */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* 底部导航栏 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'files' && styles.activeNavItem]}
          onPress={() => setActiveTab('files')}
        >
          <Ionicons 
            name="document" 
            size={24} 
            color={activeTab === 'files' ? '#007AFF' : '#6C757D'} 
          />
          <Text style={[styles.navText, activeTab === 'files' && styles.activeNavText]}>
            文件
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'videos' && styles.activeNavItem]}
          onPress={() => setActiveTab('videos')}
        >
          <Ionicons 
            name="videocam" 
            size={24} 
            color={activeTab === 'videos' ? '#007AFF' : '#6C757D'} 
          />
          <Text style={[styles.navText, activeTab === 'videos' && styles.activeNavText]}>
            视频
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'settings' && styles.activeNavItem]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons 
            name="settings" 
            size={24} 
            color={activeTab === 'settings' ? '#007AFF' : '#6C757D'} 
          />
          <Text style={[styles.navText, activeTab === 'settings' && styles.activeNavText]}>
            设置
          </Text>
        </TouchableOpacity>
      </View>

      {/* 选择状态提示 */}
      {selectedFiles.length > 0 && (
        <View style={styles.selectionBanner}>
          <Text style={styles.selectionText}>
            已选择 {selectedFiles.length} 个文件
          </Text>
          <TouchableOpacity
            style={styles.clearSelectionButton}
            onPress={() => setSelectedFiles([])}
          >
            <Text style={styles.clearSelectionText}>清除</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#f8f9fa',
  },
  navText: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  activeNavText: {
    color: '#007AFF',
  },
  selectionBanner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearSelectionButton: {
    padding: 4,
  },
  clearSelectionText: {
    color: '#fff',
    fontSize: 14,
  },
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 24,
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  settingsText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#212529',
  },
});

export default FileManagementApp;