import { NotificationItem } from "@/src/components/settings/NotificationItem";
import { ThemeSettingItem } from "@/src/components/settings/ThemeItem";
import List, { ListHeader } from "@/components/ui/list";
import ListItem from "@/components/ui/list-item";
import { Muted } from "@/src/components/ui/typography";
import { Archive, Bell, BookOpen, Send, Shield, Star } from "@/lib/icons";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import { Linking, Platform } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function Settings() {
  const openExternalURL = (url: string) => {
    if (Platform.OS === "web") {
      Linking.openURL(url);
    } else {
      WebBrowser.openBrowserAsync(url);
    }
  };
  return (
    <ScrollView className="flex-1 w-full px-6 bg-background pt-4 gap-y-6">
      <List>
        <ListHeader>
          <Muted>应用</Muted>
        </ListHeader>
        <ThemeSettingItem />
        {Platform.OS !== "web" && <NotificationItem />}
      </List>
    </ScrollView>
  );
}
