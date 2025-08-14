import "./global.css";
import { PortalHost } from "@/components/primitives/portal";
import { DatabaseProvider } from "@/db/provider";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { DARK_THEME, LIGHT_THEME } from "@/lib/constants";
import { getItem, setItem } from "@/lib/storage";
import { useColorScheme } from "@/lib/useColorScheme";
import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useSQLiteContext } from "expo-sqlite";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const db = useSQLiteContext()
  useDrizzleStudio(db)
  const { colorScheme, setColorScheme } = useColorScheme();

  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useFrameworkReady();

  useEffect(() => {
    const theme = getItem("theme");
    if (!theme) {
      setAndroidNavigationBar(colorScheme);
      setItem("theme", colorScheme);
      return;
    }
    const colorTheme = theme === "dark" ? "dark" : "light";
    setAndroidNavigationBar(colorTheme);
    if (colorTheme !== colorScheme) {
      setColorScheme(colorTheme);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <DatabaseProvider>
      <ThemeProvider value={colorScheme === "dark" ? DARK_THEME : LIGHT_THEME}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{ title: "Videotape", headerShown: false }}
              />
              <Stack.Screen
                options={{
                  headerShadowVisible: false,
                }}
                name="upload"
              />
              <Stack.Screen
                options={{
                  headerShadowVisible: false,
                }}
                name="video/[id]"
              />
            </Stack>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
      <PortalHost />
    </DatabaseProvider>
  );
}
