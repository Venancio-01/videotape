/**
 * 文件管理状态管理
 * 基于 Zustand 的状态管理方案
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { FileItem, DirectoryItem, FileSystemStats } from '../types/file';
import { FileSystemService } from '../services/fileSystemService';
import { VideoService } from '../services/fileSystemService';
import { DatabaseService } from '../db/database';

interface FileState {
  files: FileItem[];
  directories: DirectoryItem[];
  currentPath: string;
  selectedFiles: string[];
  isLoading: boolean;
  error: string | null;
  stats: FileSystemStats;
}

interface FileStore extends FileState {
  // Actions
  loadFiles: () => Promise<void>;
  loadDirectories: () => Promise<void>;
  loadStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // File operations
  uploadFile: (uri: string, destination?: string) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  copyFile: (id: string, destination: string) => Promise<void>;
  moveFile: (id: string, destination: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  
  // Directory operations
  createDirectory: (name: string, parentId?: string) => Promise<void>;
  deleteDirectory: (id: string) => Promise<void>;
  
  // Search and filter
  searchFiles: (query: string) => Promise<void>;
  filterByType: (type: string) => Promise<void>;
  clearSearch: () => void;
  
  // Selection
  selectFile: (id: string) => void;
  selectMultipleFiles: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Navigation
  navigateTo: (path: string) => Promise<void>;
  navigateUp: () => Promise<void>;
  navigateHome: () => Promise<void>;
  
  // Video operations
  importVideo: (uri: string) => Promise<void>;
  importMultipleVideos: (uris: string[]) => Promise<void>;
  generateThumbnail: (fileId: string) => Promise<void>;
  
  // Bulk operations
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkCopy: (ids: string[], destination: string) => Promise<void>;
  bulkMove: (ids: string[], destination: string) => Promise<void>;
  bulkFavorite: (ids: string[], favorite: boolean) => Promise<void>;
}

// 初始化服务
const fileSystemService = FileSystemService.getInstance();
const videoService = VideoService.getInstance();
const databaseService = DatabaseService.getInstance();

export const useFileStore = create<FileStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    files: [],
    directories: [],
    currentPath: '',
    selectedFiles: [],
    isLoading: false,
    error: null,
    stats: {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      availableSpace: 0,
    },

    // Actions
    loadFiles: async () => {
      try {
        set({ isLoading: true, error: null });
        
        // 从数据库加载文件
        const dbFiles = await databaseService.getAllFiles();
        
        // 转换为 FileItem 格式
        const files: FileItem[] = dbFiles.map(dbFile => ({
          id: dbFile.id,
          name: dbFile.name,
          uri: dbFile.uri,
          size: dbFile.size,
          type: dbFile.type,
          mimeType: dbFile.mimeType,
          createdAt: new Date(dbFile.createdAt),
          modifiedAt: new Date(dbFile.modifiedAt),
          hash: dbFile.hash,
          thumbnailUri: dbFile.thumbnailUri,
          isFavorite: dbFile.isFavorite,
          isDeleted: dbFile.isDeleted,
          parentId: dbFile.parentId,
          metadata: dbFile.metadata,
        }));

        set({ files, isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    loadDirectories: async () => {
      try {
        set({ isLoading: true, error: null });
        
        const dbDirectories = await databaseService.getAllDirectories();
        
        const directories: DirectoryItem[] = dbDirectories.map(dbDir => ({
          id: dbDir.id,
          name: dbDir.name,
          path: dbDir.path,
          createdAt: new Date(dbDir.createdAt),
          modifiedAt: new Date(dbDir.modifiedAt),
          parentId: dbDir.parentId,
          isFavorite: dbDir.isFavorite,
          isDeleted: dbDir.isDeleted,
          itemCount: dbDir.itemCount,
          totalSize: dbDir.totalSize,
        }));

        set({ directories, isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    loadStats: async () => {
      try {
        const dbStats = await databaseService.getStats();
        const systemStats = await fileSystemService.getSystemStats();
        
        const stats: FileSystemStats = {
          totalFiles: dbStats.totalFiles,
          totalDirectories: dbStats.totalDirectories,
          totalSize: dbStats.totalSize,
          availableSpace: systemStats.availableSpace,
          lastBackup: systemStats.lastBackup,
          lastScan: systemStats.lastScan,
        };

        set({ stats });
      } catch (error) {
        set({ error: error.message });
      }
    },

    refreshAll: async () => {
      try {
        set({ isLoading: true, error: null });
        
        await Promise.all([
          get().loadFiles(),
          get().loadDirectories(),
          get().loadStats(),
        ]);
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    // File operations
    uploadFile: async (uri: string, destination?: string) => {
      try {
        set({ isLoading: true, error: null });
        
        // 获取文件信息
        const fileInfo = await fileSystemService.getFileInfo(uri);
        
        // 保存到数据库
        await databaseService.saveFile({
          id: fileInfo.id,
          name: fileInfo.name,
          uri: fileInfo.uri,
          size: fileInfo.size,
          type: fileInfo.type,
          mimeType: fileInfo.mimeType,
          createdAt: fileInfo.createdAt,
          modifiedAt: fileInfo.modifiedAt,
          hash: fileInfo.hash,
          thumbnailUri: fileInfo.thumbnailUri,
          isFavorite: fileInfo.isFavorite,
          isDeleted: fileInfo.isDeleted,
          parentId: fileInfo.parentId,
          metadata: fileInfo.metadata,
        });

        // 如果是视频文件，提取视频信息
        if (fileInfo.type === 'video') {
          const videoInfo = await videoService.extractVideoInfo(uri);
          await databaseService.saveVideoMetadata({
            id: `video_${fileInfo.id}`,
            fileId: fileInfo.id,
            duration: videoInfo.duration,
            width: videoInfo.width,
            height: videoInfo.height,
            bitrate: videoInfo.bitrate,
            frameRate: videoInfo.frameRate,
            codec: videoInfo.codec,
            format: videoInfo.format,
            hasAudio: true,
          });
        }

        // 添加到状态
        set((state) => ({
          files: [...state.files, fileInfo],
        }));
        
        // 刷新统计
        await get().loadStats();
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    deleteFile: async (id: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const file = get().files.find(f => f.id === id);
        if (!file) {
          throw new Error('文件不存在');
        }

        // 从文件系统删除
        await fileSystemService.deleteFile(file.uri);
        
        // 从数据库删除
        await databaseService.deleteFile(id);
        
        // 从状态中删除
        set((state) => ({
          files: state.files.filter(f => f.id !== id),
          selectedFiles: state.selectedFiles.filter(selectedId => selectedId !== id),
        }));
        
        // 刷新统计
        await get().loadStats();
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    copyFile: async (id: string, destination: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const file = get().files.find(f => f.id === id);
        if (!file) {
          throw new Error('文件不存在');
        }

        // 复制文件
        const newUri = `${destination}/${file.name}`;
        await fileSystemService.copyFile(file.uri, newUri);
        
        // 获取新文件信息
        const newFile = await fileSystemService.getFileInfo(newUri);
        
        // 保存到数据库
        await databaseService.saveFile({
          id: newFile.id,
          name: newFile.name,
          uri: newFile.uri,
          size: newFile.size,
          type: newFile.type,
          mimeType: newFile.mimeType,
          createdAt: newFile.createdAt,
          modifiedAt: newFile.modifiedAt,
          hash: newFile.hash,
          thumbnailUri: newFile.thumbnailUri,
          isFavorite: newFile.isFavorite,
          isDeleted: newFile.isDeleted,
          parentId: newFile.parentId,
          metadata: newFile.metadata,
        });

        // 添加到状态
        set((state) => ({
          files: [...state.files, newFile],
        }));
        
        // 刷新统计
        await get().loadStats();
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    moveFile: async (id: string, destination: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const file = get().files.find(f => f.id === id);
        if (!file) {
          throw new Error('文件不存在');
        }

        // 移动文件
        const newUri = `${destination}/${file.name}`;
        await fileSystemService.moveFile(file.uri, newUri);
        
        // 更新文件信息
        const updatedFile = { ...file, uri: newUri };
        
        // 更新数据库
        await databaseService.updateFile(id, { uri: newUri });
        
        // 更新状态
        set((state) => ({
          files: state.files.map(f => f.id === id ? updatedFile : f),
        }));
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    toggleFavorite: async (id: string) => {
      try {
        const file = get().files.find(f => f.id === id);
        if (!file) {
          throw new Error('文件不存在');
        }

        const updatedFile = { ...file, isFavorite: !file.isFavorite };
        
        // 更新数据库
        await databaseService.updateFile(id, { isFavorite: updatedFile.isFavorite });
        
        // 更新状态
        set((state) => ({
          files: state.files.map(f => f.id === id ? updatedFile : f),
        }));
      } catch (error) {
        set({ error: error.message });
      }
    },

    // Directory operations
    createDirectory: async (name: string, parentId?: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const path = `${get().currentPath}/${name}`;
        
        // 创建目录
        await fileSystemService.createDirectory(path);
        
        // 创建目录项
        const directory: DirectoryItem = {
          id: `dir_${Date.now()}`,
          name,
          path,
          createdAt: new Date(),
          modifiedAt: new Date(),
          parentId,
          isFavorite: false,
          isDeleted: false,
          itemCount: 0,
          totalSize: 0,
        };

        // 保存到数据库
        await databaseService.saveDirectory({
          id: directory.id,
          name: directory.name,
          path: directory.path,
          createdAt: directory.createdAt,
          modifiedAt: directory.modifiedAt,
          parentId: directory.parentId,
          isFavorite: directory.isFavorite,
          isDeleted: directory.isDeleted,
          itemCount: directory.itemCount,
          totalSize: directory.totalSize,
        });

        // 添加到状态
        set((state) => ({
          directories: [...state.directories, directory],
        }));
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    deleteDirectory: async (id: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const directory = get().directories.find(d => d.id === id);
        if (!directory) {
          throw new Error('目录不存在');
        }

        // 删除目录
        await fileSystemService.deleteDirectory(directory.path, true);
        
        // 从数据库删除
        await databaseService.deleteDirectory(id);
        
        // 从状态中删除
        set((state) => ({
          directories: state.directories.filter(d => d.id !== id),
        }));
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    // Search and filter
    searchFiles: async (query: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const searchResults = await databaseService.searchFiles(query);
        
        const files: FileItem[] = searchResults.map(dbFile => ({
          id: dbFile.id,
          name: dbFile.name,
          uri: dbFile.uri,
          size: dbFile.size,
          type: dbFile.type,
          mimeType: dbFile.mimeType,
          createdAt: new Date(dbFile.createdAt),
          modifiedAt: new Date(dbFile.modifiedAt),
          hash: dbFile.hash,
          thumbnailUri: dbFile.thumbnailUri,
          isFavorite: dbFile.isFavorite,
          isDeleted: dbFile.isDeleted,
          parentId: dbFile.parentId,
          metadata: dbFile.metadata,
        }));

        set({ files, isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    filterByType: async (type: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const allFiles = await databaseService.getAllFiles();
        const filteredFiles = allFiles.filter(file => file.type === type);
        
        const files: FileItem[] = filteredFiles.map(dbFile => ({
          id: dbFile.id,
          name: dbFile.name,
          uri: dbFile.uri,
          size: dbFile.size,
          type: dbFile.type,
          mimeType: dbFile.mimeType,
          createdAt: new Date(dbFile.createdAt),
          modifiedAt: new Date(dbFile.modifiedAt),
          hash: dbFile.hash,
          thumbnailUri: dbFile.thumbnailUri,
          isFavorite: dbFile.isFavorite,
          isDeleted: dbFile.isDeleted,
          parentId: dbFile.parentId,
          metadata: dbFile.metadata,
        }));

        set({ files, isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    clearSearch: () => {
      get().loadFiles();
    },

    // Selection
    selectFile: (id: string) => {
      set((state) => ({
        selectedFiles: state.selectedFiles.includes(id)
          ? state.selectedFiles.filter(selectedId => selectedId !== id)
          : [...state.selectedFiles, id],
      }));
    },

    selectMultipleFiles: (ids: string[]) => {
      set({ selectedFiles: ids });
    },

    clearSelection: () => {
      set({ selectedFiles: [] });
    },

    selectAll: () => {
      set((state) => ({
        selectedFiles: state.files.map(file => file.id),
      }));
    },

    // Navigation
    navigateTo: async (path: string) => {
      try {
        set({ isLoading: true, error: null });
        
        // 列出目录内容
        const files = await fileSystemService.listDirectory(path);
        
        set({ 
          files, 
          currentPath: path, 
          selectedFiles: [],
          isLoading: false 
        });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    navigateUp: async () => {
      const currentPath = get().currentPath;
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      await get().navigateTo(parentPath);
    },

    navigateHome: async () => {
      await get().navigateTo('');
    },

    // Video operations
    importVideo: async (uri: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const videoItem = await videoService.importVideo(uri);
        
        // 保存到数据库
        await databaseService.saveFile({
          id: videoItem.id,
          name: videoItem.name,
          uri: videoItem.uri,
          size: videoItem.size,
          type: videoItem.type,
          mimeType: videoItem.mimeType,
          createdAt: videoItem.createdAt,
          modifiedAt: videoItem.modifiedAt,
          hash: videoItem.hash,
          thumbnailUri: videoItem.thumbnailUri,
          isFavorite: videoItem.isFavorite,
          isDeleted: videoItem.isDeleted,
          parentId: videoItem.parentId,
          metadata: videoItem.metadata,
        });

        // 添加到状态
        set((state) => ({
          files: [...state.files, videoItem],
        }));
        
        // 刷新统计
        await get().loadStats();
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    importMultipleVideos: async (uris: string[]) => {
      try {
        set({ isLoading: true, error: null });
        
        const videoItems = await videoService.importMultipleVideos(uris);
        
        // 批量保存到数据库
        for (const videoItem of videoItems) {
          await databaseService.saveFile({
            id: videoItem.id,
            name: videoItem.name,
            uri: videoItem.uri,
            size: videoItem.size,
            type: videoItem.type,
            mimeType: videoItem.mimeType,
            createdAt: videoItem.createdAt,
            modifiedAt: videoItem.modifiedAt,
            hash: videoItem.hash,
            thumbnailUri: videoItem.thumbnailUri,
            isFavorite: videoItem.isFavorite,
            isDeleted: videoItem.isDeleted,
            parentId: videoItem.parentId,
            metadata: videoItem.metadata,
          });
        }

        // 添加到状态
        set((state) => ({
          files: [...state.files, ...videoItems],
          isLoading: false,
        }));
        
        // 刷新统计
        await get().loadStats();
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    generateThumbnail: async (fileId: string) => {
      try {
        const file = get().files.find(f => f.id === fileId);
        if (!file || file.type !== 'video') {
          throw new Error('文件不存在或不是视频文件');
        }

        const thumbnailUri = await videoService.generateThumbnail(file.uri);
        
        // 更新文件缩略图
        const updatedFile = { ...file, thumbnailUri };
        await databaseService.updateFile(fileId, { thumbnailUri });
        set((state) => ({
          files: state.files.map(f => f.id === fileId ? updatedFile : f),
        }));
      } catch (error) {
        set({ error: error.message });
      }
    },

    // Bulk operations
    bulkDelete: async (ids: string[]) => {
      try {
        set({ isLoading: true, error: null });
        
        for (const id of ids) {
          await get().deleteFile(id);
        }
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    bulkCopy: async (ids: string[], destination: string) => {
      try {
        set({ isLoading: true, error: null });
        
        for (const id of ids) {
          await get().copyFile(id, destination);
        }
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    bulkMove: async (ids: string[], destination: string) => {
      try {
        set({ isLoading: true, error: null });
        
        for (const id of ids) {
          await get().moveFile(id, destination);
        }
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    bulkFavorite: async (ids: string[], favorite: boolean) => {
      try {
        set({ isLoading: true, error: null });
        
        for (const id of ids) {
          const file = get().files.find(f => f.id === id);
          if (file) {
            const updatedFile = { ...file, isFavorite: favorite };
            await databaseService.updateFile(id, { isFavorite: favorite });
            set((state) => ({
              files: state.files.map(f => f.id === id ? updatedFile : f),
            }));
          }
        }
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },
  }))
);

// 初始化数据库连接
export const initializeFileStore = async () => {
  try {
    await databaseService.initialize();
    await useFileStore.getState().refreshAll();
  } catch (error) {
    console.error('初始化文件存储失败:', error);
    throw error;
  }
};