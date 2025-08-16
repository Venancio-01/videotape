import { ListVideo, Search, Settings, Video } from "@/components/Icons";
import { getExpoDatabase } from "@/db/drizzle";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import * as NavigationBar from "expo-navigation-bar";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  // 设置系统导航条颜色
  useEffect(() => {
    if (colorScheme === "dark") {
      NavigationBar.setBackgroundColorAsync("#000000");
      NavigationBar.setButtonStyleAsync("light"); // 手势条按钮亮色
    } else {
      NavigationBar.setBackgroundColorAsync("#ffffff");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, [colorScheme]);

  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: colorScheme === "dark" ? "#fff" : "#000",
      tabBarInactiveTintColor: colorScheme === "dark" ? "#888" : "#666",
      tabBarStyle: {
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        borderTopColor: colorScheme === "dark" ? "#333" : "#e5e5e5",
        paddingBottom: insets.bottom,
        height: 60 + insets.bottom,
      },
      headerStyle: {
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
      },
      headerTintColor: colorScheme === "dark" ? "#fff" : "#000",
    }),
    [colorScheme, insets.bottom],
  );

  try {
    const expoDb = getExpoDatabase();
    useDrizzleStudio(expoDb);
  } catch (error) {
    console.warn("Drizzle Studio not available in current environment:", error);
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "视频",
          tabBarIcon: ({ color }) => (
            <Video className="text-foreground" style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "搜索",
          tabBarIcon: ({ color }) => (
            <Search className="text-foreground" style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: "播放列表",
          tabBarIcon: ({ color }) => (
            <ListVideo className="text-foreground" style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "设置",
          tabBarIcon: ({ color }) => (
            <Settings className="text-foreground" style={{ color }} />
          ),
        }}
      />
    </Tabs>
  );
}
