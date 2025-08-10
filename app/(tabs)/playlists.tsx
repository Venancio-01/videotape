import { FolderOpen, MoreVertical, Play, Plus } from "@/components/Icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useDatabase } from "@/db/provider";
import { type Playlist, playlistTable } from "@/db/schema";
import { FlashList } from "@shopify/flash-list";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export default function PlaylistsScreen() {
  const { db } = useDatabase();

  const { data: playlists } = useLiveQuery(
    db
      .select()
      .from(playlistTable)
      .orderBy(desc(playlistTable.createdAt))
  );

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center bg-secondary/30">
        <Text>加载数据库...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity className="mb-4">
      <Card className="rounded-2xl">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <TouchableOpacity>
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </TouchableOpacity>
        </CardHeader>
        <CardContent>
          {item.description && (
            <Text className="text-gray-600 mb-3">{item.description}</Text>
          )}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              <Text className="text-sm text-gray-600">
                {item.videoCount} 个视频
              </Text>
            </View>
            <TouchableOpacity className="bg-blue-500 px-3 py-1 rounded-full flex-row items-center gap-1">
              <Play className="w-3 h-3 text-white" />
              <Text className="text-white text-sm">播放</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background p-4">
      <Stack.Screen
        options={{
          title: "播放列表",
        }}
      />

      <FlashList
        data={playlists}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mb-4" />
            <Text className="text-lg font-semibold mb-2">暂无播放列表</Text>
            <Text className="text-gray-500 text-center mb-6">
              创建播放列表来组织您的视频
            </Text>
            <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-full flex-row items-center gap-2">
              <Plus className="w-5 h-5 text-white" />
              <Text className="text-white font-medium">创建播放列表</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={<View className="py-20" />}
      />

      {/* 悬浮按钮 */}
      <View className="absolute bottom-20 right-4">
        <TouchableOpacity className="bg-blue-500 justify-center rounded-full h-[56px] w-[56px]">
          <Plus className="text-white self-center" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
