import { Text } from "@/components/ui/text";
import { VideoActions, VideoControls, VideoOverlay, VideoPlayer } from "@/components/video";
import { useMigrationHelper } from "@/db/drizzle";
import { useDatabase } from "@/db/provider";
import { type Video, videoTable } from "@/db/schema";
import { useVideoPlayback } from "@/hooks/useVideoPlayback";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack } from "expo-router";
import * as React from "react";
import { Dimensions, FlatList, TouchableOpacity, View } from "react-native";

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

const { width, height } = Dimensions.get("window");

interface VideoItemProps {
  video: Video;
  isVisible: boolean;
  onVideoPress: () => void;
}

const VideoItem: React.FC<VideoItemProps> = ({
  video,
  isVisible,
  onVideoPress,
}) => {
  const playback = useVideoPlayback({ video, isVisible });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onVideoPress}
      className="flex-1 bg-black"
    >
      <View className="flex-1 relative">
        <VideoPlayer video={video} playback={playback} />
        <VideoOverlay video={video} />
        <VideoControls
          isPlaying={playback.isPlaying}
          isMuted={playback.isMuted}
          onPlayPause={playback.togglePlayPause}
          onToggleMute={playback.toggleMute}
        />
        <VideoActions video={video} />
      </View>
    </TouchableOpacity>
  );
};

function ScreenContent() {
  const db = useDatabase();
  const flatListRef = React.useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const { data } = useLiveQuery(db.select().from(videoTable));

  const onViewableItemsChanged = React.useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ index: number; item: Video }>;
    }) => {
      if (viewableItems.length > 0) {
        const visibleIndex = viewableItems[0].index;
        setCurrentIndex(visibleIndex);
      }
    },
    [],
  );

  const viewabilityConfig = React.useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 300,
    }),
    [],
  );

  const renderItem = React.useCallback(
    ({ item, index }: { item: Video; index: number }) => {
      return (
        <VideoItem
          video={item}
          isVisible={index === currentIndex}
          onVideoPress={() => {
            // 可以在这里添加更多交互逻辑
          }}
        />
      );
    },
    [currentIndex],
  );

  const getItemLayout = React.useCallback(
    (data: Array<Video> | null, index: number) => ({
      length: height,
      offset: height * index,
      index,
    }),
    [height],
  );

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: "视频",
          headerShown: false,
        }}
      />

      {data && data.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-black">
          <Text className="text-white text-lg mb-2">📹 欢迎使用 Videotape</Text>
          <Text className="text-white/60 text-center mb-4">
            您的视频播放器应用
          </Text>
          <Text className="text-white/60 text-center">
            点击右下角的 + 按钮开始添加视频
          </Text>
        </View>
      )}
    </View>
  );
}
