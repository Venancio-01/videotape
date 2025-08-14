/**
 * 权限状态组件
 * 提供权限请求状态反馈和引导
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { Alert, View } from "react-native";

interface PermissionStatusProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function PermissionStatus({
  onPermissionGranted,
  onPermissionDenied,
}: PermissionStatusProps) {
  const { status, loading, requestAllPermissions } = useMediaPermissions();

  const handleRequestPermissions = async () => {
    const granted = await requestAllPermissions();
    if (granted) {
      onPermissionGranted?.();
    } else {
      onPermissionDenied?.();
      Alert.alert(
        "权限被拒绝",
        "您拒绝了媒体访问权限。某些功能可能无法正常使用。您可以在系统设置中重新开启权限。",
        [{ text: "确定", style: "default" }],
      );
    }
  };

  // 权限已授予
  if (status.media === "granted" && status.audio === "granted") {
    return (
      <Card className="m-4">
        <CardContent className="p-4">
          <Text className="text-green-600 font-semibold mb-2">
            ✓ 权限已授予
          </Text>
          <Text className="text-sm text-muted-foreground">
            应用已获得访问媒体文件和音频的权限
          </Text>
        </CardContent>
      </Card>
    );
  }

  // 权限被拒绝
  if (status.media === "denied" || status.audio === "denied") {
    return (
      <Card className="m-4">
        <CardContent className="p-4">
          <Text className="text-red-600 font-semibold mb-2">⚠ 权限被拒绝</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            应用需要媒体访问权限才能正常工作。请在系统设置中重新开启权限。
          </Text>
          <Button onPress={handleRequestPermissions} className="w-full">
            <Text>重新请求权限</Text>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 权限未确定，需要请求
  if (status.media === "undetermined" || status.audio === "undetermined") {
    return (
      <Card className="m-4">
        <CardContent className="p-4">
          <Text className="text-blue-600 font-semibold mb-2">📋 需要权限</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            应用需要访问您的媒体文件和音频权限才能提供完整功能
          </Text>
          <Button
            onPress={handleRequestPermissions}
            className="w-full"
            disabled={loading}
          >
            <Text>{loading ? "正在请求..." : "授予权限"}</Text>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 有限权限（仅 iOS）
  if (status.media === "limited") {
    return (
      <Card className="m-4">
        <CardContent className="p-4">
          <Text className="text-yellow-600 font-semibold mb-2">
            🔒 有限权限
          </Text>
          <Text className="text-sm text-muted-foreground mb-4">
            您授予了有限的媒体访问权限。某些功能可能受限。
          </Text>
          <Button onPress={handleRequestPermissions} className="w-full">
            <Text>请求完整权限</Text>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 默认状态
  return null;
}
