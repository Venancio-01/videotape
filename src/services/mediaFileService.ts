/**
 * 媒体文件服务
 * 负责获取媒体文件和构建目录树结构
 */

import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";

export interface MediaFile {
  id: string;
  uri: string;
  filename: string;
  albumId?: string;
  duration: number;
  width: number;
  height: number;
  fileSize?: number;
  creationTime: number;
  modificationTime: number;
  mediaType: "video" | "audio";
  mimeType?: string;
  isSelected: boolean;
}

export interface DirectoryNode {
  id: string;
  name: string;
  path: string;
  type: "directory" | "file";
  children?: DirectoryNode[];
  mediaFile?: MediaFile;
  isExpanded: boolean;
  isSelected: boolean;
  itemCount: number;
  totalSize?: number;
  totalDuration?: number;
}

export interface DirectoryTree {
  root: DirectoryNode;
  totalFiles: number;
  totalSize: number;
  totalDuration: number;
}

/**
 * 媒体文件服务类
 */
export class MediaFileService {
  private static instance: MediaFileService;
  private cache: Map<string, MediaFile[]> = new Map();
  private lastRefreshTime = 0;

  private constructor() {}

  static getInstance(): MediaFileService {
    if (!MediaFileService.instance) {
      MediaFileService.instance = new MediaFileService();
    }
    return MediaFileService.instance;
  }

  /**
   * 获取所有媒体文件
   */
  async getAllMediaFiles(forceRefresh = false): Promise<MediaFile[]> {
    const now = Date.now();
    const cacheValid = now - this.lastRefreshTime < 5 * 60 * 1000; // 5分钟缓存

    if (!forceRefresh && cacheValid && this.cache.has("all")) {
      return this.cache.get("all") || [];
    }

    try {
      // 获取视频文件
      const videoAssets = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        first: 2000, // 增加限制
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      // 转换视频文件
      const videoFiles = this.convertAssetsToMediaFiles(
        videoAssets.assets,
        "video",
      );

      const allFiles = [...videoFiles];

      // 缓存结果
      this.cache.set("all", allFiles);
      this.lastRefreshTime = now;

      console.log(
        `获取到 ${allFiles.length} 个媒体文件 (${videoFiles.length} 个视频)`,
      );
      return allFiles;
    } catch (error) {
      console.error("获取媒体文件失败:", error);
      throw error;
    }
  }

  /**
   * 转换 MediaLibrary 资产为 MediaFile
   */
  private convertAssetsToMediaFiles(
    assets: MediaLibrary.Asset[],
    type: "video" | "audio",
  ): MediaFile[] {
    return assets.map((asset) => ({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename || "未知文件",
      albumId: asset.albumId,
      duration: asset.duration || 0,
      width: asset.width || 0,
      height: asset.height || 0,
      fileSize: (asset as any).fileSize || 0,
      creationTime: asset.creationTime || Date.now(),
      modificationTime: asset.modificationTime || Date.now(),
      mediaType: type,
      mimeType: type === "video" ? "video/mp4" : "audio/mpeg",
      isSelected: false,
    }));
  }

  /**
   * 构建目录树结构
   */
  async buildDirectoryTree(forceRefresh = false): Promise<DirectoryTree> {
    const mediaFiles = await this.getAllMediaFiles(forceRefresh);

    const root: DirectoryNode = {
      id: "root",
      name: "所有媒体",
      path: "/",
      type: "directory",
      isExpanded: true,
      isSelected: false,
      itemCount: 0,
      children: [],
    };

    // 按目录分组
    const directoryMap = new Map<string, DirectoryNode>();

    for (const file of mediaFiles) {
      // 从 URI 提取路径
      const path = this.extractPathFromUri(file.uri);
      const pathParts = path.split("/").filter(Boolean);

      // 构建目录结构
      let currentPath = "";
      let parent = root;

      for (const [index, part] of pathParts.entries()) {
        currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
        const isFile = index === pathParts.length - 1;

        if (isFile) {
          // 文件节点
          const fileNode: DirectoryNode = {
            id: file.id,
            name: part,
            path: currentPath,
            type: "file",
            mediaFile: file,
            isExpanded: false,
            isSelected: false,
            itemCount: 1,
          };

          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(fileNode);
          parent.itemCount++;
        } else {
          // 目录节点
          if (!directoryMap.has(currentPath)) {
            const dirNode: DirectoryNode = {
              id: `dir_${currentPath}`,
              name: part,
              path: currentPath,
              type: "directory",
              isExpanded: false,
              isSelected: false,
              itemCount: 0,
              children: [],
            };

            directoryMap.set(currentPath, dirNode);

            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(dirNode);
          }

          parent = directoryMap.get(currentPath)!;
        }
      }
    }

    // 计算目录统计信息
    this.calculateDirectoryStats(root);

    // 按名称排序
    this.sortDirectoryTree(root);

    const totalStats = this.calculateTotalStats(mediaFiles);

    return {
      root,
      totalFiles: totalStats.totalFiles,
      totalSize: totalStats.totalSize,
      totalDuration: totalStats.totalDuration,
    };
  }

  /**
   * 构建扁平化目录树结构（只保留一级父路径）
   */
  async buildFlatDirectoryTree(forceRefresh = false): Promise<DirectoryTree> {
    const mediaFiles = await this.getAllMediaFiles(forceRefresh);

    const root: DirectoryNode = {
      id: "root",
      name: "所有媒体",
      path: "/",
      type: "directory",
      isExpanded: true,
      isSelected: false,
      itemCount: 0,
      children: [],
    };

    // 按一级父目录分组
    const directoryMap = new Map<string, DirectoryNode>();

    for (const file of mediaFiles) {
      // 从 URI 提取路径并只保留一级父目录
      const fullPath = this.extractPathFromUri(file.uri);
      const pathParts = fullPath.split("/").filter(Boolean);

      let directoryName = "其他文件";
      let relativePath = file.filename;

      if (pathParts.length > 1) {
        // 如果有多级路径，使用第一级作为目录名
        directoryName = pathParts[0];
        relativePath = `${pathParts.slice(1).join("/")}/${file.filename}`;
      } else {
        // 如果只有文件名，放在根目录
        relativePath = file.filename;
      }

      // 获取或创建目录节点
      let dirNode = directoryMap.get(directoryName);
      if (!dirNode) {
        dirNode = {
          id: `dir_${directoryName}`,
          name: directoryName,
          path: `/${directoryName}`,
          type: "directory",
          isExpanded: true,
          isSelected: false,
          itemCount: 0,
          children: [],
        };
        directoryMap.set(directoryName, dirNode);

        if (!root.children) {
          root.children = [];
        }
        root.children.push(dirNode);
      }

      // 文件节点
      const fileNode: DirectoryNode = {
        id: file.id,
        name: file.filename,
        path: relativePath,
        type: "file",
        mediaFile: file,
        isExpanded: false,
        isSelected: false,
        itemCount: 1,
      };

      if (!dirNode.children) {
        dirNode.children = [];
      }
      dirNode.children.push(fileNode);
      dirNode.itemCount++;
      root.itemCount++;
    }

    // 计算目录统计信息
    this.calculateDirectoryStats(root);

    // 按名称排序
    this.sortDirectoryTree(root);

    const totalStats = this.calculateTotalStats(mediaFiles);

    return {
      root,
      totalFiles: totalStats.totalFiles,
      totalSize: totalStats.totalSize,
      totalDuration: totalStats.totalDuration,
    };
  }

  /**
   * 从 URI 提取路径
   */
  private extractPathFromUri(uri: string): string {
    if (Platform.OS === "android") {
      // Android URI 格式: content://media/external/video/media/1234
      // 或者: file:///storage/emulated/0/DCIM/Camera/video.mp4
      if (uri.startsWith("file://")) {
        return decodeURIComponent(uri.substring(7)); // 移除 "file://"
      }
      if (uri.startsWith("content://")) {
        // 对于 content URI，尝试从文件名构建路径
        const filename = uri.split("/").pop() || "unknown";
        return `/DCIM/${filename}`;
      }
    } else if (Platform.OS === "ios") {
      // iOS URI 格式: ph://asset-library/video/1234
      const filename = uri.split("/").pop() || "unknown";
      return `/Videos/${filename}`;
    }

    return uri;
  }

  /**
   * 计算目录统计信息
   */
  private calculateDirectoryStats(node: DirectoryNode): void {
    if (node.type === "file") {
      return;
    }

    let totalSize = 0;
    let totalDuration = 0;

    if (node.children) {
      for (const child of node.children) {
        if (child.type === "directory") {
          this.calculateDirectoryStats(child);
          totalSize += child.totalSize || 0;
          totalDuration += child.totalDuration || 0;
        } else if (child.mediaFile) {
          totalSize += child.mediaFile.fileSize || 0;
          totalDuration += child.mediaFile.duration || 0;
        }
      }
    }

    node.totalSize = totalSize;
    node.totalDuration = totalDuration;
  }

  /**
   * 计算总统计信息
   */
  private calculateTotalStats(files: MediaFile[]) {
    return files.reduce(
      (stats, file) => ({
        totalFiles: stats.totalFiles + 1,
        totalSize: stats.totalSize + (file.fileSize || 0),
        totalDuration: stats.totalDuration + file.duration,
      }),
      { totalFiles: 0, totalSize: 0, totalDuration: 0 },
    );
  }

  /**
   * 排序目录树
   */
  private sortDirectoryTree(node: DirectoryNode): void {
    if (node.children) {
      // 目录在前，文件在后，按名称排序
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      // 递归排序子目录
      for (const child of node.children) {
        if (child.type === "directory") {
          this.sortDirectoryTree(child);
        }
      }
    }
  }

  /**
   * 获取选中的媒体文件
   */
  getSelectedFiles(
    node: DirectoryNode,
    selectedNodes?: Set<string>,
  ): MediaFile[] {
    const selectedFiles: MediaFile[] = [];

    const traverse = (currentNode: DirectoryNode) => {
      if (currentNode.type === "file" && currentNode.mediaFile) {
        const isSelected = selectedNodes
          ? selectedNodes.has(currentNode.id)
          : currentNode.isSelected;
        if (isSelected) {
          selectedFiles.push(currentNode.mediaFile);
        }
      }

      if (currentNode.children) {
        for (const child of currentNode.children) {
          traverse(child);
        }
      }
    };

    traverse(node);
    return selectedFiles;
  }

  /**
   * 切换节点选中状态
   */
  toggleNodeSelection(node: DirectoryNode, isSelected: boolean): void {
    node.isSelected = isSelected;

    if (node.type === "directory" && node.children) {
      // 递归设置子节点选中状态
      for (const child of node.children) {
        this.toggleNodeSelection(child, isSelected);
      }
    }
  }

  /**
   * 切换目录展开状态
   */
  toggleDirectoryExpansion(node: DirectoryNode): void {
    if (node.type === "directory") {
      node.isExpanded = !node.isExpanded;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.lastRefreshTime = 0;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * 格式化时长
   */
  formatDuration(seconds: number): string {
    if (seconds <= 0) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
}
