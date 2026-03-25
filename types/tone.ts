export type PedalType =
  | "Overdrive / Distortion"
  | "Delay"
  | "Reverb"
  | "Modulation"
  | "EQ"
  | "Compression";

export type SortMode = "recent" | "name";

export type AmpSettings = {
  name?: string;
  gain: number;
  bass: number;
  mid: number;
  treble: number;
  presence: number;
  master: number;
};

export type CabSettings = {
  name?: string;
  lowCut: number;
  highCut: number;
  resonance: number;
  level: number;
};

export type EQType = "3 band" | "5 band" | "10 band";

export type ModulationType =
  | "Chorus"
  | "Flanger"
  | "Phaser"
  | "Tremolo"
  | "Vibrato"
  | "Shifter"
  | "Auto Swell";

export type Pedal = {
  id: string;
  type: PedalType;
  name?: string;
  orderIndex: number;
  eqType?: EQType;
  modulationType?: ModulationType;
  parameters: Record<string, number>;
};

export type TonePreset = {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pedals: Pedal[];
  ampSettings: AmpSettings;
  cabSettings: CabSettings;
};

export const pedalTypeOptions: PedalType[] = [
  "Overdrive / Distortion",
  "Delay",
  "Reverb",
  "Modulation",
  "EQ",
  "Compression",
];

export const defaultAmpSettings: AmpSettings = {
  name: "Default Amp",
  gain: 5,
  bass: 5,
  mid: 5,
  treble: 5,
  presence: 5,
  master: 5,
};

export const defaultCabSettings: CabSettings = {
  name: "Default Cab",
  lowCut: 3,
  highCut: 7,
  resonance: 5,
  level: 5,
};

export const eqTypeOptions: EQType[] = ["3 band", "5 band", "10 band"];

export const modulationTypeOptions: ModulationType[] = [
  "Chorus",
  "Flanger",
  "Phaser",
  "Tremolo",
  "Vibrato",
  "Shifter",
  "Auto Swell",
];

const defaultPedalParamsByType: Record<PedalType, Record<string, number>> = {
  "Overdrive / Distortion": { gain: 5, tone: 5, level: 5 },
  Delay: { mix: 4, time: 5, feedback: 4 },
  Reverb: { mix: 4, time: 5, tone: 5 },
  Modulation: { rate: 5, depth: 5, mix: 4 },
  EQ: { bass: 5, mid: 5, treble: 5 },
  Compression: { sustain: 5, attack: 5, level: 5 },
};

export function getEQParametersByType(eqType: EQType): Record<string, number> {
  if (eqType === "3 band") {
    return { bass: 5, mid: 5, treble: 5 };
  }
  if (eqType === "5 band") {
    return {
      freq_80: 5,
      freq_250: 5,
      freq_800: 5,
      freq_2500: 5,
      freq_8000: 5,
    };
  }
  // 10 band
  return {
    freq_31: 5,
    freq_62: 5,
    freq_125: 5,
    freq_250: 5,
    freq_500: 5,
    freq_1000: 5,
    freq_2000: 5,
    freq_4000: 5,
    freq_8000: 5,
    freq_16000: 5,
  };
}

export function getEQParameterLabels(eqType: EQType): string[] {
  if (eqType === "3 band") {
    return ["Bass", "Mid", "Treble"];
  }
  if (eqType === "5 band") {
    return ["80 Hz", "250 Hz", "800 Hz", "2.5 kHz", "8 kHz"];
  }
  // 10 band
  return [
    "31 Hz",
    "62 Hz",
    "125 Hz",
    "250 Hz",
    "500 Hz",
    "1 kHz",
    "2 kHz",
    "4 kHz",
    "8 kHz",
    "16 kHz",
  ];
}

export function createPedal(type: PedalType, orderIndex: number): Pedal {
  const base = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    orderIndex,
    parameters: { ...defaultPedalParamsByType[type] },
  };

  if (type === "EQ") {
    return {
      ...base,
      eqType: "3 band",
      parameters: getEQParametersByType("3 band"),
    };
  }

  if (type === "Modulation") {
    return {
      ...base,
      modulationType: "Chorus",
    };
  }

  return base;
}

export function createEmptyTone(name = "Untitled Tone"): TonePreset {
  const timestamp = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name,
    description: "",
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    pedals: [],
    ampSettings: { ...defaultAmpSettings },
    cabSettings: { ...defaultCabSettings },
  };
}
