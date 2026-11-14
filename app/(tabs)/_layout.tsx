import { Tabs } from "expo-router";
import React from "react";

import type { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs/types";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useThemePreference } from "@/hooks/theme-preference";

export default function TabLayout() {
  const { resolvedScheme } = useThemePreference();
  const isDark = resolvedScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[resolvedScheme].tint,
        tabBarInactiveTintColor: isDark ? "#767575" : "#3f4a55",
        tabBarStyle: {
          backgroundColor: isDark ? "#131313" : "#ffffff",
          borderTopColor: isDark ? "#262626" : "#c4ccd8",
        },
        headerShown: false,
        tabBarButton: HapticTab as unknown as (props: BottomTabBarButtonProps) => React.ReactNode,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="music.note.list" color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
