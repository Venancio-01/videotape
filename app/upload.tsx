import { View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileVideo, FolderOpen } from "@/components/Icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export default function UploadScreen() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      console.log('Selected video:', file);
      
      // TODO: 实现视频文件处理和保存到数据库
      Alert.alert(
        "视频已选择",
        `文件名: ${file.name}\n大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
        [
          { text: "取消", style: "cancel" },
          { text: "确定", onPress: () => router.back() }
        ]
      );
      
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert("错误", "选择视频文件时发生错误");
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const image = result.assets[0];
      console.log('Selected thumbnail:', image);
      
      // TODO: 处理缩略图
      Alert.alert("缩略图已选择", "缩略图选择成功");
      
    } catch (error) {
      console.error('Error picking thumbnail:', error);
      Alert.alert("错误", "选择缩略图时发生错误");
    }
  };

  const scanVideos = async () => {
    // TODO: 实现扫描设备上的视频文件
    Alert.alert("功能开发中", "视频扫描功能即将推出");
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "添加视频",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-4">
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View className="flex-1 p-6">
        {/* 上传进度 */}
        {uploading && (
          <View className="bg-blue-50 rounded-lg p-4 mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-blue-900 font-medium">上传中...</Text>
              <Text className="text-blue-600 text-sm">{uploadProgress}%</Text>
            </View>
            <View className="w-full bg-blue-200 rounded-full h-2">
              <View 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </View>
          </View>
        )}

        {/* 上传选项 */}
        <View className="space-y-4">
          {/* 选择视频文件 */}
          <TouchableOpacity
            onPress={pickVideo}
            className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 items-center justify-center"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <Text className="text-lg font-semibold text-gray-700 mb-2">
              选择视频文件
            </Text>
            <Text className="text-gray-500 text-center mb-4">
              支持格式: MP4, MOV, AVI, MKV
            </Text>
            <View className="bg-blue-500 px-4 py-2 rounded-full">
              <Text className="text-white font-medium">浏览文件</Text>
            </View>
          </TouchableOpacity>

          {/* 扫描设备视频 */}
          <TouchableOpacity
            onPress={scanVideos}
            className="bg-gray-50 rounded-xl p-6 items-center justify-center"
          >
            <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
            <Text className="text-lg font-semibold text-gray-700 mb-2">
              扫描设备视频
            </Text>
            <Text className="text-gray-500 text-center">
              自动扫描设备上的视频文件
            </Text>
          </TouchableOpacity>

          {/* 批量上传 */}
          <TouchableOpacity
            onPress={() => Alert.alert("功能开发中", "批量上传功能即将推出")}
            className="bg-gray-50 rounded-xl p-6 items-center justify-center"
          >
            <FileVideo className="w-12 h-12 text-gray-400 mb-4" />
            <Text className="text-lg font-semibold text-gray-700 mb-2">
              批量上传
            </Text>
            <Text className="text-gray-500 text-center">
              一次选择多个视频文件
            </Text>
          </TouchableOpacity>
        </View>

        {/* 提示信息 */}
        <View className="mt-8 bg-blue-50 rounded-lg p-4">
          <Text className="text-blue-900 font-medium mb-2">提示</Text>
          <Text className="text-blue-700 text-sm leading-relaxed">
            • 支持常见的视频格式
            {"\n"}
            • 大文件上传可能需要一些时间
            {"\n"}
            • 视频文件将保存在本地设备上
            {"\n"}
            • 可以为视频选择自定义缩略图
          </Text>
        </View>
      </View>
    </View>
  );
}