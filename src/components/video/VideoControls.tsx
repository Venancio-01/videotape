import { Pause, Play, Volume2, VolumeX } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  onPlayPause: () => Promise<void>;
  onToggleMute: () => Promise<void>;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  isMuted,
  onPlayPause,
  onToggleMute,
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

      <TouchableOpacity
        className="absolute top-12 right-4 bg-black/50 rounded-full p-2"
        onPress={onToggleMute}
      >
        {isMuted ? (
          <VolumeX className="text-white" size={24} />
        ) : (
          <Volume2 className="text-white" size={24} />
        )}
      </TouchableOpacity>
    </>
  );
};
