import { Plus } from "@/components/Icons";
import { Text } from "@/components/ui/text";
import { VideoCard } from "@/components/video";
import { useDatabase } from "@/db/provider";
import { type Video, videoTable } from "@/db/schema";
import { useScrollToTop } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Link, Stack } from "expo-router";
import * as React from "react";
import { Platform, Pressable, View } from "react-native";

export default function VideoHome() {
  return <ScreenContent />;
}

function ScreenContent() {
  const { db } = useDatabase();
  const ref = React.useRef(null);
  useScrollToTop(ref);

  const { data: videos, error } = useLiveQuery(() => {
    if (!db) return [];
    return db.select().from(videoTable).orderBy(desc(videoTable.createdAt));
  }, []);

  const renderItem = React.useCallback(
    ({ item }: { item: Video }) => (
      <VideoCard
        {...item}
        isFavorite={Boolean(item.isFavorite)}
        resolution={
          item.resolutionWidth && item.resolutionHeight
            ? { width: Number(item.resolutionWidth), height: Number(item.resolutionHeight) }
            : undefined
        }
        onToggleFavorite={(videoId) => {
          // TODO: 实现收藏功能
          console.log("Toggle favorite for video:", videoId);
        }}
      />
    ),
    [],
  );

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center bg-secondary/30">
        <Text>Loading database...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-secondary/30">
        <Text className="text-destructive pb-2">Error Loading data</Text>
      </View>
    );
  }

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
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={<View className="py-4" />}
      />
      <View className="absolute web:bottom-20 bottom-10 right-8">
        <Link href="/upload" asChild>
          <Pressable>
            <View className="bg-primary justify-center rounded-full h-[45px] w-[45px]">
              <Plus className="text-background self-center" />
            </View>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
