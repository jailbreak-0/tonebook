import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemePreference } from "@/hooks/theme-preference";
import { buildSampleTones } from "@/lib/sample-tones";
import { getTonePresets, seedTonePresetsIfEmpty } from "@/lib/tone-store";
import { SortMode, TonePreset } from "@/types/tone";

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const { resolvedScheme } = useThemePreference();
  const [tones, setTones] = useState<TonePreset[]>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const listRef = React.useRef<ScrollView>(null);

  const isDark = resolvedScheme === "dark";
  const themed = {
    safeArea: isDark ? "#0e0e0e" : "#f7f8fb",
    textPrimary: isDark ? "#ffffff" : "#131313",
    textSecondary: isDark ? "#adaaaa" : "#2f3945",
    textMuted: isDark ? "#767575" : "#4e5a67",
    accent: isDark ? "#ffdd7c" : "#9a7000",
    cardBg: isDark ? "#131313" : "#ffffff",
    cardBorder: isDark ? "#262626" : "#c4ccd8",
    searchBg: isDark ? "#131313" : "#ffffff",
  };

  const loadTones = useCallback(async () => {
    await seedTonePresetsIfEmpty(buildSampleTones());
    const all = await getTonePresets();
    setTones(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTones();
    }, [loadTones]),
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tones.forEach((tone) =>
      tone.tags.forEach((tag) => tags.add(normalizeTag(tag))),
    );
    return ["all", ...Array.from(tags).sort()];
  }, [tones]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const base = tones.filter((tone) => {
      const matchesTag =
        activeTag === "all" ||
        tone.tags.some((tag) => normalizeTag(tag) === activeTag);

      const haystack = [tone.name, tone.description ?? "", tone.tags.join(" ")]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesTag && matchesSearch;
    });

    if (sortMode === "name") {
      return [...base].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...base].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [activeTag, search, sortMode, tones]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTag, search, sortMode]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themed.safeArea }]}
    >
      <View style={[styles.root, { backgroundColor: themed.safeArea }]}>
        <View style={styles.header}>
          <Text style={[styles.brand, { color: themed.accent }]}>TONEBOOK</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/settings")}
            accessibilityLabel="Open settings"
          >
            <MaterialIcons name="settings" size={18} color={themed.accent} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: themed.searchBg,
              borderColor: themed.cardBorder,
            },
          ]}
        >
          <MaterialIcons name="search" size={18} color={themed.textMuted} />
          <TextInput
            placeholder="Search tones, tags, artists"
            placeholderTextColor={themed.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: themed.textPrimary }]}
          />
        </View>

        <View style={styles.sortRow}>
          <Text style={[styles.metaLabel, { color: themed.textSecondary }]}>
            {filtered.length} tones
          </Text>
          <View style={styles.sortDropdownWrap}>
            <TouchableOpacity
              style={[styles.sortButton, styles.sortDropdownButton]}
              onPress={() => setIsSortMenuOpen((prev) => !prev)}
            >
              <Text
                style={[
                  styles.sortText,
                  styles.sortTextActive,
                  { color: themed.accent },
                ]}
              >
                {sortMode === "recent" ? "Recent" : "Name"}
              </Text>
              <MaterialIcons
                name={isSortMenuOpen ? "arrow-drop-up" : "arrow-drop-down"}
                size={18}
                color={themed.accent}
              />
            </TouchableOpacity>

            {isSortMenuOpen ? (
              <View style={styles.sortDropdownMenu}>
                <TouchableOpacity
                  style={[
                    styles.sortDropdownItem,
                    sortMode === "recent"
                      ? styles.sortDropdownItemActive
                      : null,
                  ]}
                  onPress={() => {
                    setSortMode("recent");
                    setIsSortMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortText,
                      sortMode === "recent" ? styles.sortTextActive : null,
                      sortMode === "recent" ? { color: themed.accent } : null,
                    ]}
                  >
                    Recent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortDropdownItem,
                    sortMode === "name" ? styles.sortDropdownItemActive : null,
                  ]}
                  onPress={() => {
                    setSortMode("name");
                    setIsSortMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortText,
                      sortMode === "name" ? styles.sortTextActive : null,
                      sortMode === "name" ? { color: themed.accent } : null,
                    ]}
                  >
                    Name
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        <ScrollView
          horizontal
          style={styles.filterScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {allTags.map((tag) => {
            const active = activeTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.filterButton,
                  active ? styles.filterButtonActive : null,
                ]}
                onPress={() => setActiveTag(tag)}
              >
                <Text
                  style={[
                    styles.sortText,
                    active ? styles.filterTextActive : null,
                    active ? { color: themed.accent } : null,
                  ]}
                  numberOfLines={1}
                >
                  {tag === "all" ? "ALL" : tag.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          ref={listRef}
          style={{ flex: 1, marginTop: 16 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No tones found</Text>
              <Text style={styles.emptyText}>
                Try another search or create a new tone.
              </Text>
              <TouchableOpacity
                style={styles.newToneButton}
                onPress={() => router.push("/tone/new")}
              >
                <Text style={styles.newToneButtonText}>+ New Tone</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                style={[
                  styles.toneCard,
                  {
                    backgroundColor: themed.cardBg,
                    borderColor: themed.cardBorder,
                  },
                ]}
                onPress={() => router.push(`/tone/${tone.id}`)}
              >
                <View style={styles.toneRow}>
                  <Text
                    style={[styles.toneName, { color: themed.textPrimary }]}
                  >
                    {tone.name}
                  </Text>
                  <Text style={[styles.updatedAt, { color: themed.textMuted }]}>
                    {new Date(tone.updatedAt).toLocaleDateString()}
                  </Text>
                </View>

                <Text
                  style={[styles.description, { color: themed.textSecondary }]}
                  numberOfLines={2}
                >
                  {tone.description || "No description"}
                </Text>

                <View style={styles.badgesRow}>
                  {tone.tags.length ? (
                    tone.tags.slice(0, 4).map((tag) => (
                      <Text
                        key={`${tone.id}-${tag}`}
                        style={[styles.badge, { color: themed.accent }]}
                      >
                        {tag.toUpperCase()}
                      </Text>
                    ))
                  ) : (
                    <Text style={[styles.muted, { color: themed.textMuted }]}>
                      No tags
                    </Text>
                  )}
                </View>

                <Text style={[styles.signalMeta, { color: themed.textMuted }]}>
                  Signal chain: IN {"->"} {tone.pedals.length} pedal(s) {"->"}{" "}
                  AMP {"->"} CAB {"->"} OUT
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/tone/new")}
        >
          <MaterialIcons name="add" size={32} color="#413200" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },
  root: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2c2c2c",
    borderRadius: 18,
    backgroundColor: "#131313",
  },
  brand: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },
  searchWrap: {
    marginHorizontal: 16,
    backgroundColor: "#131313",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#262626",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    paddingVertical: 10,
  },
  sortRow: {
    marginTop: 10,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  metaLabel: {
    color: "#adaaaa",
    fontSize: 12,
  },
  sortButton: {
    borderWidth: 1,
    borderColor: "#2c2c2c",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortButtonActive: {
    backgroundColor: "#262626",
    borderColor: "#ffdd7c",
  },
  sortText: {
    color: "#adaaaa",
    fontSize: 11,
    fontWeight: "700",
  },
  sortTextActive: {
    color: "#ffdd7c",
  },
  sortDropdownWrap: {
    position: "relative",
  },
  sortDropdownButton: {
    minWidth: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sortDropdownMenu: {
    position: "absolute",
    top: 36,
    right: 0,
    minWidth: 110,
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#2c2c2c",
    borderRadius: 8,
    overflow: "hidden",
  },
  sortDropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sortDropdownItemActive: {
    backgroundColor: "#262626",
  },
  filterScroll: {
    maxHeight: 44,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: "center",
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#2c2c2c",
    borderRadius: 999,
    height: 30,
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: "center",
    backgroundColor: "#131313",
  },
  filterButtonActive: {
    backgroundColor: "#262626",
  },
  filterTextActive: {
    color: "#ffdd7c",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 150,
    gap: 10,
  },
  toneCard: {
    backgroundColor: "#131313",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 12,
    gap: 8,
  },
  toneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  toneName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  updatedAt: {
    color: "#767575",
    fontSize: 11,
  },
  description: {
    color: "#adaaaa",
    fontSize: 13,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    color: "#ffdd7c",
    borderColor: "#3a310b",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
  },
  muted: {
    color: "#767575",
    fontSize: 12,
  },
  signalMeta: {
    color: "#767575",
    fontSize: 11,
  },
  emptyCard: {
    marginTop: 18,
    backgroundColor: "#131313",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 16,
    gap: 8,
    alignItems: "flex-start",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  emptyText: {
    color: "#adaaaa",
  },
  newToneButton: {
    marginTop: 6,
    backgroundColor: "#ffdd7c",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newToneButtonText: {
    color: "#413200",
    fontWeight: "800",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ffdd7c",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});
