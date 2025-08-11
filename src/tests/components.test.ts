/**
 * 组件单元测试
 * 测试 React 组件功能
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { FilePicker } from '../components/FilePicker';
import { FileList } from '../components/FileList';
import { FileManager } from '../components/FileManager';
import { VideoManager } from '../components/VideoManager';
import { FileItem, DirectoryItem } from '../types/file';

// Mock modules
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

jest.mock('expo-media-library', () => ({
  usePermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
  getAssetsAsync: jest.fn(),
  getAssetInfoAsync: jest.fn(),
}));

jest.mock('../stores/fileStore', () => ({
  useFileStore: jest.fn(),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn(({ name, size, color }) => {
    return React.createElement('Text', { 
      style: { 
        fontSize: size, 
        color,
        fontFamily: 'System' 
      } 
    }, name);
  }),
}));

describe('FilePicker', () => {
  const mockProps = {
    onFilesSelected: jest.fn(),
    allowMultiple: false,
    maxFiles: 10,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText } = render(<FilePicker {...mockProps} />);
    expect(getByText('选择文件')).toBeTruthy();
    expect(getByText('选择图片/视频')).toBeTruthy();
    expect(getByText('拍照')).toBeTruthy();
    expect(getByText('选择视频')).toBeTruthy();
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByText } = render(<FilePicker {...mockProps} disabled={true} />);
    const buttons = ['选择文件', '选择图片/视频', '拍照', '选择视频'];
    buttons.forEach(buttonText => {
      const button = getByText(buttonText);
      expect(button.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#dee2e6',
          opacity: 0.6,
        })
      );
    });
  });

  it('should call onFilesSelected when files are selected', async () => {
    const mockDocumentPicker = require('expo-document-picker');
    mockDocumentPicker.getDocumentAsync.mockResolvedValue({
      type: 'success',
      assets: [{
        uri: '/test/file.txt',
        name: 'test.txt',
        size: 1024,
        mimeType: 'text/plain',
      }],
    });

    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      uploadFile: jest.fn().mockResolvedValue(),
      importVideo: jest.fn().mockResolvedValue(),
      importMultipleVideos: jest.fn().mockResolvedValue(),
    });

    const { getByText } = render(<FilePicker {...mockProps} />);
    
    await act(async () => {
      fireEvent.press(getByText('选择文件'));
    });

    expect(mockProps.onFilesSelected).toHaveBeenCalledWith([{
      id: '/test/file.txt',
      name: 'test.txt',
      uri: '/test/file.txt',
      size: 1024,
      type: 'text',
      mimeType: 'text/plain',
      createdAt: expect.any(Date),
      modifiedAt: expect.any(Date),
      isFavorite: false,
      isDeleted: false,
    }]);
  });

  it('should handle multiple file selection', async () => {
    const mockDocumentPicker = require('expo-document-picker');
    mockDocumentPicker.getDocumentAsync.mockResolvedValue({
      type: 'success',
      assets: [
        {
          uri: '/test/file1.txt',
          name: 'file1.txt',
          size: 1024,
          mimeType: 'text/plain',
        },
        {
          uri: '/test/file2.txt',
          name: 'file2.txt',
          size: 2048,
          mimeType: 'text/plain',
        },
      ],
    });

    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      uploadFile: jest.fn().mockResolvedValue(),
      importVideo: jest.fn().mockResolvedValue(),
      importMultipleVideos: jest.fn().mockResolvedValue(),
    });

    const { getByText } = render(<FilePicker {...mockProps} allowMultiple={true} />);
    
    await act(async () => {
      fireEvent.press(getByText('选择文件'));
    });

    expect(mockProps.onFilesSelected).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'file1.txt' }),
      expect.objectContaining({ name: 'file2.txt' }),
    ]);
  });
});

describe('FileList', () => {
  const mockFiles: FileItem[] = [
    {
      id: 'file1',
      name: 'document.pdf',
      uri: '/test/document.pdf',
      size: 1024000,
      type: 'document',
      mimeType: 'application/pdf',
      createdAt: new Date(),
      modifiedAt: new Date(),
      isFavorite: false,
      isDeleted: false,
    },
    {
      id: 'file2',
      name: 'image.jpg',
      uri: '/test/image.jpg',
      size: 512000,
      type: 'image',
      mimeType: 'image/jpeg',
      createdAt: new Date(),
      modifiedAt: new Date(),
      isFavorite: true,
      isDeleted: false,
    },
  ];

  const mockDirectories: DirectoryItem[] = [
    {
      id: 'dir1',
      name: 'Documents',
      path: '/test/Documents',
      createdAt: new Date(),
      modifiedAt: new Date(),
      isFavorite: false,
      isDeleted: false,
      itemCount: 5,
      totalSize: 2048000,
    },
  ];

  const mockProps = {
    onFilePress: jest.fn(),
    onDirectoryPress: jest.fn(),
    onFileLongPress: jest.fn(),
    multiSelect: false,
    showHidden: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render files and directories', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: mockFiles,
      directories: mockDirectories,
      selectedFiles: [],
      isLoading: false,
      error: null,
      currentPath: '/test',
      loadFiles: jest.fn(),
      loadDirectories: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      createDirectory: jest.fn(),
      copyFile: jest.fn(),
      moveFile: jest.fn(),
    });

    const { getByText } = render(<FileList {...mockProps} />);
    
    expect(getByText('document.pdf')).toBeTruthy();
    expect(getByText('image.jpg')).toBeTruthy();
    expect(getByText('Documents')).toBeTruthy();
    expect(getByText('根目录')).toBeTruthy();
  });

  it('should call onFilePress when file is pressed', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: mockFiles,
      directories: mockDirectories,
      selectedFiles: [],
      isLoading: false,
      error: null,
      currentPath: '/test',
      loadFiles: jest.fn(),
      loadDirectories: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      createDirectory: jest.fn(),
      copyFile: jest.fn(),
      moveFile: jest.fn(),
    });

    const { getByText } = render(<FileList {...mockProps} />);
    
    act(() => {
      fireEvent.press(getByText('document.pdf'));
    });

    expect(mockProps.onFilePress).toHaveBeenCalledWith(mockFiles[0]);
  });

  it('should call onDirectoryPress when directory is pressed', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: mockFiles,
      directories: mockDirectories,
      selectedFiles: [],
      isLoading: false,
      error: null,
      currentPath: '/test',
      loadFiles: jest.fn(),
      loadDirectories: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      createDirectory: jest.fn(),
      copyFile: jest.fn(),
      moveFile: jest.fn(),
    });

    const { getByText } = render(<FileList {...mockProps} />);
    
    act(() => {
      fireEvent.press(getByText('Documents'));
    });

    expect(mockProps.onDirectoryPress).toHaveBeenCalledWith(mockDirectories[0]);
  });

  it('should show loading state when isLoading is true', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: [],
      directories: [],
      selectedFiles: [],
      isLoading: true,
      error: null,
      currentPath: '/test',
      loadFiles: jest.fn(),
      loadDirectories: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      createDirectory: jest.fn(),
      copyFile: jest.fn(),
      moveFile: jest.fn(),
    });

    const { getByText } = render(<FileList {...mockProps} />);
    
    expect(getByText('加载中...')).toBeTruthy();
  });

  it('should show error message when error exists', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: [],
      directories: [],
      selectedFiles: [],
      isLoading: false,
      error: 'Test error message',
      currentPath: '/test',
      loadFiles: jest.fn(),
      loadDirectories: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      createDirectory: jest.fn(),
      copyFile: jest.fn(),
      moveFile: jest.fn(),
    });

    const { getByText } = render(<FileList {...mockProps} />);
    
    expect(getByText('Test error message')).toBeTruthy();
  });

  it('should show empty state when no files exist', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: [],
      directories: [],
      selectedFiles: [],
      isLoading: false,
      error: null,
      currentPath: '/test',
      loadFiles: jest.fn(),
      loadDirectories: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      createDirectory: jest.fn(),
      copyFile: jest.fn(),
      moveFile: jest.fn(),
    });

    const { getByText } = render(<FileList {...mockProps} />);
    
    expect(getByText('此文件夹为空')).toBeTruthy();
  });
});

describe('VideoManager', () => {
  const mockVideoFiles: FileItem[] = [
    {
      id: 'video1',
      name: 'movie.mp4',
      uri: '/test/movie.mp4',
      size: 10240000,
      type: 'video',
      mimeType: 'video/mp4',
      createdAt: new Date(),
      modifiedAt: new Date(),
      isFavorite: false,
      isDeleted: false,
      metadata: {
        duration: 120,
        width: 1920,
        height: 1080,
      },
    },
    {
      id: 'video2',
      name: 'clip.mp4',
      uri: '/test/clip.mp4',
      size: 5120000,
      type: 'video',
      mimeType: 'video/mp4',
      createdAt: new Date(),
      modifiedAt: new Date(),
      isFavorite: true,
      isDeleted: false,
      metadata: {
        duration: 60,
        width: 1280,
        height: 720,
      },
    },
  ];

  const mockProps = {
    onVideoSelected: jest.fn(),
    allowMultiSelect: false,
    maxVideos: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render video list', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: mockVideoFiles,
      selectedFiles: [],
      isLoading: false,
      error: null,
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      generateThumbnail: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      clearSelection: jest.fn(),
      filterByType: jest.fn(),
    });

    const { getByText } = render(<VideoManager {...mockProps} />);
    
    expect(getByText('视频管理 (2 个视频)')).toBeTruthy();
    expect(getByText('movie.mp4')).toBeTruthy();
    expect(getByText('clip.mp4')).toBeTruthy();
  });

  it('should call onVideoSelected when video is pressed', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: mockVideoFiles,
      selectedFiles: [],
      isLoading: false,
      error: null,
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      generateThumbnail: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      clearSelection: jest.fn(),
      filterByType: jest.fn(),
    });

    const { getByText } = render(<VideoManager {...mockProps} />);
    
    act(() => {
      fireEvent.press(getByText('movie.mp4'));
    });

    expect(mockProps.onVideoSelected).toHaveBeenCalledWith(mockVideoFiles[0]);
  });

  it('should show loading state when isLoading is true', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: [],
      selectedFiles: [],
      isLoading: true,
      error: null,
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      generateThumbnail: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      clearSelection: jest.fn(),
      filterByType: jest.fn(),
    });

    const { getByText } = render(<VideoManager {...mockProps} />);
    
    expect(getByText('加载中...')).toBeTruthy();
  });

  it('should show empty state when no videos exist', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: [],
      selectedFiles: [],
      isLoading: false,
      error: null,
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      generateThumbnail: jest.fn(),
      deleteFile: jest.fn(),
      toggleFavorite: jest.fn(),
      selectFile: jest.fn(),
      clearSelection: jest.fn(),
      filterByType: jest.fn(),
    });

    const { getByText } = render(<VideoManager {...mockProps} />);
    
    expect(getByText('暂无视频文件')).toBeTruthy();
    expect(getByText('导入视频')).toBeTruthy();
  });
});

describe('FileManager', () => {
  const mockProps = {
    initialPath: '/test',
    allowMultiSelect: false,
    maxFiles: 10,
    onFilesSelected: jest.fn(),
    onDirectoryChanged: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: [],
      directories: [],
      selectedFiles: [],
      isLoading: false,
      error: null,
      currentPath: '/test',
      uploadFile: jest.fn(),
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      navigateTo: jest.fn(),
      navigateUp: jest.fn(),
      navigateHome: jest.fn(),
      refreshAll: jest.fn(),
      bulkDelete: jest.fn(),
      bulkCopy: jest.fn(),
      bulkMove: jest.fn(),
      bulkFavorite: jest.fn(),
      clearSelection: jest.fn(),
    });

    const { getByText } = render(<FileManager {...mockProps} />);
    
    expect(getByText('文件管理系统')).toBeTruthy();
    expect(getByText('首页')).toBeTruthy();
  });

  it('should show breadcrumb navigation', () => {
    const mockFileStore = require('../stores/fileStore');
    mockFileStore.useFileStore.mockReturnValue({
      files: [],
      directories: [],
      selectedFiles: [],
      isLoading: false,
      error: null,
      currentPath: '/test/folder/subfolder',
      uploadFile: jest.fn(),
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      navigateTo: jest.fn(),
      navigateUp: jest.fn(),
      navigateHome: jest.fn(),
      refreshAll: jest.fn(),
      bulkDelete: jest.fn(),
      bulkCopy: jest.fn(),
      bulkMove: jest.fn(),
      bulkFavorite: jest.fn(),
      clearSelection: jest.fn(),
    });

    const { getByText } = render(<FileManager {...mockProps} />);
    
    expect(getByText('首页')).toBeTruthy();
    expect(getByText('folder')).toBeTruthy();
    expect(getByText('subfolder')).toBeTruthy();
  });

  it('should call onDirectoryChanged when current path changes', () => {
    const mockFileStore = require('../stores/fileStore');
    const store = {
      files: [],
      directories: [],
      selectedFiles: [],
      isLoading: false,
      error: null,
      currentPath: '/test',
      uploadFile: jest.fn(),
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      navigateTo: jest.fn(),
      navigateUp: jest.fn(),
      navigateHome: jest.fn(),
      refreshAll: jest.fn(),
      bulkDelete: jest.fn(),
      bulkCopy: jest.fn(),
      bulkMove: jest.fn(),
      bulkFavorite: jest.fn(),
      clearSelection: jest.fn(),
    };
    
    mockFileStore.useFileStore.mockReturnValue(store);

    const { rerender } = render(<FileManager {...mockProps} />);
    
    // Simulate path change
    store.currentPath = '/new/path';
    mockFileStore.useFileStore.mockReturnValue(store);
    
    rerender(<FileManager {...mockProps} />);
    
    expect(mockProps.onDirectoryChanged).toHaveBeenCalledWith('/new/path');
  });

  it('should call onFilesSelected when files are selected', () => {
    const mockFiles: FileItem[] = [
      {
        id: 'file1',
        name: 'test.txt',
        uri: '/test/test.txt',
        size: 1024,
        type: 'text',
        mimeType: 'text/plain',
        createdAt: new Date(),
        modifiedAt: new Date(),
        isFavorite: false,
        isDeleted: false,
      },
    ];

    const mockFileStore = require('../stores/fileStore');
    const store = {
      files: mockFiles,
      directories: [],
      selectedFiles: ['file1'],
      isLoading: false,
      error: null,
      currentPath: '/test',
      uploadFile: jest.fn(),
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      navigateTo: jest.fn(),
      navigateUp: jest.fn(),
      navigateHome: jest.fn(),
      refreshAll: jest.fn(),
      bulkDelete: jest.fn(),
      bulkCopy: jest.fn(),
      bulkMove: jest.fn(),
      bulkFavorite: jest.fn(),
      clearSelection: jest.fn(),
    };
    
    mockFileStore.useFileStore.mockReturnValue(store);

    const { rerender } = render(<FileManager {...mockProps} />);
    
    // Simulate selection change
    store.selectedFiles = ['file1'];
    mockFileStore.useFileStore.mockReturnValue(store);
    
    rerender(<FileManager {...mockProps} />);
    
    expect(mockProps.onFilesSelected).toHaveBeenCalledWith(mockFiles);
  });
});

// Integration tests
describe('File Management Integration', () => {
  it('should handle complete file management workflow', async () => {
    // Mock all the dependencies
    const mockFileStore = require('../stores/fileStore');
    const mockStore = {
      files: [],
      directories: [],
      selectedFiles: [],
      isLoading: false,
      error: null,
      currentPath: '/test',
      uploadFile: jest.fn(),
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      navigateTo: jest.fn(),
      navigateUp: jest.fn(),
      navigateHome: jest.fn(),
      refreshAll: jest.fn(),
      bulkDelete: jest.fn(),
      bulkCopy: jest.fn(),
      bulkMove: jest.fn(),
      bulkFavorite: jest.fn(),
      clearSelection: jest.fn(),
    };
    
    mockFileStore.useFileStore.mockReturnValue(mockStore);

    const { getByText } = render(<FileManager 
      initialPath="/test"
      onFilesSelected={jest.fn()}
      onDirectoryChanged={jest.fn()}
    />);

    // Test initial render
    expect(getByText('文件管理系统')).toBeTruthy();
    expect(getByText('首页')).toBeTruthy();

    // Test navigation
    await act(async () => {
      fireEvent.press(getByText('上级'));
    });

    expect(mockStore.navigateUp).toHaveBeenCalled();

    // Test refresh
    await act(async () => {
      fireEvent.press(getByText('刷新'));
    });

    expect(mockStore.refreshAll).toHaveBeenCalled();
  });

  it('should handle error states gracefully', async () => {
    const mockFileStore = require('../stores/fileStore');
    const mockStore = {
      files: [],
      directories: [],
      selectedFiles: [],
      isLoading: false,
      error: 'Network error occurred',
      currentPath: '/test',
      uploadFile: jest.fn(),
      importVideo: jest.fn(),
      importMultipleVideos: jest.fn(),
      navigateTo: jest.fn(),
      navigateUp: jest.fn(),
      navigateHome: jest.fn(),
      refreshAll: jest.fn(),
      bulkDelete: jest.fn(),
      bulkCopy: jest.fn(),
      bulkMove: jest.fn(),
      bulkFavorite: jest.fn(),
      clearSelection: jest.fn(),
    };
    
    mockFileStore.useFileStore.mockReturnValue(mockStore);

    const { getByText } = render(<FileManager 
      initialPath="/test"
      onFilesSelected={jest.fn()}
      onDirectoryChanged={jest.fn()}
    />);

    expect(getByText('Network error occurred')).toBeTruthy();
  });
});