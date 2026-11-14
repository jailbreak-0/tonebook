import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemePreference, useThemePreference } from "@/hooks/theme-preference";

export default function SettingsScreen() {
  const { preference, resolvedScheme, setPreference } = useThemePreference();

  const isDark = resolvedScheme === "dark";
  const themed = {
    bg: isDark ? "#0e0e0e" : "#f7f8fb",
    card: isDark ? "#131313" : "#ffffff",
    border: isDark ? "#2c2c2c" : "#c4ccd8",
    title: isDark ? "#ffffff" : "#131313",
    text: isDark ? "#adaaaa" : "#2f3945",
    accent: isDark ? "#ffdd7c" : "#9a7000",
    activeOptionBg: isDark ? "#262114" : "#f5ecd2",
  };

  const options: { label: string; value: ThemePreference }[] = [
    { label: "Device", value: "device" },
    { label: "Dark", value: "dark" },
    { label: "Light", value: "light" },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themed.bg }]}>
      <View style={[styles.root, { backgroundColor: themed.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themed.title }]}>Settings</Text>
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: themed.card, borderColor: themed.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: themed.title }]}>
            Theme
          </Text>
          {options.map((option) => {
            const active = preference === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.option,
                  { borderColor: themed.border },
                  active
                    ? [
                        styles.optionActive,
                        {
                          borderColor: themed.accent,
                          backgroundColor: themed.activeOptionBg,
                        },
                      ]
                    : null,
                ]}
                onPress={() => setPreference(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: active ? themed.accent : themed.text },
                  ]}
                >
                  {option.label}
                </Text>
                {active ? (
                  <MaterialIcons name="check" size={17} color={themed.accent} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  root: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  option: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionActive: {
    borderColor: "#ffdd7c",
    backgroundColor: "#262114",
  },
  optionText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
