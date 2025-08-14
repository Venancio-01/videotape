import { useVideoStore } from "@/stores/videoStore";
import { Alert } from "react-native";

interface VideoActionsProps {
  video: {
    id: string;
    isFavorite: boolean;
  };
}

export const useVideoActions = ({ video }: VideoActionsProps) => {
  const { toggleFavorite, updateVideo } = useVideoStore();

  const handleLike = async () => {
    try {
      await toggleFavorite(video.id);
      await updateVideo(video.id, { isFavorite: !video.isFavorite });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return {
    handleLike,
  };
};
