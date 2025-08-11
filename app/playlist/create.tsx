import { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlaylistBasicInfoForm } from "@/srcfeatures/playlist/components/PlaylistBasicInfoForm";
import { VideoDirectorySelector } from "@/src/features/playlist/components/VideoDirectorySelector";
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
  const handleSelectionChange = (data: Partial<CreatePlaylistForm>) => {
    setFormData({ ...formData, ...data });
  };

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
    if (!playlistData.name ||
        (formData.selectionMode === "files" && formData.selectedFiles.length === 0) ||
        (formData.selectionMode === "directory" && !formData.selectedDirectory)) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: 实现实际的数据库操作
      // 这里应该调用数据库服务创建播放列表并添加项目
      console.log("创建播放列表:", {
        ...playlistData,
        selectionData: formData,
      });

      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 创建成功后返回播放列表页面
      router.replace("/(tabs)/playlists");
    } catch (error) {
      console.error("创建播放列表失败:", error);
      // TODO: 显示错误提示
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1">
        {/* 步骤指示器 */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-border">
          <View className="flex-row items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                currentStep >= CreateStep.BASIC_INFO
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  currentStep >= CreateStep.BASIC_INFO
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
              className={`flex-1 h-1 mx-2 ${
                currentStep >= CreateStep.SELECT_ITEMS
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />

            <View className="flex-row items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  currentStep >= CreateStep.SELECT_ITEMS
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    currentStep >= CreateStep.SELECT_ITEMS
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
            <VideoDirectorySelector
              data={formData}
              onChange={handleSelectionChange}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
