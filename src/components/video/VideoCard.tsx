import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { Video } from "@/db/schema";
import { Link } from "expo-router";
import type React from "react";
import { Image, Pressable, View } from "react-native";

export interface VideoCardProps {
  video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Link href={`/video/${video.id}`} asChild>
      <Pressable>
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <View className="flex-row">
              {/* 视频缩略图 */}
              <View className="w-32 h-24 bg-muted items-center justify-center">
                {video.thumbnailPath ? (
                  <Image
                    source={{ uri: video.thumbnailPath }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center justify-center">
                    <Text className="text-2xl">📹</Text>
                  </View>
                )}
                <View className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded">
                  <Text className="text-white text-xs">
                    {formatDuration(video.duration)}
                  </Text>
                </View>
              </View>

              {/* 视频信息 */}
              <View className="flex-1 p-3">
                <Text
                  className="font-semibold text-base mb-1"
                  numberOfLines={2}
                >
                  {video.title}
                </Text>

                <View className="flex-row items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    <Text>{video.format.toUpperCase()}</Text>
                  </Badge>
                </View>

                <Text className="text-sm text-muted-foreground">
                  {formatFileSize(video.fileSize)}
                </Text>

                {video.playCount > 0 && (
                  <Text className="text-xs text-muted-foreground mt-1">
                    播放 {video.playCount} 次
                  </Text>
                )}
              </View>
            </View>
          </CardContent>
        </Card>
      </Pressable>
    </Link>
  );
};
