import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useDatabase } from "@/db/provider";
import { videoTable } from "@/db/schema";
import {
  ArrowLeft,
  Heart,
  MoreVertical,
  Pause,
  Play,
  Share,
  SkipBack,
  SkipForward,
  Volume2,
} from "@/lib/icons";
import { videoService } from "@/services/videoService";
import { eq } from "drizzle-orm";
import { AVPlaybackStatus, Video } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { Alert, Dimensions, Pressable, View } from "react-native";

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [video, setVideo] = React.useState<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);

  React.useEffect(() => {
    if (db && id) {
      loadVideo();
    }
  }, [db, id]);

  const loadVideo = async () => {
    try {
      const result = await db!
        .select()
        .from(videoTable)
        .where(eq(videoTable.id, id));
      if (result.length > 0) {
        setVideo(result[0]);
      }
    } catch (error) {
      console.error("Error loading video:", error);
      Alert.alert("错误", "无法加载视频信息");
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seconds: number) => {
    const newTime = Math.max(
      0,
      Math.min(video?.duration || 0, currentTime + seconds),
    );
    setCurrentTime(newTime);
  };

  if (!video) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: video.title,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft className="text-foreground" />
            </Pressable>
          ),
          headerRight: () => (
            <View className="flex-row gap-2">
              <Pressable className="p-2">
                <Share className="text-foreground" />
              </Pressable>
              <Pressable className="p-2">
                <MoreVertical className="text-foreground" />
              </Pressable>
            </View>
          ),
        }}
      />

      <View className="flex-1">
        {/* 视频播放器区域 */}
        <View className="bg-black aspect-video items-center justify-center">
          <Text className="text-white text-lg">📹 视频播放器</Text>
          <Text className="text-white/60 text-sm mt-2">{video.title}</Text>
        </View>

        {/* 视频信息 */}
        <Card className="m-4">
          <CardContent className="p-4">
            <Text className="text-xl font-bold mb-2">{video.title}</Text>
            <View className="flex-row gap-4 mb-3">
              <Text className="text-muted-foreground">
                {formatDuration(video.duration)}
              </Text>
              <Text className="text-muted-foreground">
                {video.format.toUpperCase()}
              </Text>
              {video.resolutionWidth && (
                <Text className="text-muted-foreground">
                  {video.resolutionWidth}×{video.resolutionHeight}
                </Text>
              )}
            </View>
            <Text className="text-sm text-muted-foreground">
              {Math.round(video.fileSize / (1024 * 1024))} MB
            </Text>
          </CardContent>
        </Card>

        {/* 播放控制 */}
        <Card className="mx-4 mb-4">
          <CardContent className="p-4">
            {/* 进度条 */}
            <View className="mb-4">
              <View className="bg-muted h-1 rounded-full">
                <View
                  className="bg-primary h-1 rounded-full"
                  style={{ width: `${(currentTime / video.duration) * 100}%` }}
                />
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-xs text-muted-foreground">
                  {formatDuration(currentTime)}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatDuration(video.duration)}
                </Text>
              </View>
            </View>

            {/* 控制按钮 */}
            <View className="flex-row items-center justify-between">
              <Pressable onPress={() => handleSeek(-10)} className="p-2">
                <SkipBack className="text-foreground" />
              </Pressable>

              <Pressable onPress={handlePlayPause} className="p-3">
                {isPlaying ? (
                  <Pause className="text-foreground" size={32} />
                ) : (
                  <Play className="text-foreground" size={32} />
                )}
              </Pressable>

              <Pressable onPress={() => handleSeek(10)} className="p-2">
                <SkipForward className="text-foreground" />
              </Pressable>

              <Pressable className="p-2">
                <Volume2 className="text-foreground" />
              </Pressable>

              <Pressable className="p-2">
                <Heart className="text-foreground" />
              </Pressable>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}
