import { Tabs } from "expo-router";
import { FolderOpen } from "@/lib/icons/FolderOpen";
import { Search } from "@/lib/icons/Search";
import { Settings } from "@/lib/icons/Settings";
import { Video } from "@/lib/icons/Video";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "视频",
          tabBarIcon: ({ color }) => <Video className="text-foreground" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "搜索",
          tabBarIcon: ({ color }) => <Search className="text-foreground" />,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: "播放列表",
          tabBarIcon: ({ color }) => <FolderOpen className="text-foreground" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "设置",
          tabBarIcon: ({ color }) => <Settings className="text-foreground" />,
        }}
      />
    </Tabs>
  );
}
