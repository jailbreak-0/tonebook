import { MaterialIcons } from "@expo/vector-icons";
import {
    Stack,
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useThemePreference } from "@/hooks/theme-preference";
import { deleteTonePreset, getTonePresetById } from "@/lib/tone-store";
import { Pedal, TonePreset } from "@/types/tone";

const AMP_BLOCK_ID = "__amp__";
const CAB_BLOCK_ID = "__cab__";

type ChainBlock =
  | { id: string; kind: "pedal"; pedal: Pedal }
  | { id: typeof AMP_BLOCK_ID; kind: "amp" }
  | { id: typeof CAB_BLOCK_ID; kind: "cab" };

function compactPedalType(type: Pedal["type"]): string {
  if (type === "Overdrive / Distortion") {
    return "Dist";
  }
  if (type === "Modulation") {
    return "Mod";
  }
  if (type === "Compression") {
    return "Comp";
  }
  return type;
}

function pedalIconName(
  type: Pedal["type"],
): React.ComponentProps<typeof MaterialIcons>["name"] {
  if (type === "Overdrive / Distortion") {
    return "multiline-chart";
  }
  if (type === "Delay") {
    return "timelapse";
  }
  if (type === "Reverb") {
    return "surround-sound";
  }
  if (type === "Modulation") {
    return "waves";
  }
  if (type === "Compression") {
    return "compress";
  }
  return "equalizer";
}

function pedalIconColor(type: Pedal["type"]): string {
  if (type === "Overdrive / Distortion") {
    return "#ff8a00";
  }
  if (type === "Modulation") {
    return "#9b59b6";
  }
  if (type === "Reverb") {
    return "#66ccff";
  }
  if (type === "EQ") {
    return "#9acd32";
  }
  if (type === "Delay") {
    return "#2ecc71";
  }
  return "#ffd84d";
}

function chainBlockLabel(item: ChainBlock): string {
  if (item.kind === "pedal") {
    return compactPedalType(item.pedal.type);
  }
  if (item.kind === "amp") {
    return "AMP";
  }
  return "CAB";
}

function chainBlockIconName(
  item: ChainBlock,
): React.ComponentProps<typeof MaterialIcons>["name"] {
  if (item.kind === "pedal") {
    return pedalIconName(item.pedal.type);
  }
  if (item.kind === "amp") {
    return "speaker";
  }
  return "graphic-eq";
}

function chainBlockIconColor(item: ChainBlock): string {
  if (item.kind === "pedal") {
    return pedalIconColor(item.pedal.type);
  }
  if (item.kind === "amp") {
    return "#ff6fb2";
  }
  return "#00d9ff";
}

export default function ToneDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tone, setTone] = useState<TonePreset | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { resolvedScheme } = useThemePreference();
  const isDark = resolvedScheme === "dark";
  const themed = {
    bg: isDark ? "#0e0e0e" : "#f2f3f5",
    card: isDark ? "#1a1919" : "#ffffff",
    cardInner: isDark ? "#131313" : "#f8f9fb",
    border: isDark ? "#2c2c2c" : "#d7d9df",
    title: isDark ? "#ffffff" : "#131313",
    text: isDark ? "#adaaaa" : "#555555",
    muted: isDark ? "#767575" : "#757575",
    inputBg: isDark ? "#0a0a07" : "#ffffff",
    accent: isDark ? "#ffdd7c" : "#9a7000",
  };

  const loadTone = useCallback(async () => {
    if (!id) {
      return;
    }

    const found = await getTonePresetById(id);
    setTone(found);
    if (found) {
      const first = found.pedals
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)[0];
      setSelectedBlockId(first?.id ?? AMP_BLOCK_ID);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadTone();
    }, [loadTone]),
  );

  const chainBlocks = useMemo<ChainBlock[]>(() => {
    if (!tone) {
      return [];
    }
    const ordered = tone.pedals
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return [
      ...ordered.map((pedal) => ({
        id: pedal.id,
        kind: "pedal" as const,
        pedal,
      })),
      { id: AMP_BLOCK_ID, kind: "amp" as const },
      { id: CAB_BLOCK_ID, kind: "cab" as const },
    ];
  }, [tone]);

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) {
      return null;
    }
    return chainBlocks.find((item) => item.id === selectedBlockId) ?? null;
  }, [chainBlocks, selectedBlockId]);

  const onDelete = async () => {
    if (!tone) {
      return;
    }

    Alert.alert("Delete tone?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTonePreset(tone.id);
          router.replace("/");
        },
      },
    ]);
  };

  if (!tone) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: themed.bg }]}>
        <Stack.Screen options={{ title: "Tone Detail" }} />
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: themed.title }]}>
            Tone not found
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.primaryButtonText}>Back to Library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  type GridItem =
    | { kind: "in"; id: "__in__" }
    | { kind: "out"; id: "__out__" }
    | { kind: "block"; id: string; block: ChainBlock };

  const gridItems: GridItem[] = [
    { kind: "in", id: "__in__" },
    ...chainBlocks.map((block) => ({
      kind: "block" as const,
      id: block.id,
      block,
    })),
    { kind: "out", id: "__out__" },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themed.bg }]}>
      <Stack.Screen
        options={{
          title: "Tone Detail",
          headerRight: () => (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setMenuOpen(true)}
              accessibilityLabel="More actions"
            >
              <MaterialIcons name="more-vert" size={20} color={themed.accent} />
            </TouchableOpacity>
          ),
        }}
      />

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={[
              styles.menuCard,
              { top: insets.top + 52 },
              { backgroundColor: themed.card, borderColor: themed.border },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push(`/tone/${tone.id}/edit`);
              }}
            >
              <Text style={[styles.menuText, { color: themed.title }]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              <Text style={[styles.menuText, styles.menuDelete]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.name, { color: themed.title }]}>{tone.name}</Text>
        {tone.description ? (
          <Text style={[styles.description, { color: themed.text }]}>
            {tone.description}
          </Text>
        ) : null}

        <Text style={[styles.sectionTitle, { color: themed.accent }]}>
          Signal Chain
        </Text>
        <View
          style={[
            styles.signalFlowWrap,
            { borderColor: themed.border, backgroundColor: themed.bg },
          ]}
        >
          <View style={styles.signalBlockList}>
            {gridItems.map((item, index) => {
              if (item.kind === "in" || item.kind === "out") {
                return (
                  <View key={item.id} style={styles.chainItemWrap}>
                    <View
                      style={[
                        styles.signalIconBlock,
                        styles.signalEndpointBlock,
                        { backgroundColor: themed.inputBg },
                      ]}
                    >
                      <MaterialIcons
                        name={item.kind === "in" ? "input" : "logout"}
                        size={17}
                        color="#adadad"
                      />
                      <Text style={styles.signalEndpointText}>
                        {item.kind.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              }

              const active = selectedBlockId === item.block.id;
              return (
                <View key={`${item.id}-${index}`} style={styles.chainItemWrap}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setSelectedBlockId(item.block.id)}
                    style={[
                      styles.signalIconBlock,
                      { backgroundColor: themed.inputBg },
                      item.block.kind !== "pedal"
                        ? styles.signalCustomBlock
                        : null,
                      active
                        ? [
                            styles.signalIconBlockSelected,
                            { borderColor: themed.accent },
                          ]
                        : null,
                    ]}
                  >
                    <MaterialIcons
                      name={chainBlockIconName(item.block)}
                      size={18}
                      color={chainBlockIconColor(item.block)}
                    />
                    <Text
                      style={[styles.signalIconLabel, { color: themed.accent }]}
                      numberOfLines={1}
                    >
                      {chainBlockLabel(item.block)}
                    </Text>
                    <Text style={styles.signalBlockIndex}>{index}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: themed.accent }]}>
          Saved Settings
        </Text>
        {selectedBlock ? (
          <View style={styles.settingsContent}>
            {selectedBlock.kind === "pedal" ? (
              <>
                <Text style={[styles.settingsName, { color: themed.title }]}>
                  {selectedBlock.pedal.name || selectedBlock.pedal.type}
                </Text>
                <Text style={[styles.settingsType, { color: themed.text }]}>
                  {selectedBlock.pedal.type}
                </Text>
                {selectedBlock.pedal.type === "EQ" &&
                selectedBlock.pedal.eqType ? (
                  <Text style={[styles.settingsMeta, { color: themed.text }]}>
                    EQ Type: {selectedBlock.pedal.eqType}
                  </Text>
                ) : null}
                {selectedBlock.pedal.type === "Modulation" &&
                selectedBlock.pedal.modulationType ? (
                  <Text style={[styles.settingsMeta, { color: themed.text }]}>
                    Mod Type: {selectedBlock.pedal.modulationType}
                  </Text>
                ) : null}
                {Object.entries(selectedBlock.pedal.parameters).map(
                  ([key, value]) => (
                    <View
                      key={`${selectedBlock.pedal.id}-${key}`}
                      style={styles.paramRow}
                    >
                      <Text style={[styles.paramKey, { color: themed.text }]}>
                        {key}
                      </Text>
                      <Text
                        style={[styles.paramValue, { color: themed.title }]}
                      >
                        {value}
                      </Text>
                    </View>
                  ),
                )}
              </>
            ) : selectedBlock.kind === "amp" ? (
              <>
                <Text style={[styles.settingsName, { color: themed.title }]}>
                  AMP
                </Text>
                <Text style={[styles.settingsMeta, { color: themed.text }]}>
                  Name: {tone.ampSettings.name || "Default Amp"}
                </Text>
                {Object.entries(tone.ampSettings)
                  .filter(([key]) => key !== "name")
                  .map(([key, value]) => (
                    <View key={`amp-${key}`} style={styles.paramRow}>
                      <Text style={[styles.paramKey, { color: themed.text }]}>
                        {key}
                      </Text>
                      <Text
                        style={[styles.paramValue, { color: themed.title }]}
                      >
                        {value}
                      </Text>
                    </View>
                  ))}
              </>
            ) : (
              <>
                <Text style={[styles.settingsName, { color: themed.title }]}>
                  CAB
                </Text>
                <Text style={[styles.settingsMeta, { color: themed.text }]}>
                  Name: {tone.cabSettings.name || "Default Cab"}
                </Text>
                {Object.entries(tone.cabSettings)
                  .filter(([key]) => key !== "name")
                  .map(([key, value]) => (
                    <View key={`cab-${key}`} style={styles.paramRow}>
                      <Text style={[styles.paramKey, { color: themed.text }]}>
                        {key}
                      </Text>
                      <Text
                        style={[styles.paramValue, { color: themed.title }]}
                      >
                        {key === "lowCut"
                          ? `${value} Hz`
                          : key === "highCut"
                            ? `${value} kHz`
                            : value}
                      </Text>
                    </View>
                  ))}
              </>
            )}
          </View>
        ) : (
          <Text style={[styles.muted, { color: themed.muted }]}>
            Tap a block to view settings.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 8,
  },
  name: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  description: {
    fontSize: 14,
  },
  sectionTitle: {
    color: "#ffdd7c",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 2,
  },
  signalFlowWrap: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  signalBlockList: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },
  chainItemWrap: {
    width: "20%",
    paddingHorizontal: 4,
  },
  signalIconBlock: {
    width: "100%",
    height: 62,
    borderWidth: 1,
    borderColor: "#2c2614",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
    paddingTop: 4,
    paddingBottom: 6,
  },
  signalEndpointBlock: {
    borderColor: "#5b5b5b",
  },
  signalEndpointText: {
    color: "#adadad",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  signalCustomBlock: {
    borderColor: "#34424a",
    backgroundColor: "#12181b",
  },
  signalIconBlockSelected: {
    borderColor: "#ffdd7c",
    backgroundColor: "#262114",
  },
  signalIconLabel: {
    color: "#ffdd7c",
    fontSize: 9,
    fontWeight: "700",
    width: "90%",
    textAlign: "center",
  },
  signalBlockIndex: {
    color: "#413200",
    backgroundColor: "#ffdd7c",
    borderRadius: 999,
    minWidth: 16,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "800",
    paddingVertical: 1,
    overflow: "hidden",
    position: "absolute",
    top: 3,
    right: 3,
  },
  settingsContent: {
    paddingTop: 4,
    gap: 6,
  },
  settingsName: {
    fontSize: 16,
    fontWeight: "800",
  },
  settingsType: {
    fontSize: 12,
    fontWeight: "700",
  },
  settingsMeta: {
    fontSize: 12,
  },
  paramRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#2c2c2c",
    paddingTop: 6,
  },
  paramKey: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  paramValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  muted: {
    fontStyle: "italic",
  },
  moreButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2c2c2c",
    backgroundColor: "#131313",
    borderRadius: 999,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    position: "relative",
  },
  menuCard: {
    position: "absolute",
    right: 14,
    width: 170,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#2c2c2c",
  },
  menuText: {
    fontSize: 12,
    fontWeight: "700",
  },
  menuDelete: {
    color: "#ff7351",
  },
  primaryButton: {
    backgroundColor: "#ffdd7c",
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#413200",
    fontWeight: "800",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
});
