import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { Video } from "@/db/schema";
import { FileSystemService } from "@/services/fileSystemService";
import { PlaylistService } from "@/services/playlistService";
import type { FileItem } from "@/types/file";
import * as DocumentPicker from "expo-document-picker";
import * as MediaLibrary from "expo-media-library";
import { Stack, useRouter } from "expo-router";
import { Folder, Plus, Trash2, Video as VideoIcon } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function CreatePlaylistScreen() {
  const router = useRouter();
  const [playlistName, setPlaylistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<FileItem[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null,
  );
  const [directoryVideos, setDirectoryVideos] = useState<FileItem[]>([]);

  // 请求媒体库权限
  const requestMediaLibraryPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("权限被拒绝", "需要访问媒体库才能选择视频文件");
        return false;
      }
    }
    return true;
  };

  // 选择视频文件
  const handleSelectVideos = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      const result = await DocumentPicker.getDocumentAsync({
        type: ["video/*"],
        multiple: true,
        copyToCacheDirectory: false,
      });

      if (result.assets && result.assets.length > 0) {
        const { VideoService } = await import("@/services/fileSystemService");
        const videoService = VideoService.getInstance();
        const videoItems = await videoService.importMultipleVideos(
          result.assets.map((asset) => asset.uri),
        );
        setSelectedVideos((prev) => [...prev, ...videoItems]);
      }
    } catch (error) {
      console.error("选择视频失败:", error);
      Alert.alert("错误", "选择视频文件失败");
    }
  };

  // 从媒体库选择视频
  const handleSelectFromMediaLibrary = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        first: 20,
      });

      if (media.assets.length > 0) {
        Alert.alert("选择视频", `找到 ${media.assets.length} 个视频文件`, [
          {
            text: "选择全部",
            onPress: () => selectAllMediaVideos(media.assets),
          },
          {
            text: "取消",
            style: "cancel",
          },
        ]);
      } else {
        Alert.alert("提示", "媒体库中没有找到视频文件");
      }
    } catch (error) {
      console.error("访问媒体库失败:", error);
      Alert.alert("错误", "访问媒体库失败");
    }
  };

  // 选择所有媒体库视频
  const selectAllMediaVideos = async (assets: MediaLibrary.Asset[]) => {
    try {
      const { VideoService } = await import("@/services/fileSystemService");
      const videoService = VideoService.getInstance();
      const videoItems = await videoService.importMultipleVideos(
        assets.map((asset) => asset.uri),
      );
      setSelectedVideos((prev) => [...prev, ...videoItems]);
    } catch (error) {
      console.error("导入媒体库视频失败:", error);
      Alert.alert("错误", "导入视频失败");
    }
  };

  // 选择目录
  const handleSelectDirectory = async () => {
    try {
      if (Platform.OS === "web") {
        Alert.alert("提示", "Web 平台暂不支持目录选择");
        return;
      }

      // 在移动端，我们让用户选择一个目录中的所有视频
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      // 获取最近的视频文件
      const recentVideos = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 50,
      });

      if (recentVideos.assets.length > 0) {
        const { VideoService } = await import("@/services/fileSystemService");
        const videoService = VideoService.getInstance();
        const videoItems = await videoService.importMultipleVideos(
          recentVideos.assets.map((asset) => asset.uri),
        );
        setDirectoryVideos(videoItems);
        setSelectedDirectory("最近添加的视频");
      } else {
        Alert.alert("提示", "没有找到视频文件");
      }
    } catch (error) {
      console.error("选择目录失败:", error);
      Alert.alert("错误", "选择目录失败");
    }
  };

  // 移除选中的视频
  const removeVideo = (index: number) => {
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // 移除目录中的视频
  const removeDirectoryVideos = () => {
    setDirectoryVideos([]);
    setSelectedDirectory(null);
  };

  // 将 FileItem 转换为 Video 类型
  const convertFileItemToVideo = (fileItem: FileItem): Video => {
    return {
      id: fileItem.id,
      title: fileItem.name,
      filePath: fileItem.uri,
      thumbnailPath: fileItem.thumbnailUri,
      duration: 0, // 暂时设为 0，后续可以从视频元数据中获取
      fileSize: fileItem.size,
      format: fileItem.type,
      resolutionWidth: 0,
      resolutionHeight: 0,
      tags: [],
      category: fileItem.type,
      watchProgress: 0,
      isFavorite: false,
      playCount: 0,
      description: fileItem.metadata?.description || "",
      rating: 0,
      isArchived: false,
      createdAt: fileItem.createdAt.toISOString(),
      updatedAt: fileItem.modifiedAt.toISOString(),
    };
  };

  // 获取所有选中的视频
  const getAllSelectedVideos = () => {
    const allFileItems = [...selectedVideos, ...directoryVideos];
    return allFileItems.map(convertFileItemToVideo);
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
        isPublic: false,
        tags: [],
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "创建播放列表",
        }}
      />
      <View className="flex-1 p-6">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-6">
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

            {/* 视频选择区域 */}
            <View>
              <Text className="text-base font-medium mb-3">选择视频</Text>

              {/* 选择按钮 */}
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={handleSelectVideos}
                  className="flex-1 bg-card border border-border rounded-lg p-3 items-center"
                >
                  <VideoIcon size={20} className="text-primary mb-1" />
                  <Text className="text-sm text-foreground">选择视频文件</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSelectFromMediaLibrary}
                  className="flex-1 bg-card border border-border rounded-lg p-3 items-center"
                >
                  <Plus size={20} className="text-primary mb-1" />
                  <Text className="text-sm text-foreground">从媒体库选择</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSelectDirectory}
                  className="flex-1 bg-card border border-border rounded-lg p-3 items-center"
                >
                  <Folder size={20} className="text-primary mb-1" />
                  <Text className="text-sm text-foreground">选择目录</Text>
                </TouchableOpacity>
              </View>

              {/* 已选择的视频列表 */}
              {(selectedVideos.length > 0 || directoryVideos.length > 0) && (
                <View className="space-y-3">
                  {/* 单独选择的视频 */}
                  {selectedVideos.length > 0 && (
                    <View>
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm font-medium text-muted-foreground">
                          已选择视频 ({selectedVideos.length})
                        </Text>
                        <TouchableOpacity
                          onPress={() => setSelectedVideos([])}
                          className="p-1"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </TouchableOpacity>
                      </View>
                      <View className="space-y-2">
                        {selectedVideos.map((video, index) => (
                          <View
                            key={video.id}
                            className="bg-card border border-border rounded-lg p-3 flex-row justify-between items-center"
                          >
                            <View className="flex-1">
                              <Text
                                className="text-sm font-medium text-foreground"
                                numberOfLines={1}
                              >
                                {video.name}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {video.type} •{" "}
                                {(video.size / 1024 / 1024).toFixed(1)} MB
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => removeVideo(index)}
                              className="p-1 ml-2"
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 目录中的视频 */}
                  {selectedDirectory && directoryVideos.length > 0 && (
                    <View>
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm font-medium text-muted-foreground">
                          {selectedDirectory} ({directoryVideos.length})
                        </Text>
                        <TouchableOpacity
                          onPress={removeDirectoryVideos}
                          className="p-1"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </TouchableOpacity>
                      </View>
                      <View className="space-y-2">
                        {directoryVideos.map((video) => (
                          <View
                            key={`${selectedDirectory}-${video.id}`}
                            className="bg-card border border-border rounded-lg p-3 flex-row justify-between items-center"
                          >
                            <View className="flex-1">
                              <Text
                                className="text-sm font-medium text-foreground"
                                numberOfLines={1}
                              >
                                {video.name}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {video.type} •{" "}
                                {(video.size / 1024 / 1024).toFixed(1)} MB
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 总计 */}
                  <View className="bg-muted/50 rounded-lg p-3">
                    <Text className="text-sm font-medium text-foreground">
                      总计: {getAllSelectedVideos().length} 个视频
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 创建按钮 */}
            <View className="pt-4">
              <Button
                onPress={handleCreatePlaylist}
                disabled={
                  isLoading ||
                  !playlistName.trim() ||
                  getAllSelectedVideos().length === 0
                }
                className="w-full"
              >
                <Text>
                  {isLoading
                    ? "创建中..."
                    : `创建播放列表${getAllSelectedVideos().length > 0 ? ` (${getAllSelectedVideos().length} 个视频)` : ""}`}
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
