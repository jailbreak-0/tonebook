import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { TonePreset } from "@/types/tone";

const STORAGE_KEY = "@tonebook/presets/v1";
let inMemoryFallback: string | null = null;

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    if (
      Platform.OS === "web" &&
      typeof globalThis.localStorage !== "undefined"
    ) {
      return globalThis.localStorage.getItem(key);
    }
    return inMemoryFallback;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
    return;
  } catch {
    if (
      Platform.OS === "web" &&
      typeof globalThis.localStorage !== "undefined"
    ) {
      globalThis.localStorage.setItem(key, value);
      return;
    }
    inMemoryFallback = value;
  }
}

function sortByUpdatedAtDesc(items: TonePreset[]): TonePreset[] {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getTonePresets(): Promise<TonePreset[]> {
  const raw = await safeGetItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as TonePreset[];
    return sortByUpdatedAtDesc(parsed);
  } catch {
    return [];
  }
}

export async function getTonePresetById(
  id: string,
): Promise<TonePreset | null> {
  const all = await getTonePresets();
  return all.find((item) => item.id === id) ?? null;
}

export async function upsertTonePreset(payload: TonePreset): Promise<void> {
  const all = await getTonePresets();
  const existingIndex = all.findIndex((item) => item.id === payload.id);

  const normalized: TonePreset = {
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    all[existingIndex] = normalized;
  } else {
    all.push(normalized);
  }

  await safeSetItem(STORAGE_KEY, JSON.stringify(sortByUpdatedAtDesc(all)));
}

export async function deleteTonePreset(id: string): Promise<void> {
  const all = await getTonePresets();
  const next = all.filter((item) => item.id !== id);
  await safeSetItem(STORAGE_KEY, JSON.stringify(next));
}

export async function seedTonePresetsIfEmpty(
  sample: TonePreset[],
): Promise<void> {
  const current = await getTonePresets();
  if (current.length > 0) {
    return;
  }

  await safeSetItem(STORAGE_KEY, JSON.stringify(sortByUpdatedAtDesc(sample)));
}

export function formatToneAsText(tone: TonePreset): string {
  const pedalLines = tone.pedals
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pedal, index) => {
      const pedalMode =
        pedal.type === "EQ" && pedal.eqType
          ? ` [${pedal.eqType}]`
          : pedal.type === "Modulation" && pedal.modulationType
            ? ` [${pedal.modulationType}]`
            : "";
      const params = Object.entries(pedal.parameters)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      return `${index + 1}. ${pedal.name || pedal.type} (${pedal.type})${pedalMode}${params ? ` - ${params}` : ""}`;
    })
    .join("\n");

  const amp = tone.ampSettings;
  const ampLine = `Name ${amp.name || "Default Amp"} | Gain ${amp.gain} | Bass ${amp.bass} | Mid ${amp.mid} | Treble ${amp.treble} | Presence ${amp.presence} | Master ${amp.master}`;
  const cab = tone.cabSettings;
  const cabLine = `Name ${cab.name || "Default Cab"} | lowCut ${cab.lowCut} Hz | highCut ${cab.highCut} kHz | resonance ${cab.resonance} | level ${cab.level}`;

  return [
    `Tone: ${tone.name}`,
    tone.description ? `Description: ${tone.description}` : null,
    tone.tags.length ? `Tags: ${tone.tags.join(", ")}` : null,
    "",
    "Pedal Chain:",
    pedalLines || "No pedals configured.",
    "",
    "Amp Settings:",
    ampLine,
    "",
    "Cab Settings:",
    cabLine,
    "",
    `Updated: ${new Date(tone.updatedAt).toLocaleString()}`,
  ]
    .filter(Boolean)
    .join("\n");
}
