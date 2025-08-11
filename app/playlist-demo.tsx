import { useState } from "react";
import { View } from "react-native";
import { PlaylistManager } from "@/src/features/playlist/components/PlaylistManager";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function PlaylistDemo() {
  const [showManager, setShowManager] = useState(false);

  return (
    <View className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">播放列表功能演示</Text>
        <Text className="text-muted-foreground mb-6">
          这个演示展示了完整的播放列表管理功能，包括创建、查看、搜索和排序播放列表。
        </Text>

        <Button
          onPress={() => setShowManager(!showManager)}
          className="mb-4"
        >
          <Text>{showManager ? "隐藏播放列表管理器" : "显示播放列表管理器"}</Text>
        </Button>

        {showManager && (
          <View className="border rounded-lg p-4">
            <PlaylistManager />
          </View>
        )}
      </View>
    </View>
  );
}
