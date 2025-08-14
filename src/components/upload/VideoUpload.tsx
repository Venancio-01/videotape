/**
 * 视频上传组件 - 支持从媒体库选择视频
 */

import { AndroidPermissionHelper } from "@/utils/androidPermissionHelper";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useState } from "react";
import { Alert, View, ActivityIndicator } from "react-native";

interface VideoUploadProps {
  onVideoSelected: (uri: string, assetInfo: any) => void;
  multiple?: boolean;
}

export function VideoUpload({ onVideoSelected, multiple = false }: VideoUploadProps) {
  const [loading, setLoading] = useState(false);
  const permissionHelper = AndroidPermissionHelper.getInstance();

  const handleMediaLibraryPick = async () => {
    try {
      setLoading(true);
      
      // 请求权限
      const hasPermission = await permissionHelper.requestMediaPermissions();
      if (!hasPermission) {
        Alert.alert("权限错误", "需要媒体访问权限才能选择视频");
        return;
      }

      if (multiple) {
        // 多选模式
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsMultipleSelection: true,
          quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
          for (const asset of result.assets) {
            const assetInfo = await permissionHelper.getVideoAssetById(asset.assetId || '');
            onVideoSelected(asset.uri, assetInfo);
          }
        }
      } else {
        // 单选模式
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          const assetInfo = await permissionHelper.getVideoAssetById(asset.assetId || '');
          onVideoSelected(asset.uri, assetInfo);
        }
      }
    } catch (error) {
      console.error("从媒体库选择视频失败:", error);
      Alert.alert("错误", "无法从媒体库选择视频");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPicker = async () => {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/avi', 'video/mov', 'video/*'],
        copyToCacheDirectory: true,
        multiple,
      });

      if (result.type === 'success') {
        if (multiple && Array.isArray(result.assets)) {
          for (const asset of result.assets) {
            onVideoSelected(asset.uri, asset);
          }
        } else if (!multiple && !Array.isArray(result.assets)) {
          onVideoSelected(result.uri, result);
        }
      }
    } catch (error) {
      console.error("从文件选择器选择视频失败:", error);
      Alert.alert("错误", "无法选择视频文件");
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseMediaLibrary = async () => {
    try {
      setLoading(true);
      
      const hasPermission = await permissionHelper.requestMediaPermissions();
      if (!hasPermission) {
        Alert.alert("权限错误", "需要媒体访问权限才能浏览视频");
        return;
      }

      // 获取所有视频资源
      const videos = await permissionHelper.getVideoAssets();
      
      if (videos.length === 0) {
        Alert.alert("提示", "没有找到视频文件");
        return;
      }

      // 简单的选择界面 - 实际应用中应该使用更好的 UI
      Alert.alert(
        "选择视频",
        `找到 ${videos.length} 个视频文件\n\n第一个视频: ${videos[0].filename}`,
        [
          {
            text: "选择第一个",
            onPress: () => {
              onVideoSelected(videos[0].uri, videos[0]);
            },
          },
          {
            text: "取消",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("浏览媒体库失败:", error);
      Alert.alert("错误", "无法浏览媒体库");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2">加载中...</Text>
      </View>
    );
  }

  return (
    <Card className="m-4">
      <CardContent className="p-4">
        <Text className="text-lg font-bold mb-4">添加视频</Text>
        
        <View className="gap-3">
          <Button
            onPress={handleMediaLibraryPick}
            className="w-full"
          >
            <Text>从相册选择</Text>
          </Button>

          <Button
            onPress={handleDocumentPicker}
            variant="outline"
            className="w-full"
          >
            <Text>从文件选择</Text>
          </Button>

          <Button
            onPress={handleBrowseMediaLibrary}
            variant="outline"
            className="w-full"
          >
            <Text>浏览媒体库</Text>
          </Button>
        </View>

        <Text className="text-sm text-muted-foreground mt-4">
          提示：Android 11+ 需要媒体访问权限才能访问视频文件
        </Text>
      </CardContent>
    </Card>
  );
}