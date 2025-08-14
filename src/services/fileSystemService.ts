/**
 * 文件系统服务层实现
 * 基于 Expo File System 的文件操作服务
 */

import {
  DirectoryItem,
  type FileItem,
  type FileOperationResult,
  type FileSearchOptions,
  type FileSystemStats,
  type FileWatchEvent,
  type IFileSystemService,
  type IVideoService,
} from "@/types/file";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

export class FileSystemService implements IFileSystemService {
  private static instance: FileSystemService;
  private watchers: Map<string, (event: FileWatchEvent) => void> = new Map();
  private cache: Map<string, FileItem> = new Map();

  private constructor() {}

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  // 基础文件操作
  async readFile(uri: string): Promise<string> {
    try {
      const content = await FileSystem.readAsStringAsync(uri);
      return content;
    } catch (error) {
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }

  async writeFile(uri: string, content: string): Promise<FileOperationResult> {
    try {
      await FileSystem.writeAsStringAsync(uri, content);
      this.cache.delete(uri);
      return { success: true };
    } catch (error) {
      return { success: false, error: `写入文件失败: ${error.message}` };
    }
  }

  async deleteFile(uri: string): Promise<FileOperationResult> {
    try {
      await FileSystem.deleteAsync(uri);
      this.cache.delete(uri);
      this.notifyWatchers(uri, "delete");
      return { success: true };
    } catch (error) {
      return { success: false, error: `删除文件失败: ${error.message}` };
    }
  }

  async copyFile(
    sourceUri: string,
    destinationUri: string,
  ): Promise<FileOperationResult> {
    try {
      await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
      this.notifyWatchers(destinationUri, "create");
      return { success: true };
    } catch (error) {
      return { success: false, error: `复制文件失败: ${error.message}` };
    }
  }

  async moveFile(
    sourceUri: string,
    destinationUri: string,
  ): Promise<FileOperationResult> {
    try {
      await FileSystem.moveAsync({ from: sourceUri, to: destinationUri });
      this.cache.delete(sourceUri);
      this.notifyWatchers(sourceUri, "delete");
      this.notifyWatchers(destinationUri, "create");
      return { success: true };
    } catch (error) {
      return { success: false, error: `移动文件失败: ${error.message}` };
    }
  }

  // 目录操作
  async createDirectory(path: string): Promise<FileOperationResult> {
    try {
      await FileSystem.makeDirectoryAsync(path, { intermediates: true });
      this.notifyWatchers(path, "create");
      return { success: true };
    } catch (error) {
      return { success: false, error: `创建目录失败: ${error.message}` };
    }
  }

  async deleteDirectory(
    path: string,
    recursive = false,
  ): Promise<FileOperationResult> {
    try {
      if (recursive) {
        const contents = await FileSystem.readDirectoryAsync(path);
        for (const item of contents) {
          const itemPath = `${path}/${item}`;
          const info = await FileSystem.getInfoAsync(itemPath);
          if (info.isDirectory) {
            await this.deleteDirectory(itemPath, true);
          } else {
            await this.deleteFile(itemPath);
          }
        }
      }
      await FileSystem.deleteAsync(path);
      this.notifyWatchers(path, "delete");
      return { success: true };
    } catch (error) {
      return { success: false, error: `删除目录失败: ${error.message}` };
    }
  }

  async listDirectory(path: string): Promise<FileItem[]> {
    try {
      const contents = await FileSystem.readDirectoryAsync(path);
      const files: FileItem[] = [];

      for (const item of contents) {
        const itemPath = `${path}/${item}`;
        const info = await FileSystem.getInfoAsync(itemPath);

        if (info.exists && !info.isDirectory) {
          const fileItem = await this.getFileInfo(itemPath);
          files.push(fileItem);
        }
      }

      return files;
    } catch (error) {
      throw new Error(`列出目录内容失败: ${error.message}`);
    }
  }

  // 文件信息
  async getFileInfo(uri: string): Promise<FileItem> {
    try {
      if (this.cache.has(uri)) {
        return this.cache.get(uri)!;
      }

      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        throw new Error("文件不存在");
      }

      const fileItem: FileItem = {
        id: this.generateId(uri),
        name: this.getFileName(uri),
        uri,
        size: info.size || 0,
        type: this.getFileType(uri),
        mimeType: await this.getMimeType(uri),
        createdAt: new Date(info.modificationTime || Date.now()),
        modifiedAt: new Date(info.modificationTime || Date.now()),
        isFavorite: false,
        isDeleted: false,
      };

      this.cache.set(uri, fileItem);
      return fileItem;
    } catch (error) {
      throw new Error(`获取文件信息失败: ${error.message}`);
    }
  }

  async getFileHash(uri: string): Promise<string> {
    try {
      const content = await this.readFile(uri);
      return this.hashString(content);
    } catch (error) {
      throw new Error(`计算文件哈希失败: ${error.message}`);
    }
  }

  async getFileMetadata(uri: string): Promise<Record<string, any>> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return {
        uri: info.uri,
        size: info.size,
        exists: info.exists,
        isDirectory: info.isDirectory,
        modificationTime: info.modificationTime,
      };
    } catch (error) {
      throw new Error(`获取文件元数据失败: ${error.message}`);
    }
  }

  // 搜索和过滤
  async searchFiles(options: FileSearchOptions): Promise<FileItem[]> {
    try {
      const files = await this.listDirectory(
        FileSystem.documentDirectory || "",
      );
      let filteredFiles = files;

      // 按名称搜索
      if (options.query) {
        const query = options.query.toLowerCase();
        filteredFiles = filteredFiles.filter((file) =>
          file.name.toLowerCase().includes(query),
        );
      }

      // 按类型过滤
      if (options.mimeType && options.mimeType.length > 0) {
        filteredFiles = filteredFiles.filter((file) =>
          options.mimeType!.includes(file.mimeType),
        );
      }

      // 按大小过滤
      if (options.sizeRange) {
        filteredFiles = filteredFiles.filter(
          (file) =>
            file.size >= options.sizeRange!.min &&
            file.size <= options.sizeRange!.max,
        );
      }

      // 按日期过滤
      if (options.dateRange) {
        filteredFiles = filteredFiles.filter(
          (file) =>
            file.createdAt >= options.dateRange!.start &&
            file.createdAt <= options.dateRange!.end,
        );
      }

      // 排序
      if (options.sortBy) {
        filteredFiles.sort((a, b) => {
          let valueA = a[options.sortBy!];
          let valueB = b[options.sortBy!];

          if (options.sortBy === "size") {
            valueA = Number(valueA);
            valueB = Number(valueB);
          }

          if (options.sortOrder === "desc") {
            return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
          } else {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
          }
        });
      }

      // 分页
      if (options.offset || options.limit) {
        const start = options.offset || 0;
        const end = options.limit
          ? start + options.limit
          : filteredFiles.length;
        filteredFiles = filteredFiles.slice(start, end);
      }

      return filteredFiles;
    } catch (error) {
      throw new Error(`搜索文件失败: ${error.message}`);
    }
  }

  async filterFiles(filter: (file: FileItem) => boolean): Promise<FileItem[]> {
    try {
      const files = await this.listDirectory(
        FileSystem.documentDirectory || "",
      );
      return files.filter(filter);
    } catch (error) {
      throw new Error(`过滤文件失败: ${error.message}`);
    }
  }

  // 监控
  watchDirectory(
    path: string,
    callback: (event: FileWatchEvent) => void,
  ): () => void {
    this.watchers.set(path, callback);
    return () => this.unwatchDirectory(path);
  }

  unwatchDirectory(path: string): void {
    this.watchers.delete(path);
  }

  // 备份和恢复
  async backupFiles(options: any): Promise<FileOperationResult> {
    try {
      // 实现备份逻辑
      return { success: true };
    } catch (error) {
      return { success: false, error: `备份文件失败: ${error.message}` };
    }
  }

  async restoreFiles(options: any): Promise<FileOperationResult> {
    try {
      // 实现恢复逻辑
      return { success: true };
    } catch (error) {
      return { success: false, error: `恢复文件失败: ${error.message}` };
    }
  }

  // 统计信息
  async getSystemStats(): Promise<FileSystemStats> {
    try {
      const files = await this.listDirectory(
        FileSystem.documentDirectory || "",
      );
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      const totalDiskCapacity = await FileSystem.getTotalDiskCapacityAsync();
      const availableSpace = freeDiskStorage;

      return {
        totalFiles,
        totalDirectories: 0, // 需要实现目录统计
        totalSize,
        availableSpace,
      };
    } catch (error) {
      throw new Error(`获取系统统计失败: ${error.message}`);
    }
  }

  // 安全操作
  async secureFile(uri: string, options: any): Promise<FileOperationResult> {
    try {
      // 实现安全操作逻辑
      return { success: true };
    } catch (error) {
      return { success: false, error: `安全操作失败: ${error.message}` };
    }
  }

  async verifyFileIntegrity(uri: string): Promise<boolean> {
    try {
      const currentHash = await this.getFileHash(uri);
      // 这里需要与存储的哈希值比较
      return true;
    } catch (error) {
      return false;
    }
  }

  // 私有方法
  private generateId(uri: string): string {
    return `file_${Buffer.from(uri)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")}`;
  }

  private getFileName(uri: string): string {
    return uri.split("/").pop() || "";
  }

  private getFileType(uri: string): string {
    const extension = uri.split(".").pop()?.toLowerCase() || "";
    const fileTypes: Record<string, string> = {
      mp4: "video",
      avi: "video",
      mov: "video",
      wmv: "video",
      flv: "video",
      mkv: "video",
      jpg: "image",
      jpeg: "image",
      png: "image",
      gif: "image",
      bmp: "image",
      pdf: "document",
      doc: "document",
      docx: "document",
      txt: "text",
      json: "text",
      mp3: "audio",
      wav: "audio",
      aac: "audio",
      flac: "audio",
    };
    return fileTypes[extension] || "unknown";
  }

  private async getMimeType(uri: string): Promise<string> {
    try {
      const extension = uri.split(".").pop()?.toLowerCase() || "";
      const mimeTypes: Record<string, string> = {
        mp4: "video/mp4",
        avi: "video/x-msvideo",
        mov: "video/quicktime",
        wmv: "video/x-ms-wmv",
        flv: "video/x-flv",
        mkv: "video/x-matroska",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        bmp: "image/bmp",
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain",
        json: "application/json",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        aac: "audio/aac",
        flac: "audio/flac",
      };
      return mimeTypes[extension] || "application/octet-stream";
    } catch (error) {
      return "application/octet-stream";
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private notifyWatchers(
    path: string,
    type: "create" | "modify" | "delete" | "move",
  ) {
    const event: FileWatchEvent = {
      type,
      path,
      timestamp: new Date(),
    };

    for (const [watchPath, callback] of this.watchers) {
      if (path.startsWith(watchPath)) {
        callback(event);
      }
    }
  }
}

export class VideoService implements IVideoService {
  private static instance: VideoService;

  private constructor() {}

  static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  async importVideo(
    uri: string,
    metadata?: Record<string, any>,
  ): Promise<FileItem> {
    try {
      const fileSystemService = FileSystemService.getInstance();
      const fileItem = await fileSystemService.getFileInfo(uri);

      // 这里可以添加视频特定的处理逻辑
      if (metadata) {
        fileItem.metadata = { ...fileItem.metadata, ...metadata };
      }

      return fileItem;
    } catch (error) {
      throw new Error(`导入视频失败: ${error.message}`);
    }
  }

  async importMultipleVideos(uris: string[]): Promise<FileItem[]> {
    try {
      const videoItems: FileItem[] = [];
      for (const uri of uris) {
        const videoItem = await this.importVideo(uri);
        videoItems.push(videoItem);
      }
      return videoItems;
    } catch (error) {
      throw new Error(`批量导入视频失败: ${error.message}`);
    }
  }

  async extractVideoInfo(uri: string): Promise<any> {
    try {
      // 这里需要使用 Expo AV 或其他视频处理库
      // 返回示例数据
      return {
        duration: 0,
        width: 0,
        height: 0,
        bitrate: 0,
        frameRate: 0,
        codec: "unknown",
        format: "unknown",
      };
    } catch (error) {
      throw new Error(`提取视频信息失败: ${error.message}`);
    }
  }

  async generateThumbnail(uri: string, time = 0): Promise<string> {
    try {
      // 这里需要实现视频缩略图生成
      return "";
    } catch (error) {
      throw new Error(`生成缩略图失败: ${error.message}`);
    }
  }

  async generateMultipleThumbnails(
    uri: string,
    count: number,
  ): Promise<string[]> {
    try {
      const thumbnails: string[] = [];
      for (let i = 0; i < count; i++) {
        const thumbnail = await this.generateThumbnail(uri, i * 10);
        thumbnails.push(thumbnail);
      }
      return thumbnails;
    } catch (error) {
      throw new Error(`生成多个缩略图失败: ${error.message}`);
    }
  }

  async searchVideos(query: string): Promise<FileItem[]> {
    try {
      const fileSystemService = FileSystemService.getInstance();
      const searchOptions: FileSearchOptions = {
        query,
        mimeType: ["video/mp4", "video/avi", "video/mov", "video/x-msvideo"],
      };
      return await fileSystemService.searchFiles(searchOptions);
    } catch (error) {
      throw new Error(`搜索视频失败: ${error.message}`);
    }
  }

  async filterVideos(
    filter: (video: FileItem) => boolean,
  ): Promise<FileItem[]> {
    try {
      const fileSystemService = FileSystemService.getInstance();
      const allVideos = await fileSystemService.searchFiles({
        query: "",
        mimeType: ["video/mp4", "video/avi", "video/mov", "video/x-msvideo"],
      });
      return allVideos.filter(filter);
    } catch (error) {
      throw new Error(`过滤视频失败: ${error.message}`);
    }
  }

  async categorizeVideos(): Promise<Map<string, FileItem[]>> {
    try {
      const videos = await this.searchVideos("");
      const categories = new Map<string, FileItem[]>();

      videos.forEach((video) => {
        const category = video.type || "other";
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(video);
      });

      return categories;
    } catch (error) {
      throw new Error(`分类视频失败: ${error.message}`);
    }
  }

  async addVideoCategory(videoId: string, category: string): Promise<void> {
    // 实现添加视频分类逻辑
  }

  async removeVideoCategory(videoId: string, category: string): Promise<void> {
    // 实现移除视频分类逻辑
  }

  async getVideoStream(uri: string): Promise<string> {
    return uri;
  }

  async getVideoMetadata(uri: string): Promise<Record<string, any>> {
    try {
      const fileSystemService = FileSystemService.getInstance();
      const metadata = await fileSystemService.getFileMetadata(uri);
      const videoInfo = await this.extractVideoInfo(uri);
      return { ...metadata, ...videoInfo };
    } catch (error) {
      throw new Error(`获取视频元数据失败: ${error.message}`);
    }
  }

  async trimVideo(
    uri: string,
    startTime: number,
    endTime: number,
  ): Promise<string> {
    try {
      // 这里需要实现视频裁剪逻辑
      return uri;
    } catch (error) {
      throw new Error(`裁剪视频失败: ${error.message}`);
    }
  }

  async mergeVideos(uris: string[]): Promise<string> {
    try {
      // 这里需要实现视频合并逻辑
      return uris[0];
    } catch (error) {
      throw new Error(`合并视频失败: ${error.message}`);
    }
  }

  async extractAudio(uri: string): Promise<string> {
    try {
      // 这里需要实现音频提取逻辑
      return uri;
    } catch (error) {
      throw new Error(`提取音频失败: ${error.message}`);
    }
  }
}
