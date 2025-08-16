import { FolderOpen, Plus } from "@/components/Icons";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import type * as React from "react";
import { TouchableOpacity, View } from "react-native";

interface EmptyPlaylistsStateProps {
  onCreatePlaylist?: () => void;
}

const EmptyPlaylistsState: React.FC<EmptyPlaylistsStateProps> = ({
  onCreatePlaylist,
}) => {
  const router = useRouter();

  const handleCreate = () => {
    if (onCreatePlaylist) {
      onCreatePlaylist();
    } else {
      router.push("/playlist/create");
    }
  };

  return (
    <View className="flex-1 items-center justify-center pt-24">
      <View className="bg-muted/20 w-24 h-24 rounded-full items-center justify-center mb-6">
        <FolderOpen className="w-12 h-12 text-muted-foreground" />
      </View>
      <Text className="text-2xl font-bold text-foreground mb-2">
        暂无播放列表
      </Text>
      <Text className="text-muted-foreground text-center mb-8 leading-relaxed px-8">
        创建播放列表来组织您的视频
      </Text>
      <TouchableOpacity
        className="bg-primary px-6 py-3 rounded-full flex-row items-center gap-2"
        onPress={handleCreate}
      >
        <Plus className="w-5 h-5 text-primary-foreground" />
        <Text className="text-primary-foreground font-semibold">
          创建播放列表
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmptyPlaylistsState;
