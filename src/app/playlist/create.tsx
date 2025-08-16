import DirectoryTree from "@/components/DirectoryTree";
import { RefreshCw } from "@/components/Icons";
import MediaLoadingState, {
  type LoadingState,
} from "@/components/MediaLoadingState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { Video } from "@/db/schema";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import {
  type DirectoryTree as DirectoryTreeType,
  type MediaFile,
  MediaFileService,
} from "@/services/mediaFileService";
import { PlaylistService } from "@/services/playlistService";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function CreatePlaylistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [playlistName, setPlaylistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<MediaFile[]>([]);
  const [directoryTree, setDirectoryTree] = useState<DirectoryTreeType | null>(
    null,
  );
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [mediaStats, setMediaStats] = useState<{
    totalFiles: number;
    totalSize: number;
    totalDuration: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);

  const mediaService = MediaFileService.getInstance();
  const { requestMediaPermissions } = useMediaPermissions();

  // 加载媒体文件和构建目录树
  const loadMediaFiles = async (forceRefresh = false) => {
    try {
      setLoadingState("loading");

      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        setLoadingState("error");
        return;
      }

      const tree = await mediaService.buildFlatDirectoryTree(forceRefresh);
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

  // 打开播放列表名称输入对话框
  const handleShowNameDialog = () => {
    const allVideos = getAllSelectedVideos();
    if (allVideos.length === 0) {
      Alert.alert("错误", "请至少选择一个视频文件");
      return;
    }
    setShowNameDialog(true);
  };

  // 创建播放列表
  const handleCreatePlaylist = async () => {
    // 验证必填字段
    if (!playlistName.trim()) {
      Alert.alert("错误", "请输入播放列表名称");
      return;
    }

    setIsLoading(true);
    setShowNameDialog(false);

    try {
      // 准备播放列表数据
      const playlistOptions = {
        name: playlistName.trim(),
        description: "",
        thumbnailPath: null,
      };

      const allVideos = getAllSelectedVideos();

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
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
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
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          <View className="p-6 space-y-6">
            {/* 媒体文件选择区域 */}
            <View className="flex-1">
              {/* 加载状态 */}
              {loadingState !== "success" && (
                <View className="flex-1">
                  <MediaLoadingState
                    state={loadingState}
                    stats={mediaStats}
                    onRetry={loadMediaFiles}
                  />
                </View>
              )}

              {/* 目录树 */}
              {loadingState === "success" && directoryTree && (
                <View className="rounded-lg">
                  <DirectoryTree
                    treeData={directoryTree.root}
                    onSelectionChange={handleSelectionChange}
                  />
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 创建按钮 */}
        <View
          className="p-6 pt-0 bg-background"
          style={{ paddingBottom: insets.bottom + 10 }}
        >
          <Button
            onPress={handleShowNameDialog}
            disabled={isLoading || selectedMediaFiles.length === 0}
            className="w-full"
          >
            <Text>
              {isLoading
                ? "创建中..."
                : `创建播放列表${selectedMediaFiles.length > 0 ? ` (${selectedMediaFiles.length} 个文件)` : ""}`}
            </Text>
          </Button>
        </View>

        {/* 播放列表名称输入对话框 */}
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>输入播放列表名称</DialogTitle>
              <DialogDescription>
                请为您选择的 {selectedMediaFiles.length}{" "}
                个视频文件输入播放列表名称
              </DialogDescription>
            </DialogHeader>
            <View className="grid gap-4 py-4">
              <Input
                placeholder="输入播放列表名称"
                value={playlistName}
                onChangeText={setPlaylistName}
                className="bg-card"
                autoFocus
              />
            </View>
            <DialogFooter>
              <View className="grid gap-4 grid-cols-2">
                <Button
                  variant="outline"
                  onPress={() => setShowNameDialog(false)}
                  disabled={isLoading}
                >
                  <Text>取消</Text>
                </Button>
                <Button
                  onPress={handleCreatePlaylist}
                  disabled={isLoading || !playlistName.trim()}
                >
                  <Text>{isLoading ? "创建中..." : "确定"}</Text>
                </Button>
              </View>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </View>
    </SafeAreaView>
  );
}
