import { Plus } from "@/components/Icons";
import EmptyPlaylistsState from "@/components/playlist/EmptyPlaylistsState";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import UndoDeleteNotification from "@/components/playlist/UndoDeleteNotification";
import { Text } from "@/components/ui/text";
import { useDatabase } from "@/db/provider";
import { playlistTable } from "@/db/schema";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";
import { useMediaStore } from "@/stores/mediaStore";
import { FlashList } from "@shopify/flash-list";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useRouter } from "expo-router";
import * as React from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlaylistsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentPlaylist } = useMediaStore();

  const {
    busyItems,
    deletedPlaylists,
    setDeletedPlaylists,
    handleSetCurrentPlaylist,
    handlePlayPlaylist,
    handleDeletePlaylist,
    handleUndoDelete,
  } = usePlaylistActions();

  const { data: playlists } = useLiveQuery(
    db.select().from(playlistTable).orderBy(desc(playlistTable.createdAt)),
  );

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center bg-secondary/30">
        <Text>加载数据库...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: (typeof playlists)[0] }) => (
    <PlaylistCard
      playlist={item}
      isBusy={busyItems.has(item.id)}
      onPlay={handlePlayPlaylist}
      onDelete={handleDeletePlaylist}
      onSetCurrent={handleSetCurrentPlaylist}
      isCurrent={currentPlaylist?.id === item.id}
    />
  );

  return (
    <View
      className="flex-1 bg-background p-4"
      style={{ paddingBottom: insets.bottom }}
    >
      <Stack.Screen
        options={{
          title: "播放列表",
          headerRight: () => (
            <TouchableOpacity
              className="mr-4"
              onPress={() => router.push("/playlist/create")}
            >
              <Plus className="w-6 h-6 text-foreground" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* 撤销删除提示 */}
      <UndoDeleteNotification
        deletedPlaylists={deletedPlaylists}
        onUndo={handleUndoDelete}
        onDismiss={() => setDeletedPlaylists([])}
      />

      <FlashList
        data={playlists}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => <EmptyPlaylistsState />}
        ListFooterComponent={
          <View style={{ paddingBottom: insets.bottom + 80 }} />
        }
      />
    </View>
  );
}
