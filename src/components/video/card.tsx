import { Clock, Heart, Play } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatDuration } from "@/lib/utils";
import { Link } from "expo-router";
import type React from "react";
import { Image, Pressable, View } from "react-native";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

type VideoCardProps = {
  id: string;
  title: string;
  thumbnailPath?: string;
  duration: number;
  category: string;
  watchProgress: number;
  isFavorite: boolean;
  playCount: number;
  resolution?: { width: number; height: number };
  onToggleFavorite?: (videoId: string) => void;
};

export const VideoCard: React.FC<VideoCardProps> = ({
  id,
  title,
  thumbnailPath,
  duration,
  category,
  watchProgress,
  isFavorite,
  playCount,
  resolution,
  onToggleFavorite,
}) => {
  const progressPercentage =
    duration > 0 ? (watchProgress / duration) * 100 : 0;

  return (
    <Link href={`/videos/${id}`} asChild>
      <Pressable>
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader className="p-0">
            {/* 视频缩略图 */}
            <View className="relative">
              {thumbnailPath ? (
                <Image
                  source={{ uri: thumbnailPath }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-48 bg-gray-200 items-center justify-center">
                  <Play className="w-12 h-12 text-gray-400" />
                </View>
              )}

              {/* 播放时长覆盖层 */}
              <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
                <Text className="text-white text-xs font-medium">
                  {formatDuration(duration)}
                </Text>
              </View>

              {/* 分辨率标识 */}
              {resolution && (
                <View className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-medium">
                    {resolution.width}x{resolution.height}
                  </Text>
                </View>
              )}

              {/* 收藏按钮 */}
              <View className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1"
                  onPress={(e) => {
                    e.preventDefault();
                    onToggleFavorite?.(id);
                  }}
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? "text-red-500 fill-current" : "text-white"}`}
                  />
                </Button>
              </View>
            </View>
          </CardHeader>

          <CardContent className="p-4">
            {/* 视频标题 */}
            <Text className="text-lg font-semibold mb-2" numberOfLines={2}>
              {title}
            </Text>

            {/* 视频信息 */}
            <View className="flex-row items-center gap-2 mb-3">
              <Badge variant="outline">
                <Text className="text-xs">{category}</Text>
              </Badge>

              <View className="flex-row items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <Text className="text-xs text-gray-500">
                  {formatDuration(duration)}
                </Text>
              </View>

              <Text className="text-xs text-gray-500">{playCount} 次播放</Text>
            </View>

            {/* 播放进度 */}
            {watchProgress > 0 && (
              <View className="mb-2">
                <Progress
                  value={progressPercentage}
                  className="h-1"
                  indicatorClassName="bg-blue-600"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  已观看 {Math.round(progressPercentage)}%
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </Pressable>
    </Link>
  );
};
