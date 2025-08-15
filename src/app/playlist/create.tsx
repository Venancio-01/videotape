import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { Video } from "@/db/schema";
import { PlaylistService } from "@/services/playlistService";
import { MediaFileService, type MediaFile } from "@/services/mediaFileService";
import { Stack, useRouter } from "expo-router";
import { Trash2, Video as VideoIcon, RefreshCw } from "lucide-react-native";
import { useState, useEffect } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import DirectoryTree from "@/components/DirectoryTree";
import MediaLoadingState, {
  type LoadingState,
} from "@/components/MediaLoadingState";

// 格式化时长显示
const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function CreatePlaylistScreen() {
  const router = useRouter();
  const [playlistName, setPlaylistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<MediaFile[]>([]);
  const [directoryTree, setDirectoryTree] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [mediaStats, setMediaStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mediaService = MediaFileService.getInstance();
  const {
    status,
    loading: permissionLoading,
    requestMediaPermissions,
  } = useMediaPermissions();

  // 加载媒体文件和构建目录树
  const loadMediaFiles = async (forceRefresh = false) => {
    try {
      setLoadingState("loading");

      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        setLoadingState("error");
        return;
      }

      const tree = await mediaService.buildDirectoryTree(forceRefresh);
      setDirectoryTree(tree);
      setMediaStats({
        totalFiles: tree.totalFiles,
        totalSize: tree.totalSize,
        totalDuration: tree.totalDuration,
      });

      if (tree.totalFiles === 0) {
        setLoadingState("empty");
      } else {
        setLoadingState("success");
      }
    } catch (error) {
      console.error("加载媒体文件失败:", error);
      setLoadingState("error");
    } finally {
      setRefreshing(false);
    }
  };

  // 刷新媒体文件
  const handleRefresh = async () => {
    setRefreshing(true);
    mediaService.clearCache();
    await loadMediaFiles(true);
  };

  // 处理文件选择变化
  const handleSelectionChange = (selectedFiles: MediaFile[]) => {
    setSelectedMediaFiles(selectedFiles);
  };

  // 将 MediaFile 转换为 Video 类型
  const convertMediaFileToVideo = (mediaFile: MediaFile): Video => {
    return {
      id: mediaFile.id,
      title: mediaFile.filename,
      filePath: mediaFile.uri,
      thumbnailPath: null,
      duration: mediaFile.duration,
      fileSize: mediaFile.fileSize || 0,
      format: mediaFile.mimeType?.split("/")[1] || "unknown",
      resolutionWidth: mediaFile.width,
      resolutionHeight: mediaFile.height,
      watchProgress: 0,
      isFavorite: false,
      playCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // 获取所有选中的视频
  const getAllSelectedVideos = () => {
    return selectedMediaFiles.map(convertMediaFileToVideo);
  };

  // 移除选中的视频
  const removeVideo = (index: number) => {
    setSelectedMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 清除所有选择
  const clearSelection = () => {
    setSelectedMediaFiles([]);
  };

  // 创建播放列表
  const handleCreatePlaylist = async () => {
    // 验证必填字段
    if (!playlistName.trim()) {
      Alert.alert("错误", "请输入播放列表名称");
      return;
    }

    const allVideos = getAllSelectedVideos();
    if (allVideos.length === 0) {
      Alert.alert("错误", "请至少选择一个视频文件");
      return;
    }

    setIsLoading(true);
    try {
      // 准备播放列表数据
      const playlistOptions = {
        name: playlistName.trim(),
        description: "",
        thumbnailPath: null,
      };

      // 调用播放列表服务创建播放列表
      const result = await PlaylistService.createPlaylist(
        playlistOptions,
        allVideos,
      );

      if (result.success) {
        // 创建成功后显示提示并返回播放列表页面
        Alert.alert(
          "成功",
          `播放列表"${playlistOptions.name}"创建成功！已添加 ${allVideos.length} 个视频`,
          [
            {
              text: "确定",
              onPress: () => router.replace("/(tabs)/playlists"),
            },
          ],
        );
      } else {
        // 创建失败，显示错误信息
        Alert.alert("错误", result.error || "创建播放列表失败，请重试");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("创建播放列表失败:", error);
      Alert.alert("错误", "创建播放列表失败，请重试");
      setIsLoading(false);
    }
  };

  // 页面加载时自动获取媒体文件
  useEffect(() => {
    loadMediaFiles();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "创建播放列表",
          headerRight: () => (
            <TouchableOpacity
              className="mr-4"
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={20}
                className={`text-foreground ${refreshing ? "animate-spin" : ""}`}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 space-y-6">
            {/* 播放列表名称 */}
            <View>
              <Text className="text-base font-medium mb-2">播放列表名称</Text>
              <Input
                placeholder="输入播放列表名称"
                value={playlistName}
                onChangeText={setPlaylistName}
                className="bg-card"
              />
            </View>

            {/* 媒体文件选择区域 */}
            <View className="flex-1">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-base font-medium">选择媒体文件</Text>
                {selectedMediaFiles.length > 0 && (
                  <TouchableOpacity onPress={clearSelection} className="p-1">
                    <Trash2 size={16} className="text-destructive" />
                  </TouchableOpacity>
                )}
              </View>

              {/* 加载状态 */}
              {loadingState !== "success" && (
                <View className="h-64">
                  <MediaLoadingState
                    state={loadingState}
                    stats={mediaStats}
                    onRetry={loadMediaFiles}
                  />
                </View>
              )}

              {/* 目录树 */}
              {loadingState === "success" && directoryTree && (
                <View className="border border-border rounded-lg bg-card">
                  <DirectoryTree
                    treeData={directoryTree.root}
                    onSelectionChange={handleSelectionChange}
                  />
                </View>
              )}

              {/* 已选择的文件统计 */}
              {selectedMediaFiles.length > 0 && (
                <View className="mt-4 bg-muted/50 rounded-lg p-3">
                  <Text className="text-sm font-medium text-foreground">
                    已选择 {selectedMediaFiles.length} 个文件
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    总时长:{" "}
                    {formatDuration(
                      selectedMediaFiles.reduce(
                        (sum, file) => sum + file.duration,
                        0,
                      ),
                    )}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 创建按钮 */}
        <View className="p-6 pt-0">
          <Button
            onPress={handleCreatePlaylist}
            disabled={
              isLoading ||
              !playlistName.trim() ||
              selectedMediaFiles.length === 0
            }
            className="w-full"
          >
            <Text>
              {isLoading
                ? "创建中..."
                : `创建播放列表${selectedMediaFiles.length > 0 ? ` (${selectedMediaFiles.length} 个文件)` : ""}`}
            </Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
