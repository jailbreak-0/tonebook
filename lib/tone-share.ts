import { Alert, Platform, Share } from "react-native";

import { formatToneAsText } from "@/lib/tone-store";
import { TonePreset } from "@/types/tone";

const TONE_SHARE_VERSION = 1;

const TONEBOOK_TONE_START = "[TONEBOOK TONE]";
const TONEBOOK_TONE_END = "[/TONEBOOK TONE]";
const TONEBOOK_LIBRARY_START = "[TONEBOOK LIBRARY]";
const TONEBOOK_LIBRARY_END = "[/TONEBOOK LIBRARY]";

export type ToneShareFormat = "text" | "json";

function buildSingleTonePayload(tone: TonePreset): string {
  const payload = {
    format: "tonebook/tone",
    version: TONE_SHARE_VERSION,
    exportedAt: new Date().toISOString(),
    tone,
  };
  return [
    TONEBOOK_TONE_START,
    JSON.stringify(payload, null, 2),
    TONEBOOK_TONE_END,
  ].join("\n");
}

function buildLibraryPayload(tones: TonePreset[]): string {
  const payload = {
    format: "tonebook/tones",
    version: TONE_SHARE_VERSION,
    exportedAt: new Date().toISOString(),
    tones,
  };
  return [
    TONEBOOK_LIBRARY_START,
    JSON.stringify(payload, null, 2),
    TONEBOOK_LIBRARY_END,
  ].join("\n");
}

export function buildToneShareMessage(
  tone: TonePreset,
  format: ToneShareFormat = "text",
): string {
  if (format === "json") {
    return buildSingleTonePayload(tone);
  }
  return `${tone.name} (Tonebook)\n\n${formatToneAsText(tone)}`;
}

async function openNativeShareSheet(
  title: string,
  message: string,
): Promise<boolean> {
  try {
    const result = await Share.share({ title, message });
    return result.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}

async function shareOnWeb(title: string, message: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text: message });
      return true;
    } catch {
      // User dismissed or the channel rejected the share; fall through to
      // the clipboard fallback below.
    }
  }
  try {
    await navigator.clipboard.writeText(message);
    Alert.alert("Copied to clipboard", "Paste it wherever you like.");
    return true;
  } catch {
    Alert.alert("Sharing failed", "Could not open a share channel on web.");
    return false;
  }
}

export async function shareTone(
  tone: TonePreset,
  format: ToneShareFormat = "text",
): Promise<boolean> {
  const message = buildToneShareMessage(tone, format);
  const title = `Tonebook — ${tone.name}`;

  if (Platform.OS === "web") {
    return shareOnWeb(title, message);
  }
  return openNativeShareSheet(title, message);
}

export async function shareAllTones(tones: TonePreset[]): Promise<boolean> {
  const message = buildLibraryPayload(tones);
  const title = "Tonebook — All Tones";

  if (Platform.OS === "web") {
    return shareOnWeb(title, message);
  }
  return openNativeShareSheet(title, message);
}
