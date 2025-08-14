import ListItem from "@/components/ui/list-item";
import { Text } from "@/components/ui/text";
import { Bell } from "@/lib/icons";
import * as IntentLauncher from "expo-intent-launcher";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Linking, Platform } from "react-native";

export const NotificationItem = () => {
  const [permission, setPermission] =
    useState<Notifications.PermissionStatus | null>(null);

  const openSettingApp = async () => {
    if (Platform.OS === "ios") {
      await Linking.openSettings();
    } else {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCALE_SETTINGS,
      );
    }
  };
  const handleRequestPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermission(status);
  };
  return (
    <ListItem
      itemLeft={(props) => <Bell {...props} />} // props adds size and color attributes
      label="通知"
      onPress={() => {
        if (permission === Notifications.PermissionStatus.DENIED) {
          openSettingApp();
        } else {
          handleRequestPermissions();
        }
      }}
      itemRight={() => (
        <Text className="text-muted-foreground">
          {permission === Notifications.PermissionStatus.GRANTED
            ? "已启用"
            : "已禁用"}
        </Text>
      )}
    />
  );
};
