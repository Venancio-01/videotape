/**
 * 媒体文件加载状态组件
 */

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react-native";

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
        return <ActivityIndicator size="large" color="#3b82f6" />;
      case "error":
        return <AlertCircle size={48} className="text-red-500" />;
      case "success":
        return <CheckCircle size={48} className="text-green-500" />;
      case "empty":
        return <AlertCircle size={48} className="text-gray-400" />;
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
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <RefreshCw size={16} className="text-blue-500 mr-2" />
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {getStateIcon()}
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.primaryText}>
          {getStateMessage()}
        </Text>
        
        {getSecondaryMessage() && (
          <Text style={styles.secondaryText}>
            {getSecondaryMessage()}
          </Text>
        )}
      </View>
      
      {getRetryButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  iconContainer: {
    marginBottom: 16,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  retryButtonText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
});

export default MediaLoadingState;