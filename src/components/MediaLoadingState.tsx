/**
 * 媒体文件加载状态组件
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react-native";
import { cn } from "@/lib/utils";

export type LoadingState = "loading" | "error" | "success" | "empty";

interface MediaLoadingStateProps {
  state: LoadingState;
  message?: string;
  error?: string;
  onRetry?: () => void;
  stats?: {
    totalFiles: number;
    totalSize: number;
    totalDuration: number;
  };
}

const MediaLoadingState: React.FC<MediaLoadingStateProps> = ({
  state,
  message,
  error,
  onRetry,
  stats,
}) => {
  const getStateIcon = () => {
    switch (state) {
      case "loading":
        return (
          <View className="w-12 h-12 items-center justify-center">
            <View className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </View>
        );
      case "error":
        return <AlertCircle size={48} className="text-destructive" />;
      case "success":
        return <CheckCircle size={48} className="text-green-500" />;
      case "empty":
        return <AlertCircle size={48} className="text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStateMessage = () => {
    if (message) return message;
    
    switch (state) {
      case "loading":
        return "正在扫描媒体文件...";
      case "error":
        return error || "加载媒体文件失败";
      case "success":
        if (stats) {
          return `找到 ${stats.totalFiles} 个媒体文件`;
        }
        return "媒体文件加载完成";
      case "empty":
        return "没有找到媒体文件";
      default:
        return "";
    }
  };

  const getSecondaryMessage = () => {
    if (state === "success" && stats) {
      const formatFileSize = (bytes: number): string => {
        const sizes = ["B", "KB", "MB", "GB"];
        if (bytes === 0) return "0 B";
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
      };

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

      return `${formatFileSize(stats.totalSize)} • ${formatDuration(stats.totalDuration)}`;
    }
    return null;
  };

  const getRetryButton = () => {
    if (state === "error" && onRetry) {
      return (
        <TouchableOpacity 
          className="flex-row items-center bg-card px-4 py-2 rounded-lg border border-border"
          onPress={onRetry}
        >
          <RefreshCw size={16} className="text-primary mr-2" />
          <Text className="text-sm font-medium text-primary">重试</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="mb-4">
        {getStateIcon()}
      </View>
      
      <View className="items-center mb-6">
        <Text className="text-base font-semibold text-foreground text-center mb-1">
          {getStateMessage()}
        </Text>
        
        {getSecondaryMessage() && (
          <Text className="text-sm text-muted-foreground text-center">
            {getSecondaryMessage()}
          </Text>
        )}
      </View>
      
      {getRetryButton()}
    </View>
  );
};

export default MediaLoadingState;