# 🎸 ToneBook — A notebook for your guitar tone

ToneBook is a mobile app for guitarists and bassists to collect, build, and share tone presets. Think of it as a notebook for your rig: save pedal chains, dial in amp and cab settings, tag tones by style, and export your whole library to share with bandmates or across devices.

Built with **Expo (React Native)**, **TypeScript**, and **expo-router**, it runs on iOS and Android from a single codebase. (iOS currently untested)


---

## ✨ Features

- **Tone library** — Browse all your saved tones with search, tag filtering, and sorting (recent / name).
- **Tone builder** — Assemble a signal chain from pedal blocks (Overdrive/Distortion, Delay, Reverb, Modulation, EQ, Compression) with per-pedal parameters and ordering.
- **Amp & cab modeling** — Dial gain, bass, mid, treble, presence, master, plus cab low/high cut, resonance, and level.
- **Instrument & multi-FX support** — Choose Guitar or Bass, and pair with a multi-FX pedal (Line 6 Pod Go, Headrush Prime, Donner Arena 2000, Valeton GP 200) with matching effects and cab options.
- **Dark mode** — Device, light, or dark theme, persisted across launches.
- **Share & export** — Share a single tone or your entire library through the native share sheet (mobile), Web Share API / clipboard (web), using a portable ToneBook JSON/text format.
- **Local-first** — All data persists on device via AsyncStorage, with graceful fallbacks for web and storage failures.
- **Sample tones** — Starts with a couple of preset tones so you can explore the app immediately.

---

## 🛠 Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Expo SDK 58](https://expo.dev) |
| UI | [React Native 0.88](https://reactnative.dev), [React 19](https://react.dev) |
| Language | TypeScript |
| Navigation | [expo-router](https://docs.expo.dev/router/) (file-based routing) |
| Storage | [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) |
| Gestures / animation | react-native-gesture-handler, react-native-reanimated, react-native-worklets |
| Lists | react-native-draggable-flatlist (reorderable pedal chain) |
| Native APIs | expo-sharing, expo-haptics, expo-font, expo-image, expo-web-browser, expo-linking, expo-constants, expo-system-ui, expo-splash-screen, expo-status-bar, expo-symbols |
| Utilities | react-native-safe-area-context, react-native-screens, react-native-view-shot, @react-native-community/slider, @expo/vector-icons |

---

## 🚀 Getting started

### Prerequisites

- Node.js (LTS recommended)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/) (`npm install -g expo-cli`)
- An iOS Simulator / Android Emulator, or the [Expo Go](https://expo.dev/go) app on a physical device

### Installation

```bash
# Clone the repo
git clone https://github.com/jailbreak-0/tonebook.git
cd tonebook

# Install dependencies
npm install

# Start the development server
npx expo start
```

Then press:
- `a` — Android emulator
- `i` — iOS simulator
- `w` — web browser
- `Shift+S` — create a production build (EAS)

### Available scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run on web |
| `npm run lint` | Run ESLint (eslint-config-expo) |

---
## 📂 Project structure

```
tonebook/
├── app/                          # expo-router file-based routes
│   ├── _layout.tsx               # Root navigation, theming, status bar
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab layout (haptic tabs)
│   │   └── index.tsx             # Library screen (search, tags, sort)
│   ├── modal.tsx
│   ├── settings.tsx              # Theme preference + export all tones
│   └── tone/
│       ├── new.tsx               # Create a new tone
│       ├── [id].tsx              # Tone detail (signal chain, share, delete)
│       └── [id]/edit.tsx         # Edit an existing tone
├── components/
│   ├── tone-editor-screen.tsx    # Main tone builder (chain, amp, cab, FX)
│   ├── haptic-tab.tsx
│   ├── themed-text.tsx / themed-view.tsx
│   ├── external-link.tsx / hello-wave.tsx / parallax-scroll-view.tsx
│   └── ui/
│       ├── collapsible.tsx
│       └── icon-symbol.tsx
├── hooks/
│   ├── theme-preference.tsx      # Device/dark/light theme context
│   ├── use-color-scheme.ts*
│   └── use-theme-color.ts
├── lib/
│   ├── tone-store.ts             # AsyncStorage CRUD with web/memory fallbacks
│   ├── tone-share.ts             # Tone export/share format + native share
│   └── sample-tones.ts           # Seeded sample presets
├── types/
│   └── tone.ts                   # Domain types (TonePreset, Pedal, AmpSettings, …)
├── constants/
│   └── theme.ts                  # Light/dark color & font tokens
├── assets/
│   └── images/                   # App icons, splash screen, favicon
├── app.json                      # Expo config (name, icons, plugins, eas)
├── package.json
└── tsconfig.json
```

---

## 💡 The idea behind the project

Guitarists obsess over tone. Between pedals, amps, cabinets, and multi-FX units, a single "sound" is actually a stack of settings that's hard to remember or communicate. ToneBook treats a tone like a document in a notebook: you can write it down, tag it ("lead", "clean", "worship", "ambient"), come back to it later, and send it to someone else.

I built it because I wanted a lightweight, offline-first place to catalog my own presets — without logging into a cloud service or dealing with cluttered gear databases. The signal-chain view (pedals → AMP → CAB) mirrors a real pedalboard, so the mental model maps directly to physical gear.

---

## 🧗 Problems faced during development

Building ToneBook surfaced a handful of real-world React Native challenges:

1. **Cross-platform storage fallbacks.** `AsyncStorage` isn't available on Expo web. I wrapped reads/writes in a `safeGetItem` / `safeSetItem` layer that falls back to `localStorage` on web, then to an in-memory store — so the app never crashes regardless of platform.

2. **Expo SDK 58 migration.** The project was upgraded to Expo SDK 58, which included resolving Metro dependency mismatches and aligning native module versions. Keeping the dev client and router compatible took careful version pinning.

3. **Universal sharing.** Sharing works differently on mobile (native `Share` sheet), web (`navigator.share`), and browsers without share support (clipboard fallback). The `tone-share` module abstracts all three paths behind one API, plus a custom `[TONEBOOK TONE]` / `[TONEBOOK LIBRARY]` delimited format for portable import/export.

4. **Theme persistence.** Supporting device/dark/light preferences required reading persisted state asynchronously on mount without flashing the wrong theme, handled via a `ThemePreferenceProvider` context with a mounted guard.

5. **Reorderable pedal chain.** The pedalboard order matters sonically, so the chain uses a draggable list with animated reordering (gesture-handler + reanimated worklets), keeping the underlying `orderIndex` in sync.

6. **Type-safe domain modeling.** A tone nests pedals, amp settings, cab settings, instrument type, and multi-FX options — each with validation defaults. Keeping TypeScript strict across forms, list views, and share serialization was the bulk of the type design.

---
## 🎓 Things I learned

- **Expo & React Native production concerns:** app icons, adaptive icons, splash screens, safe areas, status bars, and EAS project configuration.
- **File-based routing with expo-router**, including nested tabs, stack screens, modal presentation, and typed routes.
- **Local-first data design:** AsyncStorage serialization, schema versioning (`@tonebook/presets/v1`), and graceful degradation when storage is unavailable.
- **Cross-platform API abstraction:** writing platform-agnostic wrappers (share, storage, color scheme) so UI code stays clean.
- **Animation & gesture stack:** reanimated worklets, gesture handler root views, and haptic feedback for polished interactions.
- **TypeScript at scale:** discriminated unions for chain blocks (`pedal` / `amp` / `cab`), exhaustive option maps for multi-FX pedals, and strict domain types.
- **UI polish:** building a consistent dark/light design system from scratch (color tokens, themed components, dynamic accents).

---

This project demonstrates end-to-end mobile product thinking, not just a tutorial clone:

- **Full-stack mobile:** navigation, persistent storage, native API integration, theming, and sharing — all in one app.
- **Domain-driven design:** the tone model reflects a real musician's workflow (pedalboard order, amp/EQ stacks, multi-FX presets).
- **Platform awareness:** code that behaves correctly on iOS, Android, and web, with appropriate fallbacks at every layer.
- **Modern React Native toolchain:** Expo SDK 58, React 19, TypeScript strict mode, reanimated worklets, and EAS-ready configuration.
- **Clean architecture:** separation of routes (expo-router), domain types (`types/tone.ts`), storage logic (`lib/tone-store.ts`), and UI components.

**Skills demonstrated:** React Native · TypeScript · Expo · expo-router · AsyncStorage · React Native Reanimated · Git · EAS · data modeling · Cross-platform UI

---

## 🔮 Future improvements

- Import tones from shared ToneBook payloads (currently export-only)
- Tone search/filter by amp type or pedal type
- Favorites / pinning important tones
- Export to image (via `react-native-view-shot`) for social sharing
- Cloud sync / account backup
- Audio preview integration (play a reference clip per tone)

---

## 📄 License

MIT. Feel free to fork, remix, and use it for your own rig.

---

*Built with ⚡ Expo and ❤️ for guitar tone.*
