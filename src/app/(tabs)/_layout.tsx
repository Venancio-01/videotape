import { getExpoDatabase } from "@/db/drizzle";
import { ListVideo } from "@/lib/icons/ListVideo";
import { Search } from "@/lib/icons/Search";
import { Settings } from "@/lib/icons/Settings";
import { Video } from "@/lib/icons/Video";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Tabs } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function TabLayout() {
  const expoDb = getExpoDatabase();
  useDrizzleStudio(expoDb);

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "视频",
          tabBarIcon: () => <Video className="text-foreground" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "搜索",
          tabBarIcon: () => <Search className="text-foreground" />,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: "播放列表",
          tabBarIcon: () => <ListVideo className="text-foreground" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "设置",
          tabBarIcon: () => <Settings className="text-foreground" />,
        }}
      />
    </Tabs>
  );
}
