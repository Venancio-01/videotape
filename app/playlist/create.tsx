import { useState, useCallback } from "react";
import { View, StyleSheet, Text, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlaylistBasicInfoForm } from "@/src/features/playlist/components/PlaylistBasicInfoForm";
import { VideoDirectorySelector } from "@/src/features/playlist/components/VideoDirectorySelector";
import { Button } from "@/components/ui/button";
import { PlaylistService } from "@/src/services/playlistService";
import type { Playlist } from "@/db/schema";
import type { CreatePlaylistForm } from "@/src/features/playlist/types/playlist";

// 创建步骤枚举
enum CreateStep {
  BASIC_INFO = 1,
  SELECT_ITEMS = 2,
}

export default function CreatePlaylistScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CreateStep>(CreateStep.BASIC_INFO);
  const [playlistData, setPlaylistData] = useState<Partial<Playlist>>({});
  const [formData, setFormData] = useState<CreatePlaylistForm>({
    selectionMode: "files",
    selectedFiles: [],
    selectedDirectory: null,
    directoryVideos: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // 处理基本信息表单提交
  const handleBasicInfoSubmit = (data: Partial<Playlist>) => {
    setPlaylistData(data);
    setCurrentStep(CreateStep.SELECT_ITEMS);
  };

  // 处理选择项目变更
  const handleSelectionChange = useCallback((data: Partial<CreatePlaylistForm>) => {
    setFormData(prevFormData => ({ ...prevFormData, ...data }));
  }, []);

  // 返回上一步
  const handleBack = () => {
    if (currentStep === CreateStep.SELECT_ITEMS) {
      setCurrentStep(CreateStep.BASIC_INFO);
    } else {
      router.back();
    }
  };

  // 创建播放列表
  const handleCreatePlaylist = async () => {
    // 验证必填字段
    if (!playlistData.name?.trim()) {
      Alert.alert("错误", "请输入播放列表名称");
      return;
    }

    if (formData.selectionMode === "files" && formData.selectedFiles.length === 0) {
      Alert.alert("错误", "请选择至少一个视频文件");
      return;
    }

    if (formData.selectionMode === "directory" && !formData.selectedDirectory) {
      Alert.alert("错误", "请选择一个目录");
      return;
    }

    setIsLoading(true);
    try {
      // 准备播放列表数据
      const playlistOptions = {
        name: playlistData.name.trim(),
        description: playlistData.description?.trim() || "",
        isPublic: playlistData.isPublic || false,
        tags: playlistData.tags || [],
        thumbnailPath: playlistData.thumbnailPath || null,
      };

      // 准备视频项目数据
      const videoItems = formData.selectionMode === "files"
        ? formData.selectedFiles.map(file => ({
          id: file.id,
          title: file.name,
          filePath: file.uri,
          duration: file.metadata?.duration || 0,
          thumbnailUri: file.thumbnailUri || null,
        }))
        : formData.directoryVideos.map(video => ({
          id: video.id,
          title: video.title,
          filePath: video.filePath,
          duration: video.duration,
          thumbnailUri: video.thumbnailUri || null,
        }));

      console.log("创建播放列表:", {
        playlist: playlistOptions,
        videos: videoItems,
        selectionMode: formData.selectionMode,
      });

      // 调用播放列表服务创建播放列表
      const result = await PlaylistService.createPlaylist(playlistOptions, videoItems);

      if (result.success) {
        // 创建成功后显示提示并返回播放列表页面
        Alert.alert(
          "成功",
          `播放列表"${playlistOptions.name}"创建成功！`,
          [
            {
              text: "确定",
              onPress: () => router.replace("/(tabs)/playlists")
            }
          ]
        );
      } else {
        // 创建失败，显示错误信息
        Alert.alert(
          "错误",
          result.error || "创建播放列表失败，请重试",
          [
            {
              text: "确定",
              onPress: () => setIsLoading(false)
            }
          ]
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error("创建播放列表失败:", error);
      Alert.alert(
        "错误",
        "创建播放列表失败，请重试",
        [
          {
            text: "确定",
            onPress: () => setIsLoading(false)
          }
        ]
      );
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
      <View className="flex-1">
        {/* 步骤指示器 */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-border">
          <View className="flex-row items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= CreateStep.BASIC_INFO
                  ? "bg-primary"
                  : "bg-muted"
                }`}
            >
              <Text
                className={`text-sm font-medium ${currentStep >= CreateStep.BASIC_INFO
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                  }`}
              >
                1
              </Text>
            </View>
            <Text className="ml-2 text-sm font-medium">基本信息</Text>
          </View>

          <View
            className={`flex-1 h-1 mx-2 ${currentStep >= CreateStep.SELECT_ITEMS
              ? "bg-primary"
              : "bg-muted"
              }`}
          />

          <View className="flex-row items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= CreateStep.SELECT_ITEMS
                ? "bg-primary"
                : "bg-muted"
                }`}
            >
              <Text
                className={`text-sm font-medium ${currentStep >= CreateStep.SELECT_ITEMS
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
                  }`}
              >
                2
              </Text>
            </View>
            <Text className="ml-2 text-sm font-medium">选择内容</Text>
          </View>
        </View>

        {/* 表单内容 */}
        <View className="flex-1">
          {currentStep === CreateStep.BASIC_INFO && (
            <PlaylistBasicInfoForm
              initialData={playlistData}
              onSubmit={handleBasicInfoSubmit}
              onCancel={() => router.back()}
              isLoading={isLoading}
              className="p-4"
            />
          )}

          {currentStep === CreateStep.SELECT_ITEMS && (
            <View className="flex-1">
              <VideoDirectorySelector
                data={formData}
                onChange={handleSelectionChange}
              />

              {/* 底部操作按钮 */}
              <View className="p-4 border-t border-border bg-background">
                <View className="flex-row gap-3">
                  <Button
                    variant="outline"
                    onPress={handleBack}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <Text>上一步</Text>
                  </Button>
                  <Button
                    onPress={handleCreatePlaylist}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <Text>{isLoading ? "创建中..." : "创建播放列表"}</Text>
                  </Button>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
