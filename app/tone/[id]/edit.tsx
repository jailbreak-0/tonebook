import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ToneEditorScreen from "@/components/tone-editor-screen";
import { useThemePreference } from "@/hooks/theme-preference";
import { getTonePresetById } from "@/lib/tone-store";
import { TonePreset } from "@/types/tone";

export default function EditToneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tone, setTone] = useState<TonePreset | null | undefined>(undefined);
  const { resolvedScheme } = useThemePreference();
  const isDark = resolvedScheme === "dark";
  const accent = isDark ? "#ffdd7c" : "#9a7000";

  const loadTone = useCallback(async () => {
    if (!id) {
      setTone(null);
      return;
    }
    const found = await getTonePresetById(id);
    setTone(found ?? null);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadTone();
    }, [loadTone]),
  );

  if (tone === undefined) {
    return (
      <SafeAreaView
        style={[
          styles.center,
          { backgroundColor: isDark ? "#0e0e0e" : "#f2f3f5" },
        ]}
      >
        <ActivityIndicator size="large" color={accent} />
      </SafeAreaView>
    );
  }

  if (tone === null) {
    return (
      <SafeAreaView
        style={[
          styles.center,
          { backgroundColor: isDark ? "#0e0e0e" : "#f2f3f5" },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? "#ffffff" : "#131313" }]}>
          Tone not found
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonText}>Back to Library</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return <ToneEditorScreen initialTone={tone} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  button: {
    backgroundColor: "#ffdd7c",
    borderRadius: 10,
    minHeight: 44,
    minWidth: 170,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#413200",
    fontWeight: "800",
  },
});
