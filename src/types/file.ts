/**
 * 文件管理核心接口定义
 * 定义文件系统操作模块的基础接口和类型
 */

export interface FileItem {
  id: string;
  name: string;
  uri: string;
  size: number;
  type: string;
  mimeType: string;
  createdAt: Date;
  modifiedAt: Date;
  hash?: string;
  thumbnailUri?: string;
  isFavorite: boolean;
  isDeleted: boolean;
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface DirectoryItem {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  modifiedAt: Date;
  parentId?: string;
  isFavorite: boolean;
  isDeleted: boolean;
  itemCount: number;
  totalSize: number;
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface FileUploadOptions {
  destinationPath: string;
  generateThumbnail?: boolean;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

export interface FileDownloadOptions {
  destinationPath: string;
  onProgress?: (progress: number) => void;
}

export interface FileSearchOptions {
  query: string;
  type?: "file" | "directory" | "all";
  mimeType?: string[];
  sizeRange?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
  sortBy?: "name" | "size" | "modifiedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface FileWatchEvent {
  type: "create" | "modify" | "delete" | "move";
  path: string;
  timestamp: Date;
  details?: any;
}

export interface FileBackupOptions {
  destinationPath: string;
  includeDeleted?: boolean;
  compression?: boolean;
  encryption?: boolean;
  onProgress?: (progress: number) => void;
}

export interface FileRestoreOptions {
  backupPath: string;
  restorePath: string;
  overwrite?: boolean;
  onProgress?: (progress: number) => void;
}

export interface FileSecurityOptions {
  encryption?: boolean;
  password?: string;
  checksum?: boolean;
  accessControl?: boolean;
}

export interface FileSystemStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  availableSpace: number;
  lastBackup?: Date;
  lastScan?: Date;
}

// 核心服务接口
export interface IFileSystemService {
  // 基础文件操作
  readFile(uri: string): Promise<string>;
  writeFile(uri: string, content: string): Promise<FileOperationResult>;
  deleteFile(uri: string): Promise<FileOperationResult>;
  copyFile(
    sourceUri: string,
    destinationUri: string,
  ): Promise<FileOperationResult>;
  moveFile(
    sourceUri: string,
    destinationUri: string,
  ): Promise<FileOperationResult>;

  // 目录操作
  createDirectory(path: string): Promise<FileOperationResult>;
  deleteDirectory(
    path: string,
    recursive?: boolean,
  ): Promise<FileOperationResult>;
  listDirectory(path: string): Promise<FileItem[]>;

  // 文件信息
  getFileInfo(uri: string): Promise<FileItem>;
  getFileHash(uri: string): Promise<string>;
  getFileMetadata(uri: string): Promise<Record<string, any>>;

  // 搜索和过滤
  searchFiles(options: FileSearchOptions): Promise<FileItem[]>;
  filterFiles(filter: (file: FileItem) => boolean): Promise<FileItem[]>;

  // 监控
  watchDirectory(
    path: string,
    callback: (event: FileWatchEvent) => void,
  ): () => void;
  unwatchDirectory(path: string): void;

  // 备份和恢复
  backupFiles(options: FileBackupOptions): Promise<FileOperationResult>;
  restoreFiles(options: FileRestoreOptions): Promise<FileOperationResult>;

  // 统计信息
  getSystemStats(): Promise<FileSystemStats>;

  // 安全操作
  secureFile(
    uri: string,
    options: FileSecurityOptions,
  ): Promise<FileOperationResult>;
  verifyFileIntegrity(uri: string): Promise<boolean>;
}

export interface IVideoService {
  // 视频导入
  importVideo(uri: string, metadata?: Record<string, any>): Promise<FileItem>;
  importMultipleVideos(uris: string[]): Promise<FileItem[]>;

  // 视频信息提取
  extractVideoInfo(uri: string): Promise<{
    duration: number;
    width: number;
    height: number;
    bitrate: number;
    frameRate: number;
    codec: string;
    format: string;
  }>;

  // 视频缩略图
  generateThumbnail(uri: string, time?: number): Promise<string>;
  generateMultipleThumbnails(uri: string, count: number): Promise<string[]>;

  // 视频搜索
  searchVideos(query: string): Promise<FileItem[]>;
  filterVideos(filter: (video: FileItem) => boolean): Promise<FileItem[]>;

  // 视频分类
  categorizeVideos(): Promise<Map<string, FileItem[]>>;
  addVideoCategory(videoId: string, category: string): Promise<void>;
  removeVideoCategory(videoId: string, category: string): Promise<void>;

  // 视频播放
  getVideoStream(uri: string): Promise<string>;
  getVideoMetadata(uri: string): Promise<Record<string, any>>;

  // 视频编辑
  trimVideo(uri: string, startTime: number, endTime: number): Promise<string>;
  mergeVideos(uris: string[]): Promise<string>;
  extractAudio(uri: string): Promise<string>;
}

// 存储接口
export interface IFileStorage {
  saveFile(file: FileItem): Promise<void>;
  getFile(id: string): Promise<FileItem | null>;
  getAllFiles(): Promise<FileItem[]>;
  updateFile(file: FileItem): Promise<void>;
  deleteFile(id: string): Promise<void>;
  searchFiles(query: string): Promise<FileItem[]>;
}

export interface IDirectoryStorage {
  saveDirectory(directory: DirectoryItem): Promise<void>;
  getDirectory(id: string): Promise<DirectoryItem | null>;
  getAllDirectories(): Promise<DirectoryItem[]>;
  updateDirectory(directory: DirectoryItem): Promise<void>;
  deleteDirectory(id: string): Promise<void>;
}

// 状态管理接口
export interface IFileState {
  files: FileItem[];
  directories: DirectoryItem[];
  currentPath: string;
  selectedFiles: string[];
  isLoading: boolean;
  error: string | null;
  stats: FileSystemStats;
}

export interface IFileStore {
  // 状态访问
  getState(): IFileState;
  subscribe(callback: (state: IFileState) => void): () => void;

  // 状态更新
  setFiles(files: FileItem[]): void;
  addFile(file: FileItem): void;
  updateFile(file: FileItem): void;
  removeFile(id: string): void;

  setDirectories(directories: DirectoryItem[]): void;
  addDirectory(directory: DirectoryItem): void;
  updateDirectory(directory: DirectoryItem): void;
  removeDirectory(id: string): void;

  setCurrentPath(path: string): void;
  setSelectedFiles(ids: string[]): void;
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  setStats(stats: FileSystemStats): void;

  // 操作方法
  refreshFiles(): Promise<void>;
  refreshDirectories(): Promise<void>;
  refreshStats(): Promise<void>;
}
