import { useVideoActions } from "@/hooks/useVideoActions";
import { useVideoPlayback } from "@/hooks/useVideoPlayback";
import { Text } from "@/components/ui/text";
import { Heart, MessageCircle, Share, Volume2, VolumeX } from "lucide-react-native";
import { Animated, TouchableOpacity, View } from "react-native";
import React from "react";
import type { Video } from "@/db/schema";

interface VideoActionsProps {
  video: Video;
  videoRef?: React.RefObject<any>;
}

export const VideoActions: React.FC<VideoActionsProps> = ({ video, videoRef }) => {
  const [isLiked, setIsLiked] = React.useState(video.isFavorite);
  const [likeAnimation] = React.useState(new Animated.Value(1));
  const { handleLike } = useVideoActions({ video });
  
  const { isMuted, toggleMute } = useVideoPlayback({
    video,
    isVisible: true,
  });

  React.useEffect(() => {
    setIsLiked(video.isFavorite);
  }, [video.isFavorite]);

  const onLike = () => {
    setIsLiked(!isLiked);
    handleLike();

    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onMuteToggle = async () => {
    await toggleMute();
  };

  return (
    <View className="absolute right-4 bottom-24 gap-4">
      <TouchableOpacity onPress={onLike} className="items-center">
        <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
          <View className="bg-black/50 rounded-full p-3 mb-1">
            <Heart
              className={isLiked ? "text-red-500" : "text-white"}
              size={24}
              fill={isLiked ? "#ef4444" : "none"}
            />
          </View>
        </Animated.View>
        <Text className="text-white text-xs">
          {isLiked ? "已收藏" : "收藏"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onMuteToggle} className="items-center">
        <View className="bg-black/50 rounded-full p-3 mb-1">
          {isMuted ? (
            <VolumeX className="text-white" size={24} />
          ) : (
            <Volume2 className="text-white" size={24} />
          )}
        </View>
        <Text className="text-white text-xs">
          {isMuted ? "静音" : "有声"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
