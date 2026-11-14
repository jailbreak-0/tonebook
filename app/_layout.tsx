import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import {
    ThemePreferenceProvider,
    useThemePreference,
} from "@/hooks/theme-preference";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigation() {
  const { resolvedScheme } = useThemePreference();

  return (
    <ThemeProvider value={resolvedScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="tone/new" options={{ title: "New Tone" }} />
        <Stack.Screen name="tone/[id]/edit" options={{ title: "Edit Tone" }} />
        <Stack.Screen name="tone/[id]" options={{ title: "Tone Detail" }} />
      </Stack>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemePreferenceProvider>
        <RootNavigation />
      </ThemePreferenceProvider>
    </GestureHandlerRootView>
  );
}
