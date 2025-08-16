import { ThemeSettingItem } from "@/components/settings/ThemeItem";
import List, { ListHeader } from "@/components/ui/list";
import { Muted } from "@/components/ui/typography";
import * as React from "react";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Settings() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 w-full px-6 bg-background pt-4 gap-y-6"
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <List>
        <ListHeader>
          <Muted>应用</Muted>
        </ListHeader>
        <ThemeSettingItem />
      </List>
    </ScrollView>
  );
}
