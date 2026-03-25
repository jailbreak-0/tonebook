import { MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemePreference } from "@/hooks/theme-preference";
import { upsertTonePreset } from "@/lib/tone-store";
import {
  createEmptyTone,
  createPedal,
  defaultAmpSettings,
  defaultCabSettings,
  EQType,
  eqTypeOptions,
  getEQParameterLabels,
  getEQParametersByType,
  ModulationType,
  modulationTypeOptions,
  Pedal,
  pedalTypeOptions,
  TonePreset,
} from "@/types/tone";

type Props = {
  initialTone?: TonePreset;
};

const AMP_BLOCK_ID = "__amp__";
const CAB_BLOCK_ID = "__cab__";

type ChainBlock =
  | { id: string; kind: "pedal"; pedal: Pedal }
  | { id: typeof AMP_BLOCK_ID; kind: "amp" }
  | { id: typeof CAB_BLOCK_ID; kind: "cab" };

function NumericField({
  value,
  onChange,
  max = 10,
  min = 0,
  step = 1,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  min?: number;
  step?: number;
}) {
  return (
    <TextInput
      value={String(value)}
      onChangeText={(text) => {
        const parsed = Number(text);
        if (!Number.isNaN(parsed)) {
          onChange(
            Math.max(min, Math.min(max, Math.round(parsed / step) * step)),
          );
        }
      }}
      keyboardType="number-pad"
      style={styles.numericInput}
      maxLength={3}
    />
  );
}

function Dropdown({
  label,
  value,
  options,
  onChange,
  accentColor = "#ffdd7c",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
  accentColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.paramLabel}>{label.toUpperCase()}</Text>
      <Pressable
        style={styles.dropdownButton}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.dropdownButtonText}>{value}</Text>
        <MaterialIcons
          name={expanded ? "expand-less" : "expand-more"}
          size={18}
          color={accentColor}
        />
      </Pressable>
      {expanded && (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.dropdownOption,
                value === option && styles.dropdownOptionSelected,
              ]}
              onPress={() => {
                onChange(option);
                setExpanded(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownOptionText,
                  value === option && styles.dropdownOptionTextSelected,
                  value === option ? { color: accentColor } : null,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function ParameterControl({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  unit = "",
  displayUnit = "",
  accentColor = "#ffdd7c",
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  displayUnit?: string;
  accentColor?: string;
}) {
  return (
    <View style={styles.paramRow}>
      <View style={styles.paramLabelRow}>
        <Text style={styles.paramLabel}>{label.toUpperCase()}</Text>
        {displayUnit && (
          <Text style={[styles.paramUnit, { color: accentColor }]}>
            {value}
            {displayUnit}
          </Text>
        )}
      </View>
      <View style={styles.paramControlRow}>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          minimumTrackTintColor={accentColor}
          maximumTrackTintColor="#2c2c2c"
          thumbTintColor={accentColor}
          value={value}
          onValueChange={onChange}
        />
        <View style={styles.numericInputWrap}>
          <NumericField
            value={value}
            onChange={onChange}
            max={max}
            min={min}
            step={step}
          />
          {unit && <Text style={styles.paramUnitLabel}>{unit}</Text>}
        </View>
      </View>
    </View>
  );
}

function compactPedalType(type: Pedal["type"]): string {
  if (type === "Overdrive / Distortion") {
    return "Dist";
  }
  if (type === "Modulation") {
    return "Mod";
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
    return "#005eff";
  }
  if (type === "EQ") {
    return "#9acd32";
  }
  if (type === "Delay") {
    return "#50e52a";
  }
  return "#ffd84d";
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

function chainBlockLabel(item: ChainBlock): string {
  if (item.kind === "pedal") {
    return compactPedalType(item.pedal.type);
  }
  if (item.kind === "amp") {
    return "AMP";
  }
  return "CAB";
}

function SignalChainFlow({
  blocks,
  selectedBlockId,
  onSelect,
  onReorder,
  accentColor = "#ffdd7c",
}: {
  blocks: ChainBlock[];
  selectedBlockId?: string;
  onSelect: (block: ChainBlock) => void;
  onReorder: (next: ChainBlock[]) => void;
  accentColor?: string;
}) {
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);
  const swapPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (swapSourceId) {
      swapPulse.setValue(0);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(swapPulse, {
            toValue: 1,
            duration: 520,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(swapPulse, {
            toValue: 0,
            duration: 520,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      swapPulse.stopAnimation();
      swapPulse.setValue(0);
    }

    return () => {
      animation?.stop();
    };
  }, [swapPulse, swapSourceId]);

  type GridItem =
    | { kind: "in"; id: "__in__" }
    | { kind: "out"; id: "__out__" }
    | { kind: "block"; id: string; block: ChainBlock };

  const swapBlocks = (sourceId: string, targetId: string) => {
    const sourceIndex = blocks.findIndex((block) => block.id === sourceId);
    const targetIndex = blocks.findIndex((block) => block.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return;
    }

    const next = [...blocks];
    [next[sourceIndex], next[targetIndex]] = [
      next[targetIndex],
      next[sourceIndex],
    ];
    onReorder(next);
  };

  const gridItems: GridItem[] = [
    { kind: "in", id: "__in__" },
    ...blocks.map((block) => ({ kind: "block" as const, id: block.id, block })),
    { kind: "out", id: "__out__" },
  ];

  const renderGridItem = (item: GridItem, index: number) => {
    if (item.kind === "in" || item.kind === "out") {
      return (
        <View key={item.id} style={styles.chainItemWrap}>
          <View style={[styles.signalIconBlock, styles.signalEndpointBlock]}>
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

    const selected = selectedBlockId === item.block.id;
    const isSwapSource = swapSourceId === item.block.id;
    const isSwapTarget =
      swapSourceId !== null && swapSourceId !== item.block.id;
    const isSwapInactive = swapSourceId !== null && !isSwapSource;

    const pulseScale = swapPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.07],
    });
    const pulseOpacity = swapPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 0.85],
    });

    return (
      <View key={`${item.id}-${index}`} style={styles.chainItemWrap}>
        <Animated.View
          style={isSwapSource ? { transform: [{ scale: pulseScale }] } : null}
        >
          <Pressable
            onPress={() => {
              if (swapSourceId && swapSourceId !== item.block.id) {
                swapBlocks(swapSourceId, item.block.id);
                setSwapSourceId(null);
                return;
              }

              if (swapSourceId === item.block.id) {
                setSwapSourceId(null);
                return;
              }

              onSelect(item.block);
            }}
            onLongPress={() => {
              setSwapSourceId(item.block.id);
            }}
            delayLongPress={220}
            style={[
              styles.signalIconBlock,
              item.block.kind !== "pedal" ? styles.signalCustomBlock : null,
              selected
                ? [styles.signalIconBlockSelected, { borderColor: accentColor }]
                : null,
              isSwapSource ? styles.signalIconBlockSwapSource : null,
              isSwapTarget ? styles.signalIconBlockSwapTarget : null,
              isSwapInactive ? styles.signalIconBlockSwapInactive : null,
            ]}
          >
            {isSwapSource ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.signalSwapPulseRing,
                  { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
                ]}
              />
            ) : null}
            <MaterialIcons
              name={chainBlockIconName(item.block)}
              size={18}
              color={chainBlockIconColor(item.block)}
            />
            <Text
              style={[styles.signalIconLabel, { color: accentColor }]}
              numberOfLines={1}
            >
              {chainBlockLabel(item.block)}
            </Text>
            <Text style={styles.signalBlockIndex}>{index}</Text>
            <MaterialIcons
              name={isSwapSource ? "swap-horiz" : "touch-app"}
              size={13}
              color={isSwapSource ? "#ffe066" : "#99844c"}
              style={styles.signalDragHint}
            />
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.signalFlowWrap}>
      <View style={styles.signalBlockList}>
        {gridItems.map((item, index) => renderGridItem(item, index))}
      </View>
      {blocks.length === 0 ? (
        <Text style={styles.emptyText}>
          No pedals yet. Tap a pedal type below to add one.
        </Text>
      ) : null}
    </View>
  );
}

export default function ToneEditorScreen({ initialTone }: Props) {
  const router = useRouter();
  const { resolvedScheme } = useThemePreference();
  const isDark = resolvedScheme === "dark";
  const themed = {
    bg: isDark ? "#0e0e0e" : "#f7f8fb",
    card: isDark ? "#1a1919" : "#ffffff",
    cardInner: isDark ? "#131313" : "#f3f6fa",
    border: isDark ? "#262626" : "#c4ccd8",
    textPrimary: isDark ? "#ffffff" : "#131313",
    textSecondary: isDark ? "#adaaaa" : "#2f3945",
    accent: isDark ? "#ffdd7c" : "#9a7000",
    inputBg: isDark ? "#0e0e0e" : "#ffffff",
    inputBorder: isDark ? "#2c2c2c" : "#bcc6d3",
    placeholder: isDark ? "#767575" : "#5d6875",
  };

  const [tone, setTone] = useState<TonePreset>(
    (() => {
      const base = initialTone ?? createEmptyTone();
      return {
        ...base,
        cabSettings: base.cabSettings ?? { ...defaultCabSettings },
      };
    })(),
  );
  const [saving, setSaving] = useState(false);
  const [showChainTooltip, setShowChainTooltip] = useState(false);
  const chainTooltipOpacity = useRef(new Animated.Value(0)).current;
  const chainTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [tagInput, setTagInput] = useState("");

  // Common suggested tags
  const suggestedTags = [
    "Clean",
    "Crunch",
    "Lead",
    "Blues",
    "Rock",
    "Metal",
    "Jazz",
    "Folk",
    "Pop",
    "Funk",
    "Ambient",
    "Experimental",
    "Bright",
    "Warm",
    "Aggressive",
    "Smooth",
    "Vintage",
    "Modern",
  ];

  const filteredTagSuggestions = useMemo(() => {
    const existingTagsSet = new Set(tone.tags.map((tag) => tag.toLowerCase()));
    const trimmedInput = tagInput.trim().toLowerCase();

    return suggestedTags
      .filter(
        (tag) =>
          !existingTagsSet.has(tag.toLowerCase()) &&
          tag.toLowerCase().startsWith(trimmedInput),
      )
      .slice(0, 5);
  }, [tagInput, tone.tags]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(
    initialTone?.pedals[0]?.id ?? AMP_BLOCK_ID,
  );
  const [chainOrder, setChainOrder] = useState<string[]>(() => [
    ...(initialTone?.pedals.map((pedal) => pedal.id) ?? []),
    AMP_BLOCK_ID,
    CAB_BLOCK_ID,
  ]);

  const pedalTags = useMemo(() => {
    return pedalTypeOptions.map((item) => ({
      label: item,
      compact: item === "Overdrive / Distortion" ? "OD/Dist" : item,
    }));
  }, []);

  const updateTone = (next: Partial<TonePreset>) => {
    setTone((prev) => ({ ...prev, ...next }));
  };

  const addPedal = (type: (typeof pedalTypeOptions)[number]) => {
    setTone((prev) => {
      const nextPedals = [
        ...prev.pedals,
        createPedal(type, prev.pedals.length),
      ].map((pedal, index) => ({ ...pedal, orderIndex: index }));
      return {
        ...prev,
        pedals: nextPedals,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const removePedal = (pedalId: string) => {
    setTone((prev) => {
      const nextPedals = prev.pedals
        .filter((pedal) => pedal.id !== pedalId)
        .map((pedal, index) => ({ ...pedal, orderIndex: index }));
      return {
        ...prev,
        pedals: nextPedals,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updatePedal = (pedalId: string, patch: Partial<Pedal>) => {
    setTone((prev) => ({
      ...prev,
      pedals: prev.pedals.map((pedal) =>
        pedal.id === pedalId ? { ...pedal, ...patch } : pedal,
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const chainBlocks = useMemo<ChainBlock[]>(() => {
    const pedalById = new Map(tone.pedals.map((pedal) => [pedal.id, pedal]));
    return chainOrder
      .map((id) => {
        if (id === AMP_BLOCK_ID) {
          return { id: AMP_BLOCK_ID, kind: "amp" } as const;
        }
        if (id === CAB_BLOCK_ID) {
          return { id: CAB_BLOCK_ID, kind: "cab" } as const;
        }
        const pedal = pedalById.get(id);
        if (!pedal) {
          return null;
        }
        return { id: pedal.id, kind: "pedal", pedal } as const;
      })
      .filter((item): item is ChainBlock => item !== null);
  }, [chainOrder, tone.pedals]);

  useEffect(() => {
    if (!selectedBlockId) {
      setSelectedBlockId(tone.pedals[0]?.id ?? AMP_BLOCK_ID);
      return;
    }

    const validIds = new Set(chainBlocks.map((item) => item.id));
    if (!validIds.has(selectedBlockId)) {
      setSelectedBlockId(tone.pedals[0]?.id ?? AMP_BLOCK_ID);
    }
  }, [chainBlocks, selectedBlockId, tone.pedals]);

  useEffect(() => {
    setChainOrder((prev) => {
      const pedalIds = tone.pedals.map((pedal) => pedal.id);
      const kept = prev.filter(
        (id) =>
          pedalIds.includes(id) || id === AMP_BLOCK_ID || id === CAB_BLOCK_ID,
      );
      const missingPedals = pedalIds.filter((id) => !kept.includes(id));
      const next = [...kept, ...missingPedals];
      if (!next.includes(AMP_BLOCK_ID)) {
        next.push(AMP_BLOCK_ID);
      }
      if (!next.includes(CAB_BLOCK_ID)) {
        next.push(CAB_BLOCK_ID);
      }
      return next;
    });
  }, [tone.pedals]);

  const displayChainTooltip = () => {
    // Clear any existing timeout
    if (chainTooltipTimeoutRef.current) {
      clearTimeout(chainTooltipTimeoutRef.current);
    }

    setShowChainTooltip(true);
    chainTooltipOpacity.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(chainTooltipOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.delay(2400),
      Animated.timing(chainTooltipOpacity, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setShowChainTooltip(false);
      }
    });
  };

  useEffect(() => {
    return () => {
      if (chainTooltipTimeoutRef.current) {
        clearTimeout(chainTooltipTimeoutRef.current);
      }
    };
  }, []);

  const saveTone = async () => {
    if (!tone.name.trim()) {
      Alert.alert("Name required", "Give this tone a name before saving.");
      return;
    }

    setSaving(true);
    try {
      await upsertTonePreset({
        ...tone,
        name: tone.name.trim(),
        tags: tone.tags.map((tag) => tag.trim()).filter(Boolean),
      });
      router.replace("/");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themed.bg }]}>
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: themed.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themed.textPrimary }]}>
            Tone Editor
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: themed.textSecondary }]}
          >
            Build a complete rig with pedals, amp settings, and tags.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: themed.card, borderColor: themed.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: themed.accent }]}>
              Tone Info
            </Text>
            <TextInput
              value={tone.name}
              onChangeText={(name) => updateTone({ name })}
              placeholder="Tone name"
              placeholderTextColor={themed.placeholder}
              style={[
                styles.input,
                {
                  backgroundColor: themed.inputBg,
                  borderColor: themed.inputBorder,
                  color: themed.textPrimary,
                },
              ]}
            />
            <TextInput
              value={tone.description ?? ""}
              onChangeText={(description) => updateTone({ description })}
              placeholder="Description (optional)"
              placeholderTextColor={themed.placeholder}
              style={[
                styles.input,
                styles.inputMultiline,
                {
                  backgroundColor: themed.inputBg,
                  borderColor: themed.inputBorder,
                  color: themed.textPrimary,
                },
              ]}
              multiline
            />
            <View>
              <TextInput
                value={tagInput}
                onChangeText={(text) => setTagInput(text)}
                onSubmitEditing={() => {
                  if (tagInput.trim()) {
                    const newTags = [
                      ...tone.tags,
                      ...tagInput
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => !tone.tags.includes(tag)),
                    ];
                    updateTone({ tags: newTags });
                    setTagInput("");
                  }
                }}
                placeholder="Add tags (genre, artist, use-case)"
                placeholderTextColor={themed.placeholder}
                style={[
                  styles.input,
                  {
                    backgroundColor: themed.inputBg,
                    borderColor: themed.inputBorder,
                    color: themed.textPrimary,
                  },
                ]}
              />
              {filteredTagSuggestions.length > 0 ? (
                <View style={styles.suggestionsWrap}>
                  {filteredTagSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={[
                        styles.suggestionChip,
                        { backgroundColor: `${themed.inputBorder}40` },
                      ]}
                      onPress={() => {
                        const newTags = [...tone.tags, suggestion];
                        updateTone({ tags: newTags });
                        setTagInput("");
                      }}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          { color: themed.textPrimary },
                        ]}
                      >
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {tone.tags.length > 0 ? (
                <View style={styles.tagsDisplay}>
                  {tone.tags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagChip,
                        { backgroundColor: "rgba(255, 221, 124, 0.2)" },
                      ]}
                      onPress={() => {
                        updateTone({
                          tags: tone.tags.filter((t) => t !== tag),
                        });
                      }}
                    >
                      <Text
                        style={[styles.tagChipText, { color: themed.accent }]}
                      >
                        {tag} ×
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: themed.card, borderColor: themed.border },
            ]}
          >
            <View style={styles.chainHeaderRow}>
              <Text style={[styles.sectionTitle, { color: themed.accent }]}>
                Pedal Chain
              </Text>
              <TouchableOpacity
                style={styles.chainInfoButton}
                onPress={displayChainTooltip}
                accessibilityLabel="Show pedal chain tips"
              >
                <MaterialIcons name="info" size={18} color={themed.accent} />
              </TouchableOpacity>
            </View>
            {showChainTooltip ? (
              <Animated.View
                style={[styles.chainTooltip, { opacity: chainTooltipOpacity }]}
              >
                <Text
                  style={[styles.chainTooltipText, { color: themed.accent }]}
                >
                  Tap a block to edit it. Long press a block, then tap another
                  block to swap positions.
                </Text>
              </Animated.View>
            ) : null}

            <SignalChainFlow
              blocks={chainBlocks}
              selectedBlockId={selectedBlockId}
              accentColor={themed.accent}
              onSelect={(block) => {
                setSelectedBlockId(block.id);
              }}
              onReorder={(data) => {
                setChainOrder(data.map((item) => item.id));
                const orderedPedals = data
                  .filter(
                    (item): item is Extract<ChainBlock, { kind: "pedal" }> =>
                      item.kind === "pedal",
                  )
                  .map((item) => item.pedal);
                updateTone({
                  pedals: orderedPedals.map((pedal, index) => ({
                    ...pedal,
                    orderIndex: index,
                  })),
                });
              }}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeRow}
            >
              {pedalTags.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.typeChip}
                  onPress={() => addPedal(item.label)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.typeChipText, { color: themed.accent }]}>
                    {item.compact}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedBlockId ? (
              <View
                style={[
                  styles.settingsCard,
                  {
                    backgroundColor: themed.cardInner,
                    borderColor: themed.border,
                  },
                ]}
              >
                {(() => {
                  const selectedBlock = chainBlocks.find(
                    (block) => block.id === selectedBlockId,
                  );
                  if (!selectedBlock) {
                    return null;
                  }

                  if (selectedBlock.kind === "pedal") {
                    const selectedPedal = selectedBlock.pedal;
                    return (
                      <>
                        <View style={styles.settingsHeader}>
                          <View style={styles.settingsTitleWrap}>
                            <MaterialIcons
                              name={pedalIconName(selectedPedal.type)}
                              size={18}
                              color={pedalIconColor(selectedPedal.type)}
                            />
                            <Text
                              style={[
                                styles.settingsTitle,
                                { color: themed.accent },
                              ]}
                            >
                              {selectedPedal.type}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => removePedal(selectedPedal.id)}
                          >
                            <Text style={styles.removeButton}>Remove</Text>
                          </TouchableOpacity>
                        </View>

                        {selectedPedal.type === "EQ" ? (
                          <>
                            <Dropdown
                              label="EQ Type"
                              value={selectedPedal.eqType ?? "3 band"}
                              options={eqTypeOptions}
                              accentColor={themed.accent}
                              onChange={(eqType) => {
                                const newParams = getEQParametersByType(
                                  eqType as EQType,
                                );
                                updatePedal(selectedPedal.id, {
                                  eqType: eqType as EQType,
                                  parameters: newParams,
                                });
                              }}
                            />
                          </>
                        ) : selectedPedal.type === "Modulation" ? (
                          <>
                            <Dropdown
                              label="Modulation Type"
                              value={selectedPedal.modulationType ?? "Chorus"}
                              options={modulationTypeOptions}
                              accentColor={themed.accent}
                              onChange={(modulationType) => {
                                updatePedal(selectedPedal.id, {
                                  modulationType:
                                    modulationType as ModulationType,
                                });
                              }}
                            />
                            <TextInput
                              value={selectedPedal.name ?? ""}
                              onChangeText={(name) =>
                                updatePedal(selectedPedal.id, { name })
                              }
                              placeholder="Custom name (optional)"
                              placeholderTextColor={themed.placeholder}
                              style={[
                                styles.pedalNameInput,
                                {
                                  backgroundColor: themed.inputBg,
                                  borderColor: themed.inputBorder,
                                  color: themed.textPrimary,
                                },
                              ]}
                            />
                          </>
                        ) : (
                          <>
                            <TextInput
                              value={selectedPedal.name ?? ""}
                              onChangeText={(name) =>
                                updatePedal(selectedPedal.id, { name })
                              }
                              placeholder="Custom pedal name"
                              placeholderTextColor={themed.placeholder}
                              style={[
                                styles.pedalNameInput,
                                {
                                  backgroundColor: themed.inputBg,
                                  borderColor: themed.inputBorder,
                                  color: themed.textPrimary,
                                },
                              ]}
                            />
                          </>
                        )}

                        {selectedPedal.type === "EQ" ? (
                          getEQParameterLabels(
                            selectedPedal.eqType ?? "3 band",
                          ).map((label, index) => {
                            const paramKeys = Object.keys(
                              selectedPedal.parameters,
                            );
                            const paramKey = paramKeys[index];
                            const value = selectedPedal.parameters[paramKey];
                            return (
                              <ParameterControl
                                key={`${selectedPedal.id}-${paramKey}`}
                                label={label}
                                value={value}
                                onChange={(next) =>
                                  updatePedal(selectedPedal.id, {
                                    parameters: {
                                      ...selectedPedal.parameters,
                                      [paramKey]: next,
                                    },
                                  })
                                }
                                min={-12}
                                max={12}
                                step={1}
                                displayUnit=" dB"
                                accentColor={themed.accent}
                              />
                            );
                          })
                        ) : (
                          <>
                            {Object.entries(selectedPedal.parameters).map(
                              ([param, value]) => (
                                <ParameterControl
                                  key={`${selectedPedal.id}-${param}`}
                                  label={param}
                                  value={value}
                                  onChange={(next) =>
                                    updatePedal(selectedPedal.id, {
                                      parameters: {
                                        ...selectedPedal.parameters,
                                        [param]: next,
                                      },
                                    })
                                  }
                                  accentColor={themed.accent}
                                />
                              ),
                            )}
                          </>
                        )}
                      </>
                    );
                  }

                  if (selectedBlock.kind === "amp") {
                    return (
                      <>
                        <View style={styles.settingsHeader}>
                          <View style={styles.settingsTitleWrap}>
                            <MaterialIcons
                              name="speaker"
                              size={18}
                              color="#ff6fb2"
                            />
                            <Text
                              style={[
                                styles.settingsTitle,
                                { color: themed.accent },
                              ]}
                            >
                              AMP
                            </Text>
                          </View>
                        </View>

                        <TextInput
                          value={tone.ampSettings.name ?? ""}
                          onChangeText={(name) =>
                            updateTone({
                              ampSettings: {
                                ...tone.ampSettings,
                                name,
                              },
                            })
                          }
                          placeholder="Set AMP name"
                          placeholderTextColor={themed.placeholder}
                          style={[
                            styles.pedalNameInput,
                            {
                              backgroundColor: themed.inputBg,
                              borderColor: themed.inputBorder,
                              color: themed.textPrimary,
                            },
                          ]}
                        />

                        {(
                          Object.keys(
                            defaultAmpSettings,
                          ) as (keyof typeof defaultAmpSettings)[]
                        )
                          .filter((key) => key !== "name")
                          .map((key) => (
                            <ParameterControl
                              key={`amp-${key}`}
                              label={key}
                              value={tone.ampSettings[key]}
                              onChange={(next) =>
                                updateTone({
                                  ampSettings: {
                                    ...tone.ampSettings,
                                    [key]: next,
                                  },
                                })
                              }
                              accentColor={themed.accent}
                            />
                          ))}
                      </>
                    );
                  }

                  return (
                    <>
                      <View style={styles.settingsHeader}>
                        <View style={styles.settingsTitleWrap}>
                          <MaterialIcons
                            name="graphic-eq"
                            size={18}
                            color="#00d9ff"
                          />
                          <Text
                            style={[
                              styles.settingsTitle,
                              { color: themed.accent },
                            ]}
                          >
                            CAB
                          </Text>
                        </View>
                      </View>

                      <TextInput
                        value={tone.cabSettings.name ?? ""}
                        onChangeText={(name) =>
                          updateTone({
                            cabSettings: {
                              ...tone.cabSettings,
                              name,
                            },
                          })
                        }
                        placeholder="Set CAB name"
                        placeholderTextColor={themed.placeholder}
                        style={[
                          styles.pedalNameInput,
                          {
                            backgroundColor: themed.inputBg,
                            borderColor: themed.inputBorder,
                            color: themed.textPrimary,
                          },
                        ]}
                      />

                      <ParameterControl
                        key="cab-lowCut"
                        label="Low Cut"
                        value={tone.cabSettings.lowCut}
                        onChange={(next) =>
                          updateTone({
                            cabSettings: { ...tone.cabSettings, lowCut: next },
                          })
                        }
                        min={8}
                        max={100}
                        step={1}
                        displayUnit=" Hz"
                        accentColor={themed.accent}
                      />

                      <ParameterControl
                        key="cab-highCut"
                        label="High Cut"
                        value={tone.cabSettings.highCut}
                        onChange={(next) =>
                          updateTone({
                            cabSettings: { ...tone.cabSettings, highCut: next },
                          })
                        }
                        min={6}
                        max={12}
                        step={1}
                        displayUnit=" kHz"
                        accentColor={themed.accent}
                      />

                      <ParameterControl
                        key="cab-resonance"
                        label="Resonance"
                        value={tone.cabSettings.resonance}
                        onChange={(next) =>
                          updateTone({
                            cabSettings: {
                              ...tone.cabSettings,
                              resonance: next,
                            },
                          })
                        }
                        accentColor={themed.accent}
                      />

                      <ParameterControl
                        key="cab-level"
                        label="Level"
                        value={tone.cabSettings.level}
                        onChange={(next) =>
                          updateTone({
                            cabSettings: { ...tone.cabSettings, level: next },
                          })
                        }
                        accentColor={themed.accent}
                      />
                    </>
                  );
                })()}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.stickyActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              saving ? styles.primaryButtonDisabled : null,
            ]}
            onPress={saveTone}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? "Saving..." : "Save Tone"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    color: "#adaaaa",
    marginTop: 4,
    fontSize: 13,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 110,
  },
  sectionCard: {
    backgroundColor: "#1a1919",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#262626",
    gap: 10,
  },
  sectionTitle: {
    color: "#ffdd7c",
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  helperText: {
    color: "#adaaaa",
    fontSize: 12,
  },
  chainHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chainInfoButton: {
    padding: 6,
    borderRadius: 6,
  },
  chainTooltip: {
    alignSelf: "flex-start",
    backgroundColor: "#262114",
    borderColor: "#4c3e17",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  chainTooltipText: {
    color: "#ffdd7c",
    fontSize: 11,
    fontWeight: "700",
  },
  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2c2c2c",
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  tagsDisplay: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3a310b",
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  signalFlowWrap: {
    marginTop: 2,
    marginBottom: 2,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2c2c2c",
    backgroundColor: "#111111",
  },
  signalEndpointText: {
    color: "#adadad",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
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
    backgroundColor: "#0a0a07",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
    paddingTop: 4,
    paddingBottom: 6,
  },
  signalEndpointBlock: {
    borderColor: "#5b5b5b",
    backgroundColor: "#0d0d0d",
  },
  signalIconBlockSelected: {
    borderColor: "#ffdd7c",
    backgroundColor: "#262114",
  },
  signalCustomBlock: {
    borderColor: "#34424a",
    backgroundColor: "#12181b",
  },
  signalIconBlockSwapSource: {
    borderColor: "#ffe066",
    borderWidth: 2,
    backgroundColor: "#3a2b00",
    shadowColor: "#ffe066",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  signalIconBlockSwapTarget: {
    borderColor: "#5f89ff",
    backgroundColor: "#101c3a",
  },
  signalIconBlockSwapInactive: {
    opacity: 0.42,
    borderColor: "#2b2b2b",
    backgroundColor: "#0a0a0a",
  },
  signalSwapPulseRing: {
    position: "absolute",
    top: -2,
    right: -2,
    bottom: -2,
    left: -2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffe066",
  },
  signalSwapArmedBadge: {
    position: "absolute",
    bottom: 1,
    left: 4,
    color: "#fff0c2",
    fontSize: 8,
    letterSpacing: 0.7,
    fontWeight: "900",
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
  signalIconLabel: {
    color: "#ffdd7c",
    fontSize: 9,
    fontWeight: "700",
    width: "90%",
    textAlign: "center",
  },
  signalDragHint: {
    position: "absolute",
    bottom: 2,
    right: 2,
  },
  input: {
    backgroundColor: "#0e0e0e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2c2c2c",
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  typeRow: {
    gap: 8,
    paddingBottom: 2,
  },
  typeChip: {
    backgroundColor: "#262626",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  typeChipText: {
    color: "#ffdd7c",
    fontSize: 11,
    fontWeight: "700",
  },
  settingsCard: {
    borderRadius: 10,
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#2c2c2c",
    padding: 12,
    marginTop: 8,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  settingsTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  settingsTitle: {
    color: "#ffdd7c",
    fontSize: 12,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  pedalNameInput: {
    color: "#ffffff",
    backgroundColor: "#0e0e0e",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2c2c2c",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    minWidth: 180,
  },
  removeButton: {
    color: "#ff7351",
    fontWeight: "700",
  },
  emptyText: {
    color: "#767575",
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  paramRow: {
    gap: 6,
    marginBottom: 6,
  },
  paramLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paramLabel: {
    color: "#adaaaa",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
  },
  paramUnit: {
    color: "#ffdd7c",
    fontSize: 10,
    fontWeight: "700",
  },
  paramUnitLabel: {
    color: "#767575",
    fontSize: 9,
    fontWeight: "600",
    marginLeft: 2,
  },
  dropdownContainer: {
    marginBottom: 10,
    gap: 4,
  },
  dropdownButton: {
    backgroundColor: "#0e0e0e",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2c2c2c",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  dropdownMenu: {
    backgroundColor: "#1a1919",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2c2c2c",
    overflow: "hidden",
  },
  dropdownOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2c2c2c",
  },
  dropdownOptionSelected: {
    backgroundColor: "#262114",
  },
  dropdownOptionText: {
    color: "#adaaaa",
    fontSize: 11,
    fontWeight: "600",
  },
  dropdownOptionTextSelected: {
    color: "#ffdd7c",
    fontWeight: "700",
  },
  paramControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  numericInputWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  slider: {
    flex: 1,
    height: 30,
  },
  numericInput: {
    minWidth: 50,
    width: "auto",
    color: "#ffffff",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#2c2c2c",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: "#0e0e0e",
  },
  stickyActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#131313",
    borderTopWidth: 1,
    borderTopColor: "#2c2c2c",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2c2c2c",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  secondaryButtonText: {
    color: "#adaaaa",
    fontWeight: "700",
  },
  primaryButton: {
    flex: 2,
    borderRadius: 10,
    backgroundColor: "#ffdd7c",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#413200",
    fontWeight: "800",
  },
});
