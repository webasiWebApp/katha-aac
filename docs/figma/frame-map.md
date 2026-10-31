# Figma frame map: Katha AAC UI v1

Figma file `dTGxZvGYOISN9pZA3JlNLr`, page "03 Components" (node 1:4). Paths are relative to the repo root.

**Status key**
- **Built**: the component exists, typechecks and lints clean, and its Jest tests pass (`npx jest`: 14 suites, 257 tests, run 2026-10-31).
- **Spot-checked**: its numbers were also compared against `get_design_context` for the named Figma node.
- No component has been compared with its Figma render on an emulator or device. See "Not verified" at the bottom.

## Foundations and assets

| Item | Figma node | File | Covers | Tests | Status |
|---|---|---|---|---|---|
| Colour tokens (Light / Dark / High-contrast) | 4:436 | `src/core/theme/colors.ts` | 3 modes, child / class / fac / chart / adult / note | none for values | Built |
| Size tokens, geometry, motion | 4:1005, 4:1050, 4:1101 | `src/core/theme/size.ts` | space, radii, targets, cell sizes L / M / S, motion ms | none for values | Built |
| Text styles Child/* and Fac/* | 4:919 | `src/core/theme/typography.ts` | 6 Child styles, 12 Fac styles | none for values | Built |
| Effects (Child/Pressed glow, Fac/Card) | styles | `src/core/theme/effects.ts` | 2 drop shadows | none | Built |
| Labels (Sinhala / English, 30 words) | Labels collection | `src/core/i18n/labels.ts` | "verify with SLT" comments | none | Built (placeholders) |
| Fonts | n/a | `assets/fonts/` | Noto Sans Sinhala 400 / 500 / 600 / 700, Noto Sans 400 / 600 / 700 | n/a | Built |
| Icon (55 UI icons) | 3:2 | `src/core/ui/Icon.tsx`, `src/core/ui/iconPaths.ts` | typed name union, 24 px | `src/core/ui/tests/Icon.test.tsx` | Built |
| Pictogram (45 symbols, placeholders) | 3:230 | `src/features/vocabulary/ui/Pictogram.tsx`, `pictogramData.ts`, `assets/pictograms/*.svg` | 45 SVGs, 96 px | `src/features/vocabulary/tests/Pictogram.test.tsx` | Built (PLACEHOLDER artwork) |

## Child components

| Component | Figma node | File | Variants | Tests | Status |
|---|---|---|---|---|---|
| ClassTint | 4:13 | `src/features/board/ui/ClassTint.tsx` | People, Action, Describing, Thing, Core, Folder (6 px edge) | `features/board/tests/board.test.tsx` | Built |
| SymbolCell | 4:167 | `src/features/board/ui/SymbolCell.tsx` | 6 states (Default, Pressed, Selected, Hidden, Disabled, New) x 3 sizes (L, M, S) | `features/board/tests/board.test.tsx` | Built. Checked against Figma (numbers only, not on screen): L Default 4:17, L Pressed 4:25, M Default 4:67, S Default 4:117, L Hidden 4:41, L Disabled 4:49. Two open differences below |
| CoreKey | 5:520 | `src/features/board/ui/CoreKey.tsx` | Core / Nav x Default / Pressed | `features/board/tests/board.test.tsx` | Built |
| CoreKeyRow | 5:702 | `src/features/board/ui/CoreKeyRow.tsx` | Hand = Right, Left | `features/board/tests/board.test.tsx` | Built |
| StripCell | 4:183 | `src/features/recommendations/ui/StripCell.tsx` | Default, Linked | `features/recommendations/tests/recommendations.test.tsx` | Built |
| PredictionStrip | 4:254 | `src/features/recommendations/ui/PredictionStrip.tsx` | 4 items, 3 items, Learning, Calm band | `features/recommendations/tests/recommendations.test.tsx` | Built |
| MessageChip | 5:105 | `src/features/composer/ui/MessageChip.tsx` | Default, Speaking | `features/composer/tests/composer.test.tsx` | Built |
| TemplateSlot | 5:124 | `src/features/composer/ui/TemplateSlot.tsx` | Empty hint, Filled, Invalid | `features/composer/tests/composer.test.tsx` | Built |
| MessageBar | 5:434 | `src/features/composer/ui/MessageBar.tsx` | Empty, One, Two, Template open, Template filled, Four, Speaking, Audio fallback | `features/composer/tests/composer.test.tsx` | Built |
| ChildButton | 5:486 | `src/features/composer/ui/ChildButton.tsx` | Speak, Undo, Clear x Default / Pressed / Disabled, plus Clear Long-press (long-press only) | `features/composer/tests/composer.test.tsx` | Built, spot-checked (5:438) |
| AdultGate | 5:732 | `src/features/access/ui/AdultGate.tsx` | Step = Hold, Check | `features/access/tests/access.test.tsx` | Built |
| IntentConfirmChip | 5:762 | `src/features/observations/ui/IntentConfirmChip.tsx` | Visible, Dismissing | `features/observations/tests/IntentConfirmChip.test.tsx` | Built |
| AdultDot | 5:763 | `src/features/audio/ui/AdultDot.tsx` | TTS used | `features/audio/tests/AdultDot.test.tsx` | Built |

## Facilitator components

| Component | Figma node | File | Variants | Tests | Status |
|---|---|---|---|---|---|
| Button | 5:805 | `src/core/ui/Button.tsx` | Primary, Secondary, Ghost, Danger x L (56), M (48) | `core/ui/tests/Button.test.tsx` | Built |
| Chip | 5:818 | `src/core/ui/Chip.tsx` | Neutral, Primary, Success, Warning, Danger | `core/ui/tests/display.test.tsx` | Built |
| OfflineBadge | 5:819 | `src/core/ui/OfflineBadge.tsx` | single | `core/ui/tests/display.test.tsx` | Built |
| AppBar | 5:842 | `src/core/ui/AppBar.tsx` | Root, Back | `core/ui/tests/controls.test.tsx` | Built |
| BottomNav | 5:1021 | `src/core/ui/BottomNav.tsx` | Active = Home, Child, Vocabulary, Insights, Settings | `core/ui/tests/controls.test.tsx` | Built |
| StatTile | 5:1048 | `src/core/ui/StatTile.tsx` | Trend = Up, Down, Flat | `core/ui/tests/display.test.tsx` | Built |
| Toggle | 5:1064 | `src/core/ui/Toggle.tsx` | On, Off, Locked | `core/ui/tests/controls.test.tsx` | Built |
| SegmentedControl | 5:1086 | `src/core/ui/SegmentedControl.tsx` | Selected = First, Second, Third | `core/ui/tests/controls.test.tsx` | Built |
| ListRow | 5:1122 | `src/core/ui/ListRow.tsx` | Navigation, Toggle, Value (min height 64) | `core/ui/tests/controls.test.tsx` | Built |
| TextField | 5:1140 | `src/core/ui/TextField.tsx` | Default, Focus, Locked | `core/ui/tests/controls.test.tsx` | Built |
| Dialog | 5:1144 | `src/core/ui/Dialog.tsx` | single | `core/ui/tests/controls.test.tsx` | Built |
| Toast | 5:1158 | `src/core/ui/Toast.tsx` | single | `core/ui/tests/display.test.tsx` | Built |
| EmptyState | 5:1162 | `src/core/ui/EmptyState.tsx` | single | `core/ui/tests/display.test.tsx` | Built |
| ConsentBanner | 5:1171 | `src/features/access/ui/ConsentBanner.tsx` | single | `features/access/tests/access.test.tsx` | Built |
| Card | 5:1178 | `src/core/ui/Card.tsx` | single | `core/ui/tests/display.test.tsx` | Built |
| PhaseTimeline | 5:1282 | `src/features/study-mode/ui/PhaseTimeline.tsx` | Current = Baseline, Alternating, Probes, Maintenance | `features/study-mode/tests/PhaseTimeline.test.tsx` | Built |
| SuggestionCard | 5:1512 | `src/features/insights/ui/SuggestionCard.tsx` | Confidence High / Medium / Low x State Default / Held | `features/insights/tests/SuggestionCard.test.tsx` | Built |
| LineChart | 7:652 | `src/core/ui/charts/LineChart.tsx` | Phone / Tablet x Three series / One series | `core/ui/tests/charts.test.tsx` | Built |
| BarChart | 7:690 | `src/core/ui/charts/BarChart.tsx` | Week, Conditions | `core/ui/tests/charts.test.tsx` | Built |
| Heatmap | 7:801 | `src/core/ui/charts/Heatmap.tsx` | Grid, Routine x time | `core/ui/tests/charts.test.tsx` | Built |
| ProgressBar | 7:804 | `src/core/ui/ProgressBar.tsx` | single | `core/ui/tests/display.test.tsx` | Built |

## Dev gallery

- Navigator: `src/app/navigation/DevGalleryNavigator.tsx`. `App.tsx` opens it when `__DEV__` is true.
- Screens: `src/app/dev/screens/` (Tokens, ChildGrid, ChildMessage, Facilitator, Charts).
- Gallery data: `src/app/dev/galleryData.ts`.

## Differences and gaps found

- **Folder corner fold** (`SymbolCell`): checked, no difference. The Figma path (4:23) is the same triangle, `#52606D` at 45%, which equals `inkFaint`.
- **SymbolCell Disabled** (4:49): resolved for the pictogram. The Figma code export shows opacity only on the class edge and the label, but the Figma screenshot shows the pictogram dimmed too, so the code (which dims it) matches. Still unknown: whether the folder corner is dimmed in Figma, because the screenshot cell has `opensPage` off. The code dims it. Code unchanged.
- **SymbolCell Hidden** (4:41): the Figma Hidden variant still draws the folder corner when `opensPage` is true. The code hides it. Code unchanged. Confirm which is intended (the design default has `opensPage` off).
- **Speaking state height**: Foundations > Motion says the message bar grows 96 to 112. The Handoff page says it stays at 96 dp, with a blue border and waveform instead. The code follows the Handoff (`MessageBar.tsx`). `size.ts` still holds `messageRowSpeaking: 112`, which nothing should use. Confirm with the designer.
- **Stale swatch labels in Figma**: the Colour modes swatches show `fac/primary-soft #E8EFFD`, `fac/success-soft #E7F5EC`, `fac/warning-soft #FDF1E4`. The variables and the Handoff say `#EEF3FE`, `#EEF8F1`, `#FEF5EC`. The variable values should be the truth.
- **Overline letter spacing**: Figma reports `letterSpacing: 6` with no unit. The code reads it as 6% of 12 sp (0.72). Please confirm.
- **Dark and High-contrast values** come from the swatch text on the Foundations page. `get_variable_defs` only returned Light-mode values, so Dark and High-contrast were not checked against the variables.
- **Translucent tokens** (`child/selected-soft`, `ink-faint`, `class/folder`, `adult/dot`, `chart/heat-1` to `-5`, `chart/baseline`) are named in the Handoff but not shown as swatches. Confirm the values in `colors.ts` against the Figma variables.
- **Font**: Figma uses Yaldevi as a stand-in. The code uses Noto Sans Sinhala (from `assets/fonts`).

## Not verified

- No component has been compared against its Figma screenshot on an emulator or device. Only the numbers for `ChildButton` Speak (5:438) were read from Figma and compared with the code. `SymbolCell` was checked the same way for L Default, L Pressed, M Default, S Default, L Hidden and L Disabled. Radius, pictogram size, gap, padding, label style, class edge, border width, glow and pressed overlay all match. Not checked: M and S in the Pressed, Selected, Hidden, Disabled and New states, L Selected, and L New.
- Minimum touch sizes are asserted in 9 test files (board, composer, access, insights, observations, recommendations, and the core controls, display and Button tests). The chart, Icon, Pictogram, AdultDot and Chip components have no touch-size assertion. Nothing was measured on a device.
- Reduced-motion is tested only in `composer.test.tsx`. Dark and High-contrast rendering have no tests. The component tests render in Light mode only, so only the token values exist for the other two modes.
- Colour-contrast ratios (AA / AAA) were not recomputed.
