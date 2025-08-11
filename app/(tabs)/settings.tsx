import { NotificationItem } from "@/components/settings/NotificationItem";
import { ThemeSettingItem } from "@/components/settings/ThemeItem";
import List, { ListHeader } from "@/components/ui/list";
import ListItem from "@/components/ui/list-item";
import { Muted } from "@/components/ui/typography";
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
        <ListHeader className="pt-8">
          <Muted>通用</Muted>
        </ListHeader>
        <ListItem
          itemLeft={(props) => <Star {...props} />} // props adds size and color attributes
          label="给我们评分"
          onPress={() =>
            openExternalURL("https://github.com/expo-starter/expo-template")
          }
        />
        <ListItem
          itemLeft={(props) => <Send {...props} />} // props adds size and color attributes
          label="发送反馈"
          onPress={() => openExternalURL("https://expostarter.com")}
        />
        <ListItem
          itemLeft={(props) => <Shield {...props} />} // props adds size and color attributes
          label="隐私政策"
          onPress={() => openExternalURL("https://expostarter.com")}
        />
        <ListItem
          itemLeft={(props) => <BookOpen {...props} />} // props adds size and color attributes
          label="服务条款"
          onPress={() => openExternalURL("https://expostarter.com")}
        />
      </List>
    </ScrollView>
  );
}
