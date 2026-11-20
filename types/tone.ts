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
  effectName?: string;
  gain: number;
  bass: number;
  mid: number;
  treble: number;
  presence: number;
  master: number;
};

export type CabSettings = {
  name?: string;
  effectName?: string;
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

export type InstrumentType = "Guitar" | "Bass";

export const instrumentOptions: InstrumentType[] = ["Guitar", "Bass"];

export type MultiFxPedalType =
  | "Line 6 Pod Go"
  | "Headrush Prime"
  | "Donner Arena 2000"
  | "Valeton GP 200";

export const multiFxPedalOptions: MultiFxPedalType[] = [
  "Line 6 Pod Go",
  "Headrush Prime",
  "Donner Arena 2000",
  "Valeton GP 200",
];

export const multiFxEffectOptions: Record<MultiFxPedalType, string[]> = {
  "Line 6 Pod Go": ["Clean", "Crunch", "Lead", "Metal", "Bass", "Ambient"],
  "Headrush Prime": [
    "Modern Clean",
    "High Gain",
    "Vintage Crunch",
    "Acoustic",
    "Lead",
    "Dub",
  ],
  "Donner Arena 2000": ["Clean", "Rock", "Metal", "Blues", "Jazz", "Country"],
  "Valeton GP 200": ["Clean", "Overdrive", "Distortion", "Metal", "Ambient", "Bass"],
}

export const multiFxCabOptions: Record<
  MultiFxPedalType,
  Record<InstrumentType, string[]>
> = {
  "Line 6 Pod Go": {
    Guitar: [
      "4x12 Green",
      "2x12 Blue",
      "1x12 Black",
      "4x12 Tread",
      "2x12 V-Type",
      "Acoustic Sim",
    ],
    Bass: [
      "8x10 Classic",
      "4x10 Modern",
      "1x15 Vintage",
      "2x10 Compact",
      "6x10 Stack",
      "DI Clean",
    ],
  },
  "Headrush Prime": {
    Guitar: [
      "4x12 Vintage",
      "2x12 Boutique",
      "1x12 Combo",
      "4x12 Modern",
      "2x12 British",
      "Acoustic Sim",
    ],
    Bass: [
      "8x10 Stack",
      "4x10 Tight",
      "1x15 Deep",
      "2x12 Warm",
      "6x10 Vintage",
      "DI Clean",
    ],
  },
  "Donner Arena 2000": {
    Guitar: [
      "4x12 Rock",
      "2x12 Blues",
      "1x12 Jazz",
      "4x12 Metal",
      "2x12 Crunch",
      "Acoustic Sim",
    ],
    Bass: [
      "8x10 Rock",
      "4x10 Funk",
      "1x15 Blues",
      "2x10 Jazz",
      "4x10 Metal",
      "DI Clean",
    ],
  },
  "Valeton GP 200": {
    Guitar: [
      "4x12 British",
      "2x12 American",
      "1x12 Combo",
      "4x12 Modern",
      "2x12 Vintage",
      "Acoustic Sim",
    ],
    Bass: [
      "8x10 Vintage",
      "4x10 Modern",
      "1x15 Deep",
      "2x12 Punch",
      "6x10 Classic",
      "DI Clean",
    ],
  },
}

export type Pedal = {
  id: string;
  type: PedalType;
  name?: string;
  effectName?: string;
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
  instrumentType?: InstrumentType;
  multiFxPedal?: MultiFxPedalType;

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
  gain: 5,
  bass: 5,
  mid: 5,
  treble: 5,
  presence: 5,
  master: 5,
};

export const defaultCabSettings: CabSettings = {
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
    instrumentType: instrumentOptions[0],
    ampSettings: { ...defaultAmpSettings },
    cabSettings: { ...defaultCabSettings },
    multiFxPedal: multiFxPedalOptions[0],
  };
}
