import { Play } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

interface VideoControlsProps {
  isPlaying: boolean;
  onPlayPause: () => Promise<void>;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  onPlayPause,
}) => {
  return (
    <>
      <TouchableOpacity
        className="absolute inset-0 items-center justify-center"
        onPress={onPlayPause}
      >
        {!isPlaying && (
          <View className="bg-black/50 rounded-full p-4">
            <Play className="text-white" size={48} fill="white" />
          </View>
        )}
      </TouchableOpacity>
    </>
  );
};
