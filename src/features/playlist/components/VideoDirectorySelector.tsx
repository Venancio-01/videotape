import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { Button } from "../../../components/ui/button";
import { Text } from "../../../components/ui/text";
import { Card } from "../../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Input } from "../../../components/ui/input";
import { VideoSelectionItem } from "../types/playlist";
import type { CreatePlaylistForm } from "../types/playlist";
import type { FileItem, DirectoryItem } from "../../../types/file";
import type { Video } from "../../../db/schema";

interface VideoDirectorySelectorProps {
  data: CreatePlaylistForm;
  onChange: (data: Partial<CreatePlaylistForm>) => void;
}

export function VideoDirectorySelector({ data, onChange }: VideoDirectorySelectorProps) {
  const [selectionMode, setSelectionMode] = useState<"files" | "directory">(data.selectionMode);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [directoryItems, setDirectoryItems] = useState<DirectoryItem[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<DirectoryItem | null>(data.selectedDirectory);
  const [directoryVideos, setDirectoryVideos] = useState<Video[]>(data.directoryVideos);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 模拟从文件系统服务获取文件列表
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        // 这里应该调用实际的文件系统服务
        // 现在使用模拟数据
        const mockFiles: FileItem[] = [
          { id: "1", name: "视频1.mp4", path: "/path/to/video1.mp4", size: 1024000, duration: 120, thumbnailUri: "" },
          { id: "2", name: "视频2.mp4", path: "/path/to/video2.mp4", size: 2048000, duration: 180, thumbnailUri: "" },
          { id: "3", name: "视频3.mp4", path: "/path/to/video3.mp4", size: 3072000, duration: 240, thumbnailUri: "" },
        ];
        setFileItems(mockFiles);
      } catch (error) {
        console.error("获取文件列表失败:", error);
        Alert.alert("错误", "获取文件列表失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // 模拟从文件系统服务获取目录列表
  useEffect(() => {
    const fetchDirectories = async () => {
      setIsLoading(true);
      try {
        // 这里应该调用实际的文件系统服务
        // 现在使用模拟数据
        const mockDirectories: DirectoryItem[] = [
          { id: "dir1", name: "电影", path: "/path/to/movies", itemCount: 5 },
          { id: "dir2", name: "音乐视频", path: "/path/to/music", itemCount: 8 },
          { id: "dir3", name: "纪录片", path: "/path/to/documentaries", itemCount: 3 },
        ];
        setDirectoryItems(mockDirectories);
      } catch (error) {
        console.error("获取目录列表失败:", error);
        Alert.alert("错误", "获取目录列表失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectories();
  }, []);

  // 当选择模式改变时，更新表单数据
  useEffect(() => {
    onChange({ selectionMode });
  }, [selectionMode, onChange]);

  // 当选择的目录改变时，获取目录中的视频
  useEffect(() => {
    const fetchDirectoryVideos = async () => {
      if (!selectedDirectory) return;
      
      setIsLoading(true);
      try {
        // 这里应该调用实际的文件系统服务
        // 现在使用模拟数据
        const mockVideos: Video[] = [
          { id: "vid1", title: "电影1", filePath: "/path/to/movies/movie1.mp4", duration: 5400, thumbnailUri: "" },
          { id: "vid2", title: "电影2", filePath: "/path/to/movies/movie2.mp4", duration: 7200, thumbnailUri: "" },
          { id: "vid3", title: "电影3", filePath: "/path/to/movies/movie3.mp4", duration: 6300, thumbnailUri: "" },
        ];
        setDirectoryVideos(mockVideos);
        onChange({ selectedDirectory, directoryVideos: mockVideos });
      } catch (error) {
        console.error("获取目录视频失败:", error);
        Alert.alert("错误", "获取目录视频失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectoryVideos();
  }, [selectedDirectory, onChange]);

  // 处理文件选择
  const handleFileSelect = (file: FileItem) => {
    const isSelected = data.selectedFiles.some(f => f.id === file.id);
    let updatedFiles: FileItem[];
    
    if (isSelected) {
      updatedFiles = data.selectedFiles.filter(f => f.id !== file.id);
    } else {
      updatedFiles = [...data.selectedFiles, file];
    }
    
    onChange({ selectedFiles: updatedFiles });
  };

  // 处理目录选择
  const handleDirectorySelect = (directory: DirectoryItem) => {
    setSelectedDirectory(directory);
  };

  // 处理目录中的视频选择
  const handleDirectoryVideoSelect = (videoId: string) => {
    const isSelected = selectedVideoIds.includes(videoId);
    let updatedVideoIds: string[];
    
    if (isSelected) {
      updatedVideoIds = selectedVideoIds.filter(id => id !== videoId);
    } else {
      updatedVideoIds = [...selectedVideoIds, videoId];
    }
    
    setSelectedVideoIds(updatedVideoIds);
  };

  // 过滤文件和目录
  const filteredFiles = fileItems.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredDirectories = directoryItems.filter(directory => 
    directory.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 渲染文件项
  const renderFileItem = ({ item }: { item: FileItem }) => {
    const isSelected = data.selectedFiles.some(f => f.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleFileSelect(item)}
      >
        <View style={styles.itemContent}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleFileSelect(item)}
          />
          <View style={styles.itemInfo}>
            <Text variant="body">{item.name}</Text>
            <Text variant="caption" style={styles.itemMeta}>
              {formatFileSize(item.size)} · {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染目录项
  const renderDirectoryItem = ({ item }: { item: DirectoryItem }) => {
    const isSelected = selectedDirectory?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleDirectorySelect(item)}
      >
        <View style={styles.itemContent}>
          <RadioGroupItem value={item.id} />
          <View style={styles.itemInfo}>
            <Text variant="body">{item.name}</Text>
            <Text variant="caption" style={styles.itemMeta}>
              {item.itemCount} 个项目
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染目录中的视频项
  const renderDirectoryVideoItem = ({ item }: { item: Video }) => {
    const isSelected = selectedVideoIds.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleDirectoryVideoSelect(item.id)}
      >
        <View style={styles.itemContent}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleDirectoryVideoSelect(item.id)}
          />
          <View style={styles.itemInfo}>
            <Text variant="body">{item.title}</Text>
            <Text variant="caption" style={styles.itemMeta}>
              {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="title">选择视频</Text>
          <Text variant="body" style={styles.subtitle}>
            选择要添加到播放列表的视频
          </Text>
        </View>

        <View style={styles.selectionModeContainer}>
          <Text variant="subheading" style={styles.selectionModeLabel}>
            选择模式
          </Text>
          <RadioGroup
            value={selectionMode}
            onValueChange={(value) => setSelectionMode(value as "files" | "directory")}
            style={styles.radioGroup}
          >
            <View style={styles.radioItem}>
              <RadioGroupItem value="files" id="files" />
              <Label htmlFor="files">选择文件</Label>
            </View>
            <View style={styles.radioItem}>
              <RadioGroupItem value="directory" id="directory" />
              <Label htmlFor="directory">选择目录</Label>
            </View>
          </RadioGroup>
        </View>

        <Separator style={styles.separator} />

        <View style={styles.searchContainer}>
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {selectionMode === "files" ? (
          <View style={styles.filesContainer}>
            <View style={styles.selectedInfo}>
              <Text variant="body">已选择 {data.selectedFiles.length} 个文件</Text>
              {data.selectedFiles.length > 0 && (
                <Badge variant="secondary">
                  {data.selectedFiles.length}
                </Badge>
              )}
            </View>
            
            {isLoading ? (
              <Text variant="body">加载中...</Text>
            ) : (
              <FlatList
                data={filteredFiles}
                renderItem={renderFileItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
              />
            )}
          </View>
        ) : (
          <View style={styles.directoryContainer}>
            <View style={styles.directorySelection}>
              <Text variant="subheading">选择目录</Text>
              {isLoading ? (
                <Text variant="body">加载中...</Text>
              ) : (
                <FlatList
                  data={filteredDirectories}
                  renderItem={renderDirectoryItem}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                />
              )}
            </View>

            {selectedDirectory && (
              <>
                <Separator style={styles.separator} />
                <View style={styles.directoryVideos}>
                  <View style={styles.directoryHeader}>
                    <Text variant="subheading">{selectedDirectory.name}</Text>
                    <Text variant="caption">{selectedDirectory.path}</Text>
                  </View>
                  
                  <View style={styles.selectedInfo}>
                    <Text variant="body">
                      已选择 {selectedVideoIds.length} / {directoryVideos.length} 个视频
                    </Text>
                    {selectedVideoIds.length > 0 && (
                      <Badge variant="secondary">
                        {selectedVideoIds.length}
                      </Badge>
                    )}
                  </View>
                  
                  {isLoading ? (
                    <Text variant="body">加载中...</Text>
                  ) : (
                    <FlatList
                      data={directoryVideos}
                      renderItem={renderDirectoryVideoItem}
                      keyExtractor={(item) => item.id}
                      style={styles.list}
                    />
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

// 辅助函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 辅助函数：格式化时长
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subtitle: {
    color: "#666",
    marginTop: 4,
  },
  selectionModeContainer: {
    padding: 16,
  },
  selectionModeLabel: {
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 24,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  separator: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInput: {},
  filesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedItem: {
    backgroundColor: "#f0f7ff",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemMeta: {
    color: "#666",
    marginTop: 2,
  },
  directoryContainer: {
    flex: 1,
  },
  directorySelection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  directoryVideos: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  directoryHeader: {
    marginBottom: 12,
  },
});