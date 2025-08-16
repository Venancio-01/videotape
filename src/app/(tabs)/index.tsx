import { Text } from "@/components/ui/text";
import {
  VideoActions,
  VideoControls,
  VideoOverlay,
  VideoPlayer,
} from "@/components/video";
import { useMigrationHelper } from "@/db/drizzle";
import { useDatabase } from "@/db/provider";
import { type Video, videoTable } from "@/db/schema";
import { useVideoPlayback } from "@/hooks/useVideoPlayback";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useNavigation } from "expo-router";
import * as React from "react";
import { Dimensions, FlatList, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VideoHome() {
  const { success, error } = useMigrationHelper();

  if (error) {
    return (
      <View className="flex-1 gap-5 p-6 bg-background">
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View className="flex-1 gap-5 p-6 bg-background">
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
  onFullscreenChange: (isFullscreen: boolean) => void;
}

const VideoItem: React.FC<VideoItemProps> = ({
  video,
  isVisible,
  onVideoPress,
  onFullscreenChange,
}) => {
  const playback = useVideoPlayback({ video, isVisible });
  const insets = useSafeAreaInsets();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onVideoPress}
      className="bg-background"
      style={{
        height: height - insets.top - (60 + insets.bottom),
        marginTop: insets.top,
        marginBottom: 60 + insets.bottom,
        width: width,
      }}
    >
      <View className="flex-1 relative">
        <VideoPlayer video={video} playback={playback} onFullscreenChange={onFullscreenChange} />
        <VideoOverlay video={video} />
        <VideoControls
          isPlaying={playback.isPlaying}
          onPlayPause={playback.togglePlayPause}
          isFullscreen={isFullscreen}
        />
        <VideoActions
          video={video}
          videoRef={playback.videoRef}
          isMuted={playback.isMuted}
          isFullscreen={isFullscreen}
          onMuteToggle={playback.toggleMute}
          onFullscreenChange={onFullscreenChange}
        />
      </View>
    </TouchableOpacity>
  );
};

function ScreenContent() {
  const db = useDatabase();
  const navigation = useNavigation();
  const flatListRef = React.useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const { data } = useLiveQuery(db.select().from(videoTable));

  // 处理全屏状态变化，隐藏/显示标签栏
  React.useEffect(() => {
    if (navigation.setOptions) {
      navigation.setOptions({
        tabBarStyle: {
          display: isFullscreen ? "none" : "flex",
        },
      });
    }
  }, [isFullscreen, navigation]);

  const handleFullscreenChange = React.useCallback((fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
  }, []);

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
      itemVisiblePercentThreshold: 70,
      minimumViewTime: 800,
    }),
    [],
  );

  const renderItem = React.useCallback(
    ({ item, index }: { item: Video; index: number }) => {
      return (
        <VideoItem
          video={item}
          isVisible={index === currentIndex}
          onVideoPress={() => { }}
          onFullscreenChange={handleFullscreenChange}
        />
      );
    },
    [currentIndex, handleFullscreenChange],
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
    <View className="flex-1 bg-background">
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
          decelerationRate="normal"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={5}
          contentContainerStyle={{
            paddingTop: 0,
            paddingBottom: 0,
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-background">
          <Text className="text-foreground text-lg mb-2">
            📹 欢迎使用 Videotape
          </Text>
          <Text className="text-muted-foreground text-center mb-4">
            您的视频播放器应用
          </Text>
          <Text className="text-muted-foreground text-center">
            点击右下角的 + 按钮开始添加视频
          </Text>
        </View>
      )}
    </View>
  );
}
