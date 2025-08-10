import { FlashList } from "@shopify/flash-list";
import { desc, ilike, or } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack } from "expo-router";
import { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { Search as SearchIcon, X } from "@/components/Icons";
import { Text } from "@/components/ui/text";
import { VideoCard } from "@/components/video";
import { useDatabase } from "@/db/provider";
import { type Video, videoTable } from "@/db/schema";

export default function SearchScreen() {
  const { db } = useDatabase();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: videos, error } = useLiveQuery(() => {
    if (!db) return [];
    
    let query = db.select().from(videoTable);

    if (searchQuery.trim()) {
      query = query.where(
        or(
          ilike(videoTable.title, `%${searchQuery}%`),
          ilike(videoTable.category, `%${searchQuery}%`),
          ilike(videoTable.tags, `%${searchQuery}%`),
        ),
      );
    }

    return query.orderBy(desc(videoTable.createdAt));
  }, [searchQuery, db]);

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center bg-secondary/30">
        <Text>加载数据库...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Video }) => (
    <VideoCard
      {...item}
      isFavorite={item.isFavorite ?? false}
      resolution={
        item.resolutionWidth && item.resolutionHeight
          ? { width: item.resolutionWidth, height: item.resolutionHeight }
          : undefined
      }
      onToggleFavorite={(videoId) => {
        console.log("Toggle favorite for video:", videoId);
      }}
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
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
          <SearchIcon className="w-5 h-5 text-gray-400 mr-3" />
          <TextInput
            className="flex-1 text-base"
            placeholder="搜索视频标题、分类或标签..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X className="w-5 h-5 text-gray-400" />
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
            <SearchIcon className="w-16 h-16 text-gray-400 mb-4" />
            <Text className="text-lg font-semibold mb-2">
              {searchQuery ? "未找到相关视频" : "搜索视频"}
            </Text>
            <Text className="text-gray-500 text-center">
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
