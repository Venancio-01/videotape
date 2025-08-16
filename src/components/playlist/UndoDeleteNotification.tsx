import { Text } from "@/components/ui/text";
import type { Playlist } from "@/db/schema";
import { PlaylistService } from "@/services/playlistService";
import type * as React from "react";
import { Alert, TouchableOpacity, View } from "react-native";

interface DeletedPlaylistItem {
  playlist: Playlist;
  videos: any[];
  timestamp: number;
}

interface UndoDeleteNotificationProps {
  deletedPlaylists: DeletedPlaylistItem[];
  onUndo: (deletedItem: DeletedPlaylistItem) => void;
  onDismiss: () => void;
}

const UndoDeleteNotification: React.FC<UndoDeleteNotificationProps> = ({
  deletedPlaylists,
  onUndo,
  onDismiss,
}) => {
  if (deletedPlaylists.length === 0) {
    return null;
  }

  const latestDeleted = deletedPlaylists[0];

  return (
    <View className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2 flex-1">
        <View className="w-2 h-2 bg-warning rounded-full" />
        <Text className="text-warning-foreground text-sm flex-1">
          已删除播放列表 "{latestDeleted.playlist.name}"
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          className="px-3 py-1 bg-warning/20 rounded-md"
          onPress={() => onUndo(latestDeleted)}
        >
          <Text className="text-warning-foreground text-sm font-medium">
            撤销
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="p-1" onPress={onDismiss}>
          <Text className="text-warning-foreground/70 text-xs">✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UndoDeleteNotification;
