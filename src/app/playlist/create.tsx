import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { Video } from "@/db/schema";
import { PlaylistService } from "@/services/playlistService";
import { NativeModules } from "react-native";
const { PersistableDirModule } = NativeModules;

// 格式化时长显示
const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return "0:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};
import { Stack, useRouter } from "expo-router";
import { Trash2, Video as VideoIcon } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatePlaylistScreen() {
  const router = useRouter();
  const [playlistName, setPlaylistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<
    Array<{
      uri: string, 
      name: string, 
      size: number,
      duration: number,
      width: number,
      height: number,
      resolutionWidth: number,
      resolutionHeight: number,
      format: string,
      mimeType: string
    }>
  >([]);

  // 选择视频文件
  const handleSelectVideos = async () => {
    try {
      const result = await PersistableDirModule.getVideosFromDir();
      
      if (result && result.length > 0) {
        setSelectedVideos((prev) => [...prev, ...result]);
      } else {
        Alert.alert("提示", "未找到视频文件，请选择包含视频文件的目录");
      }
    } catch (error) {
      console.error("选择视频失败:", error);
      Alert.alert("错误", "选择视频文件失败：" + (error.message || "未知错误"));
    }
  };

  // 移除选中的视频
  const removeVideo = (index: number) => {
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // 将原生模块返回的视频转换为 Video 类型
  const convertAssetToVideo = (
    asset: {
      uri: string, 
      name: string, 
      size: number,
      duration: number,
      width: number,
      height: number,
      resolutionWidth: number,
      resolutionHeight: number,
      format: string,
      mimeType: string
    },
  ): Video => {
    return {
      id: asset.uri,
      title: asset.name,
      filePath: asset.uri,
      thumbnailPath: null,
      duration: asset.duration,
      fileSize: asset.size,
      format: asset.format,
      resolutionWidth: asset.resolutionWidth,
      resolutionHeight: asset.resolutionHeight,
      watchProgress: 0,
      isFavorite: false,
      playCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // 获取所有选中的视频
  const getAllSelectedVideos = () => {
    return selectedVideos.map(convertAssetToVideo);
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
              <TouchableOpacity
                onPress={handleSelectVideos}
                className="bg-card border border-border rounded-lg p-3 items-center"
              >
                <VideoIcon size={20} className="text-primary mb-1" />
                <Text className="text-sm text-foreground">选择视频目录</Text>
              </TouchableOpacity>

              {/* 已选择的视频列表 */}
              {selectedVideos.length > 0 && (
                <View className="space-y-3">
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
                        key={`${video.uri}-${index}`}
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
                            {video.format.toUpperCase()} • {video.resolutionWidth}×{video.resolutionHeight} • {formatDuration(video.duration)} • {(video.size / 1024 / 1024).toFixed(1)} MB
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeVideo(index)}
                          className="p-1"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
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
