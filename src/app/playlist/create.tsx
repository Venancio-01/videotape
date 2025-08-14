import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { Video } from "@/db/schema";
import { PlaylistService } from "@/services/playlistService";
import * as DocumentPicker from "expo-document-picker";
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
    DocumentPicker.DocumentPickerAsset[]
  >([]);

  // 选择视频文件
  const handleSelectVideos = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["video/*"],
        multiple: true,
        copyToCacheDirectory: false,
      });

      if (!result.canceled) {
        setSelectedVideos((prev) => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error("选择视频失败:", error);
      Alert.alert("错误", "选择视频文件失败");
    }
  };

  // 移除选中的视频
  const removeVideo = (index: number) => {
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // 将 DocumentPickerAsset 转换为 Video 类型
  const convertAssetToVideo = (
    asset: DocumentPicker.DocumentPickerAsset,
  ): Video => {
    return {
      id: asset.uri,
      title: asset.name,
      filePath: asset.uri,
      thumbnailPath: null,
      duration: 0,
      fileSize: asset.size || 0,
      format: asset.mimeType?.split("/")[1] || "unknown",
      resolutionWidth: 0,
      resolutionHeight: 0,
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
                <Text className="text-sm text-foreground">选择视频文件</Text>
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
                            {video.mimeType} •{" "}
                            {video.size
                              ? `${(video.size / 1024 / 1024).toFixed(1)} MB`
                              : "大小未知"}
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
