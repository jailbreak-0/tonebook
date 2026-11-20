# Changelog

All notable changes to Tonebook are documented in this file.

## 2026-11-16

### Added
- **Instrument selector** (Guitar / Bass) in the Tone Info section. This selection drives which CAB options are offered per Multi FX pedal.
- **Instrument-specific CAB options** (`multiFxCabOptions` in `types/tone.ts`): every Multi FX pedal now has separate Guitar and Bass CAB lists, and the CAB block's Effect Name dropdown uses the list matching the selected instrument. Switching instrument resets the CAB effect name.
- **Sharing system** (`lib/tone-share.ts`):
  - Share a single tone from the Tone Detail "more" menu as a human-readable text summary or as a tagged JSON payload (`[TONEBOOK TONE]...[/TONEBOOK TONE]`) for backups and future re-import.
  - Export all tones at once from Settings > Data > "Export all tones" as a tagged JSON payload (`[TONEBOOK LIBRARY]...[/TONEBOOK LIBRARY]`).
  - Native share sheet on iOS/Android; on web it uses the Web Share API with a clipboard fallback.
- **CHANGELOG.md** (this file) to track all changes going forward.

### Changed
- **Effect Name moved out of the Multi FX section into the Pedal Chain section**: every block in the chain (each pedal, AMP, CAB) now has its own Effect Name dropdown in place of the old free-text name inputs ("Set AMP name", "Set CAB name", "Custom pedal name"). Changing the Multi FX pedal resets the per-block effect names.
- **Dropdown menus render as overlays**: the menu floats above the content below instead of pushing it down. Same visual styling as before, positioned directly under the button with the original 4px gap, raised via `zIndex`/`elevation`.
- Tone detail screen and text export (`formatToneAsText`) now show the effect name for AMP/CAB and each pedal instead of the custom name.

### Removed
- **Premium system entirely**: the free/premium tier concept, the Plan section in Settings, the `usePremium` hook/provider, and premium storage helpers (`getIsPremium`/`setIsPremium`). The Multi FX pedal and Instrument inputs are now available to everyone and act as identification inputs for tones.

## 2026-11-16 (earlier today, pre-changelog)

### Changed
- Effect Name dropdown relocated from the Multi FX section to under every effect block in the Pedal Chain (per the original request).
- Effect Name dropdown converted to an overlay-style menu that does not push content around.
