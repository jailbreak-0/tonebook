import { createEmptyTone, createPedal, TonePreset } from "@/types/tone";

export function buildSampleTones(): TonePreset[] {
  const a = createEmptyTone("Neon Velocity");
  a.description = "Lead tone with focused mids and space for arena sections.";
  a.tags = ["lead", "worship", "stereo"];
  a.pedals = [
    createPedal("Overdrive / Distortion", 0),
    createPedal("Delay", 1),
    createPedal("Reverb", 2),
  ];
  a.ampSettings = {
    gain: 6,
    bass: 5,
    mid: 7,
    treble: 6,
    presence: 6,
    master: 5,
  };

  const b = createEmptyTone("Dusty Reverb");
  b.tags = ["clean", "ambient"];
  b.pedals = [createPedal("Modulation", 0), createPedal("Reverb", 1)];
  b.ampSettings = {
    gain: 3,
    bass: 6,
    mid: 5,
    treble: 6,
    presence: 4,
    master: 5,
  };

  return [a, b];
}
