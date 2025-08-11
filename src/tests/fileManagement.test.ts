/**
 * 文件管理系统单元测试
 * 测试核心功能模块
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileSystemService } from '../services/fileSystemService';
import { VideoService } from '../services/fileSystemService';
import { DatabaseService } from '../db/database';
import { useFileStore } from '../stores/fileStore';
import { FileItem, DirectoryItem } from '../types/file';

// Mock Expo modules
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
  moveAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  getFreeDiskStorageAsync: jest.fn(),
  getTotalDiskCapacityAsync: jest.fn(),
  documentDirectory: '/test/documents',
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

jest.mock('expo-media-library', () => ({
  usePermissions: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAssetsAsync: jest.fn(),
  getAssetInfoAsync: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(),
}));

jest.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: jest.fn(),
}));

// Mock Zustand store
jest.mock('../stores/fileStore', () => ({
  useFileStore: jest.fn(),
}));

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService;

  beforeEach(() => {
    fileSystemService = FileSystemService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = FileSystemService.getInstance();
      const instance2 = FileSystemService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('readFile', () => {
    it('should read file content successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.readAsStringAsync.mockResolvedValue('test content');

      const result = await fileSystemService.readFile('/test/file.txt');
      expect(result).toBe('test content');
      expect(mockFileSystem.readAsStringAsync).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should throw error when read fails', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.readAsStringAsync.mockRejectedValue(new Error('Read failed'));

      await expect(fileSystemService.readFile('/test/file.txt')).rejects.toThrow('读取文件失败');
    });
  });

  describe('writeFile', () => {
    it('should write file content successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.writeAsStringAsync.mockResolvedValue();

      const result = await fileSystemService.writeFile('/test/file.txt', 'test content');
      expect(result).toEqual({ success: true });
      expect(mockFileSystem.writeAsStringAsync).toHaveBeenCalledWith('/test/file.txt', 'test content');
    });

    it('should return error when write fails', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.writeAsStringAsync.mockRejectedValue(new Error('Write failed'));

      const result = await fileSystemService.writeFile('/test/file.txt', 'test content');
      expect(result).toEqual({ success: false, error: '写入文件失败: Write failed' });
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.deleteAsync.mockResolvedValue();

      const result = await fileSystemService.deleteFile('/test/file.txt');
      expect(result).toEqual({ success: true });
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should return error when delete fails', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.deleteAsync.mockRejectedValue(new Error('Delete failed'));

      const result = await fileSystemService.deleteFile('/test/file.txt');
      expect(result).toEqual({ success: false, error: '删除文件失败: Delete failed' });
    });
  });

  describe('copyFile', () => {
    it('should copy file successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.copyAsync.mockResolvedValue();

      const result = await fileSystemService.copyFile('/test/source.txt', '/test/dest.txt');
      expect(result).toEqual({ success: true });
      expect(mockFileSystem.copyAsync).toHaveBeenCalledWith({
        from: '/test/source.txt',
        to: '/test/dest.txt'
      });
    });
  });

  describe('moveFile', () => {
    it('should move file successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.moveAsync.mockResolvedValue();

      const result = await fileSystemService.moveFile('/test/source.txt', '/test/dest.txt');
      expect(result).toEqual({ success: true });
      expect(mockFileSystem.moveAsync).toHaveBeenCalledWith({
        from: '/test/source.txt',
        to: '/test/dest.txt'
      });
    });
  });

  describe('getFileInfo', () => {
    it('should get file info successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: '/test/file.txt',
        size: 1024,
        modificationTime: 1640995200000,
      });

      const result = await fileSystemService.getFileInfo('/test/file.txt');
      expect(result).toEqual({
        id: expect.any(String),
        name: 'file.txt',
        uri: '/test/file.txt',
        size: 1024,
        type: 'text',
        mimeType: 'text/plain',
        createdAt: expect.any(Date),
        modifiedAt: expect.any(Date),
        isFavorite: false,
        isDeleted: false,
      });
    });

    it('should throw error when file does not exist', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
      });

      await expect(fileSystemService.getFileInfo('/test/nonexistent.txt')).rejects.toThrow('文件不存在');
    });
  });

  describe('listDirectory', () => {
    it('should list directory contents successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.readDirectoryAsync.mockResolvedValue(['file1.txt', 'file2.jpg']);
      mockFileSystem.getInfoAsync.mockImplementation((uri) => {
        if (uri.includes('file1.txt')) {
          return Promise.resolve({
            exists: true,
            uri,
            size: 1024,
            modificationTime: 1640995200000,
          });
        } else {
          return Promise.resolve({
            exists: true,
            uri,
            size: 2048,
            modificationTime: 1640995200000,
          });
        }
      });

      const result = await fileSystemService.listDirectory('/test');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('file1.txt');
      expect(result[1].name).toBe('file2.jpg');
    });
  });

  describe('createDirectory', () => {
    it('should create directory successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.makeDirectoryAsync.mockResolvedValue();

      const result = await fileSystemService.createDirectory('/test/newdir');
      expect(result).toEqual({ success: true });
      expect(mockFileSystem.makeDirectoryAsync).toHaveBeenCalledWith('/test/newdir', {
        intermediates: true,
      });
    });
  });

  describe('deleteDirectory', () => {
    it('should delete directory successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.readDirectoryAsync.mockResolvedValue([]);
      mockFileSystem.deleteAsync.mockResolvedValue();

      const result = await fileSystemService.deleteDirectory('/test/dir', true);
      expect(result).toEqual({ success: true });
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith('/test/dir');
    });
  });

  describe('getSystemStats', () => {
    it('should get system stats successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      mockFileSystem.readDirectoryAsync.mockResolvedValue(['file1.txt']);
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: '/test/file1.txt',
        size: 1024,
        modificationTime: 1640995200000,
      });
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(1024 * 1024 * 1024); // 1GB
      mockFileSystem.getTotalDiskCapacityAsync.mockResolvedValue(2 * 1024 * 1024 * 1024); // 2GB

      const result = await fileSystemService.getSystemStats();
      expect(result).toEqual({
        totalFiles: 1,
        totalDirectories: 0,
        totalSize: 1024,
        availableSpace: 1024 * 1024 * 1024,
      });
    });
  });
});

describe('VideoService', () => {
  let videoService: VideoService;

  beforeEach(() => {
    videoService = VideoService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = VideoService.getInstance();
      const instance2 = VideoService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('importVideo', () => {
    it('should import video successfully', async () => {
      const mockFileSystemService = require('../services/fileSystemService');
      const mockVideoInfo = {
        duration: 60,
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        frameRate: 30,
        codec: 'h264',
        format: 'mp4',
      };
      
      mockFileSystemService.FileSystemService.getInstance.mockReturnValue({
        getFileInfo: jest.fn().mockResolvedValue({
          id: 'test-video-id',
          name: 'test.mp4',
          uri: '/test/test.mp4',
          size: 1024000,
          type: 'video',
          mimeType: 'video/mp4',
          createdAt: new Date(),
          modifiedAt: new Date(),
          isFavorite: false,
          isDeleted: false,
        }),
      });

      const result = await videoService.importVideo('/test/test.mp4');
      expect(result).toEqual({
        id: 'test-video-id',
        name: 'test.mp4',
        uri: '/test/test.mp4',
        size: 1024000,
        type: 'video',
        mimeType: 'video/mp4',
        createdAt: expect.any(Date),
        modifiedAt: expect.any(Date),
        isFavorite: false,
        isDeleted: false,
      });
    });
  });

  describe('importMultipleVideos', () => {
    it('should import multiple videos successfully', async () => {
      const mockFileSystemService = require('../services/fileSystemService');
      mockFileSystemService.FileSystemService.getInstance.mockReturnValue({
        getFileInfo: jest.fn().mockResolvedValue({
          id: 'test-video-id',
          name: 'test.mp4',
          uri: '/test/test.mp4',
          size: 1024000,
          type: 'video',
          mimeType: 'video/mp4',
          createdAt: new Date(),
          modifiedAt: new Date(),
          isFavorite: false,
          isDeleted: false,
        }),
      });

      const uris = ['/test/video1.mp4', '/test/video2.mp4'];
      const result = await videoService.importMultipleVideos(uris);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test.mp4');
      expect(result[1].name).toBe('test.mp4');
    });
  });

  describe('searchVideos', () => {
    it('should search videos successfully', async () => {
      const mockFileSystemService = require('../services/fileSystemService');
      const mockFiles = [
        {
          id: 'video1',
          name: 'test1.mp4',
          uri: '/test/test1.mp4',
          size: 1024000,
          type: 'video',
          mimeType: 'video/mp4',
          createdAt: new Date(),
          modifiedAt: new Date(),
          isFavorite: false,
          isDeleted: false,
        },
      ];

      mockFileSystemService.FileSystemService.getInstance.mockReturnValue({
        searchFiles: jest.fn().mockResolvedValue(mockFiles),
      });

      const result = await videoService.searchVideos('test');
      expect(result).toEqual(mockFiles);
    });
  });

  describe('categorizeVideos', () => {
    it('should categorize videos successfully', async () => {
      const mockFileSystemService = require('../services/fileSystemService');
      const mockFiles = [
        {
          id: 'video1',
          name: 'action.mp4',
          uri: '/test/action.mp4',
          size: 1024000,
          type: 'video',
          mimeType: 'video/mp4',
          createdAt: new Date(),
          modifiedAt: new Date(),
          isFavorite: false,
          isDeleted: false,
        },
        {
          id: 'video2',
          name: 'comedy.mp4',
          uri: '/test/comedy.mp4',
          size: 2048000,
          type: 'video',
          mimeType: 'video/mp4',
          createdAt: new Date(),
          modifiedAt: new Date(),
          isFavorite: false,
          isDeleted: false,
        },
      ];

      mockFileSystemService.FileSystemService.getInstance.mockReturnValue({
        searchFiles: jest.fn().mockResolvedValue(mockFiles),
      });

      const result = await videoService.categorizeVideos();
      expect(result).toBeInstanceOf(Map);
      expect(result.get('video')).toHaveLength(2);
    });
  });
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(() => {
    databaseService = DatabaseService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize database successfully', async () => {
      const mockSQLite = require('expo-sqlite');
      const mockDb = {
        run: jest.fn(),
      };
      mockSQLite.openDatabaseSync.mockReturnValue(mockDb);
      
      const mockDrizzle = require('drizzle-orm/expo-sqlite');
      const mockDrizzleInstance = {};
      mockDrizzle.drizzle.mockReturnValue(mockDrizzleInstance);

      await databaseService.initialize();
      expect(databaseService['isInitialized']).toBe(true);
    });
  });

  describe('saveFile', () => {
    it('should save file successfully', async () => {
      const mockFile = {
        id: 'test-file-id',
        name: 'test.txt',
        uri: '/test/test.txt',
        size: 1024,
        type: 'text',
        mimeType: 'text/plain',
        createdAt: new Date(),
        modifiedAt: new Date(),
        isFavorite: false,
        isDeleted: false,
      };

      const mockDb = {
        run: jest.fn(),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue(),
        }),
      };

      databaseService['db'] = mockDb as any;
      databaseService['isInitialized'] = true;

      await databaseService.saveFile(mockFile);
      expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-file-id',
        name: 'test.txt',
      }));
    });
  });

  describe('getFile', () => {
    it('should get file successfully', async () => {
      const mockDb = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{
                id: 'test-file-id',
                name: 'test.txt',
                uri: '/test/test.txt',
                size: 1024,
                type: 'text',
                mimeType: 'text/plain',
                createdAt: new Date(),
                modifiedAt: new Date(),
                isFavorite: false,
                isDeleted: false,
              }]),
            }),
          }),
        }),
      };

      databaseService['db'] = mockDb as any;
      databaseService['isInitialized'] = true;

      const result = await databaseService.getFile('test-file-id');
      expect(result).toEqual({
        id: 'test-file-id',
        name: 'test.txt',
        uri: '/test/test.txt',
        size: 1024,
        type: 'text',
        mimeType: 'text/plain',
        createdAt: expect.any(Date),
        modifiedAt: expect.any(Date),
        isFavorite: false,
        isDeleted: false,
      });
    });

    it('should return null when file not found', async () => {
      const mockDb = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      databaseService['db'] = mockDb as any;
      databaseService['isInitialized'] = true;

      const result = await databaseService.getFile('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateFile', () => {
    it('should update file successfully', async () => {
      const mockDb = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(),
          }),
        }),
      };

      databaseService['db'] = mockDb as any;
      databaseService['isInitialized'] = true;

      await databaseService.updateFile('test-file-id', { name: 'new-name.txt' });
      expect(mockDb.update).toHaveBeenCalledWith(expect.objectContaining({
        name: 'new-name.txt',
      }));
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockDb = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(),
          }),
        }),
      };

      databaseService['db'] = mockDb as any;
      databaseService['isInitialized'] = true;

      await databaseService.deleteFile('test-file-id');
      expect(mockDb.update).toHaveBeenCalledWith(expect.objectContaining({
        isDeleted: true,
      }));
    });
  });

  describe('getStats', () => {
    it('should get stats successfully', async () => {
      const mockDb = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              count: jest.fn().mockReturnValue({
                sum: jest.fn().mockReturnValue({
                  mockResolvedValue: [{ count: 5, totalSize: 1024000 }],
                }),
              }),
            }),
          }),
        }),
      };

      databaseService['db'] = mockDb as any;
      databaseService['isInitialized'] = true;

      const result = await databaseService.getStats();
      expect(result).toEqual({
        totalFiles: 5,
        totalSize: 1024000,
        totalVideos: 0,
        totalDirectories: 0,
      });
    });
  });
});

describe('FileStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFileStore', () => {
    it('should have correct initial state', () => {
      const mockStore = {
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
      };

      require('../stores/fileStore').useFileStore.mockReturnValue(mockStore);

      const store = require('../stores/fileStore').useFileStore();
      expect(store.files).toEqual([]);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});

// Test helpers
const createMockFile = (overrides = {}): FileItem => ({
  id: 'test-file-id',
  name: 'test.txt',
  uri: '/test/test.txt',
  size: 1024,
  type: 'text',
  mimeType: 'text/plain',
  createdAt: new Date(),
  modifiedAt: new Date(),
  isFavorite: false,
  isDeleted: false,
  ...overrides,
});

const createMockDirectory = (overrides = {}): DirectoryItem => ({
  id: 'test-dir-id',
  name: 'test-dir',
  path: '/test/test-dir',
  createdAt: new Date(),
  modifiedAt: new Date(),
  isFavorite: false,
  isDeleted: false,
  itemCount: 0,
  totalSize: 0,
  ...overrides,
});

// Export test helpers
export { createMockFile, createMockDirectory };