import { Search as SearchIcon, X } from "@/components/Icons";
import { Text } from "@/components/ui/text";
import { VideoCard } from "@/components/video";
import { useDatabase } from "@/db/provider";
import { type Video, videoTable } from "@/db/schema";
import { FlashList } from "@shopify/flash-list";
import { ilike } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack } from "expo-router";
import { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
  const db = useDatabase();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: videos } = useLiveQuery(
    db
      .select()
      .from(videoTable)
      .where(
        ilike(videoTable.title, `%${searchQuery}%`),
      ),
  );

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center bg-secondary/30">
        <Text>加载数据库...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Video }) => (
    <VideoCard
      video={item}
    />
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "搜索",
        }}
      />

      {/* 搜索栏 */}
      <View className="p-4 border-b border-border">
        <View className="flex-row items-center bg-secondary rounded-lg px-4 py-3">
          <SearchIcon className="w-5 h-5 text-muted-foreground mr-3" />
          <TextInput
            className="flex-1 text-base text-foreground"
            placeholder="搜索视频标题..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="hsl(var(--muted-foreground))"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X className="w-5 h-5 text-muted-foreground" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 搜索结果 */}
      <FlashList
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={300}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className="p-2" />}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-12">
            <SearchIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <Text className="text-lg font-semibold mb-2">
              {searchQuery ? "未找到相关视频" : "搜索视频"}
            </Text>
            <Text className="text-muted-foreground text-center">
              {searchQuery
                ? `没有找到包含 "${searchQuery}" 的视频`
                : "输入关键词开始搜索您的视频库"}
            </Text>
          </View>
        )}
        ListFooterComponent={<View className="py-4" />}
      />
    </View>
  );
}
