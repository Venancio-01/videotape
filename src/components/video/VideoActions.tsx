import { useVideoActions } from "@/hooks/useVideoActions";
import { Text } from "@/components/ui/text";
import { Heart, MessageCircle, Share } from "lucide-react-native";
import { Animated, TouchableOpacity, View } from "react-native";
import React from "react";

interface VideoActionsProps {
  video: {
    id: string;
    isFavorite: boolean;
  };
}

export const VideoActions: React.FC<VideoActionsProps> = ({ video }) => {
  const [isLiked, setIsLiked] = React.useState(video.isFavorite);
  const [likeAnimation] = React.useState(new Animated.Value(1));
  const { handleLike } = useVideoActions({ video });

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
    </View>
  );
};
