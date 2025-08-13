import { Plus } from "@/components/Icons";
import { Text } from "@/components/ui/text";
import { VideoCard } from "@/components/video";
import { useMigrationHelper } from "@/db/drizzle";
import { useDatabase } from "@/db/provider";
import { type Video, videoTable } from "@/db/schema";
import { useScrollToTop } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Link, Stack } from "expo-router";
import * as React from "react";
import { Pressable, View } from "react-native";

export default function VideoHome() {
  const { success, error } = useMigrationHelper();

  if (error) {
    return (
      <View className="flex-1 gap-5 p-6 bg-secondary/30">
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View className="flex-1 gap-5 p-6 bg-secondary/30">
        <Text>Migration is in progress...</Text>
      </View>
    );
  }
  return <ScreenContent />;
}

function ScreenContent() {
  const { db, databaseService } = useDatabase();
  const ref = React.useRef(null);
  useScrollToTop(ref);

  const { data } = useLiveQuery(db.select().from(videoTable));

  const renderItem = React.useCallback(({ item }: { item: Video }) => {
    if (!item.id) return null; // 防止 id 不存在时报错

    return (
      <VideoCard
        {...item}
        id={item.id}
        isFavorite={Boolean(item.isFavorite)}
        resolution={
          item.resolutionWidth && item.resolutionHeight
            ? {
                width: Number(item.resolutionWidth),
                height: Number(item.resolutionHeight),
              }
            : undefined
        }
        onToggleFavorite={(videoId) => {
          console.log("Toggle favorite for video:", videoId);
        }}
      />
    );
  }, []);

  return (
    <View className="flex flex-col basis-full bg-background p-8">
      <Stack.Screen
        options={{
          title: "视频",
        }}
      />
      <FlashList
        ref={ref}
        className="native:overflow-hidden rounded-t-lg"
        estimatedItemSize={200}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-12">
            <Text className="text-lg mb-2">📹 欢迎使用 Videotape</Text>
            <Text className="text-sm text-muted-foreground text-center mb-4">
              您的视频播放器应用
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              点击右下角的 + 按钮开始添加视频
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View className="p-2" />}
        data={data || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={<View className="py-4" />}
      />
    </View>
  );
}
