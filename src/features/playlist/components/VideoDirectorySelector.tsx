import React, { useState, useEffect } from "react";
import { View, FlatList, TouchableOpacity, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { CreatePlaylistForm } from "../types/playlist";
import type { FileItem, DirectoryItem } from "@/src/types/file";
import type { Video } from "@/db/schema";
import { PlaylistService } from "@/src/services/playlistService";

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

  // 从服务获取文件列表
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const files = await PlaylistService.getVideoFiles();
        setFileItems(files);
      } catch (error) {
        console.error("获取文件列表失败:", error);
        Alert.alert("错误", "获取文件列表失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // 从服务获取目录列表
  useEffect(() => {
    const fetchDirectories = async () => {
      setIsLoading(true);
      try {
        const directories = await PlaylistService.getVideoDirectories();
        setDirectoryItems(directories);
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
        const videos = await PlaylistService.getDirectoryVideos(selectedDirectory.path);
        setDirectoryVideos(videos);
        onChange({ selectedDirectory, directoryVideos: videos });
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
        className={`flex-row items-center p-3 border-b border-border ${
          isSelected ? "bg-primary/10" : ""
        }`}
        onPress={() => handleFileSelect(item)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleFileSelect(item)}
        />
        <View className="ml-3 flex-1">
          <Text className="text-base">{item.name}</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {formatFileSize(item.size)} · {formatDuration(item.metadata?.duration || 0)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染目录项
  const renderDirectoryItem = ({ item }: { item: DirectoryItem }) => {
    const isSelected = selectedDirectory?.id === item.id;

    return (
      <TouchableOpacity
        className={`flex-row items-center p-3 border-b border-border ${
          isSelected ? "bg-primary/10" : ""
        }`}
        onPress={() => handleDirectorySelect(item)}
      >
        <RadioGroupItem value={item.id} />
        <View className="ml-3 flex-1">
          <Text className="text-base">{item.name}</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {item.itemCount} 个项目
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染目录中的视频项
  const renderDirectoryVideoItem = ({ item }: { item: Video }) => {
    const isSelected = selectedVideoIds.includes(item.id);

    return (
      <TouchableOpacity
        className={`flex-row items-center p-3 border-b border-border ${
          isSelected ? "bg-primary/10" : ""
        }`}
        onPress={() => handleDirectoryVideoSelect(item.id)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleDirectoryVideoSelect(item.id)}
        />
        <View className="ml-3 flex-1">
          <Text className="text-base">{item.title}</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {formatDuration(item.duration)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 border-b border-border">
        <Text className="text-lg font-semibold">选择视频</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          选择要添加到播放列表的视频
        </Text>
      </View>

      <View className="p-4 border-b border-border">
        <Text className="text-base font-medium mb-3">选择模式</Text>
        <RadioGroup
          value={selectionMode}
          onValueChange={(value) => setSelectionMode(value as "files" | "directory")}
          className="flex-row gap-6"
        >
          <View className="flex-row items-center gap-2">
            <RadioGroupItem value="files" id="files" />
            <Label htmlFor="files">选择文件</Label>
          </View>
          <View className="flex-row items-center gap-2">
            <RadioGroupItem value="directory" id="directory" />
            <Label htmlFor="directory">选择目录</Label>
          </View>
        </RadioGroup>
      </View>

      <View className="p-4 border-b border-border">
        <Input
          placeholder="搜索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="w-full"
        />
      </View>

      {selectionMode === "files" ? (
        <View className="flex-1 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base">已选择 {data.selectedFiles.length} 个文件</Text>
            {data.selectedFiles.length > 0 && (
              <Badge variant="secondary" className="px-2 py-1">
                {data.selectedFiles.length}
              </Badge>
            )}
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredFiles}
              renderItem={renderFileItem}
              keyExtractor={(item) => item.id}
              className="flex-1"
            />
          )}
        </View>
      ) : (
        <View className="flex-1">
          <View className="p-4 border-b border-border">
            <Text className="text-base font-medium mb-3">选择目录</Text>
            {isLoading ? (
              <View className="items-center justify-center">
                <Text className="text-muted-foreground">加载中...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredDirectories}
                renderItem={renderDirectoryItem}
                keyExtractor={(item) => item.id}
                className="max-h-48"
              />
            )}
          </View>

          {selectedDirectory && (
            <>
              <View className="border-b border-border">
                <View className="p-4">
                  <Text className="text-base font-medium">{selectedDirectory.name}</Text>
                  <Text className="text-sm text-muted-foreground">{selectedDirectory.path}</Text>
                </View>

                <View className="flex-row items-center justify-between px-4 pb-3">
                  <Text className="text-base">
                    已选择 {selectedVideoIds.length} / {directoryVideos.length} 个视频
                  </Text>
                  {selectedVideoIds.length > 0 && (
                    <Badge variant="secondary" className="px-2 py-1">
                      {selectedVideoIds.length}
                    </Badge>
                  )}
                </View>
              </View>

              <View className="flex-1 p-4">
                {isLoading ? (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-muted-foreground">加载中...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={directoryVideos}
                    renderItem={renderDirectoryVideoItem}
                    keyExtractor={(item) => item.id}
                    className="flex-1"
                  />
                )}
              </View>
            </>
          )}
        </View>
      )}
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

// 样式已转换为Tailwind CSS类
