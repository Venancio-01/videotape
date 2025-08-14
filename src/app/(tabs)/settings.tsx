import { NotificationItem } from "@/components/settings/NotificationItem";
import { ThemeSettingItem } from "@/components/settings/ThemeItem";
import List, { ListHeader } from "@/components/ui/list";
import { Muted } from "@/components/ui/typography";
import * as React from "react";
import { Platform } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function Settings() {
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
