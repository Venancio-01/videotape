import { Text } from "@/components/ui/text";
import {
  EnhancedVideoControls,
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
        <Text>
          Migration error: {typeof error === "string" ? error : error.message}
        </Text>
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
  onFullscreenChange: (isFullscreen: boolean) => void;
}

const VideoItem: React.FC<VideoItemProps> = ({
  video,
  isVisible,
  onFullscreenChange,
}) => {
  const playback = useVideoPlayback({ video, isVisible });
  const insets = useSafeAreaInsets();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [lastTap, setLastTap] = React.useState(0);
  const controlsRef = React.useRef<{ showControls: () => void }>(null);

  const handleVideoPress = () => {
    const now = Date.now();
    const timeDiff = now - lastTap;

    if (timeDiff < 300) {
      // 双击：暂停/播放
      playback.togglePlayPause();
    } else {
      // 单击：只显示控制栏
      controlsRef.current?.showControls();
    }

    setLastTap(now);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleVideoPress}
      className="bg-background"
      style={{
        height: height - insets.top - (40 + insets.bottom),
        marginTop: insets.top,
        marginBottom: 60 + insets.bottom,
        width: width,
      }}
    >
      <View className="flex-1 relative">
        <VideoPlayer
          video={video}
          player={playback.player}
          onFullscreenChange={onFullscreenChange}
        />
        {/* <VideoOverlay video={video} onVideoPress={handleVideoPress} /> */}
        <EnhancedVideoControls
          ref={controlsRef}
          isPlaying={playback.isPlaying}
          isMuted={playback.isMuted}
          currentTime={playback.currentTime}
          duration={playback.duration}
          onPlayPause={playback.togglePlayPause}
          onMuteToggle={playback.toggleMute}
          onSeek={playback.seekTo}
          onRewind={playback.rewind}
          onForward={playback.forward}
          isFullscreen={isFullscreen}
          showControls={true}
          video={video}
          player={playback.player}
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
      itemVisiblePercentThreshold: 85,
      minimumViewTime: 0,
    }),
    [],
  );

  const renderItem = React.useCallback(
    ({ item, index }: { item: Video; index: number }) => {
      return (
        <VideoItem
          video={item}
          isVisible={index === currentIndex}
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
          decelerationRate="fast"
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
