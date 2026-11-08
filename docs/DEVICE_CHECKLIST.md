# Katha AAC — Device Checklist

Device: none available during the build (TODO(human): record the tablet model)  
Android version: TODO(human)  
Build type: TODO(human) (development build for this checklist)  

## Sinhala rendering
- [ ] Sinhala labels on child board are legible — **NOT RUN (needs device)**
- [ ] Sinhala sentence in message bar renders correctly — **NOT RUN (needs device)**
- [ ] Sinhala in reports (MixedText) renders with correct script — **NOT RUN (needs device)**
- [ ] PDF export: Sinhala glyphs visible in exported PDF — **NOT RUN (needs device)**

## Audio
- [ ] Word clip plays when a symbol is tapped — **NOT RUN (needs device)**
- [ ] Message clip plays when Speak is pressed — **NOT RUN (needs device)**
- [ ] Sinhala TTS voice: `PASS / FAIL / NOT AVAILABLE` — note voice name if available — **NOT RUN (needs device)**
- [ ] Audio outcome indicator (dot) appears for failed/unsupported audio — **NOT RUN (needs device)**; dot logic covered by Jest (`AdultDot.test.tsx`); audio failure itself is a device check

## Child mode lock
- [ ] Two-finger 3-second gate opens adult sign-in — **NOT RUN (needs device)**; gate logic covered by Jest (`gate.test.ts`, `board.test.tsx`)
- [ ] Cancelling gate returns to board without message — **NOT RUN (needs device)**; no message is created: covered by Jest only for the board; sign-in cancel is a device check
- [ ] Android back button is blocked in child mode — **NOT RUN (needs device)**
- [ ] Immersive mode (system bars hidden) active in child mode — **NOT RUN (needs device)**
- [ ] Screen stays awake in child mode (expo-keep-awake) — **NOT RUN (needs device)**

## Idle return
- [ ] Idle timer fires and returns to home after the configured time — **NOT RUN (needs device)**; logic covered by Jest (`board.test.tsx`, fake timers)
- [ ] Idle timer resets on touch — **NOT RUN (needs device)**; logic covered by Jest

## Break overlay
- [ ] Break overlay appears on break key tap — **NOT RUN (needs device)**; logic covered by Jest (`board.test.tsx`)
- [ ] Home key appears after 3 s — **NOT RUN (needs device)**; logic covered by Jest (`board.test.tsx`)
- [ ] Tapping home closes overlay and emits page_opened — **NOT RUN (needs device)**; logic covered by Jest (`board.test.tsx`)

## Touch targets
- [ ] All adult controls ≥ 48 dp — **NOT RUN (needs device)**
- [ ] Child cells ≥ 72 dp on 3×4 grid — **NOT RUN (needs device)**

## Reduced motion
- [ ] Animations absent when reduced motion is on — **NOT RUN (needs device)**; reduced-motion schedule covered by Jest (`composerReducer.test.ts`)
- [ ] Chip highlights are instant — **NOT RUN (needs device)**; schedule covered by Jest (`composerReducer.test.ts`)

## Screen pinning
- [ ] Screen pinning guide in OB-5 is correct for this Android version — **NOT RUN (needs device)**

## Performance (record milliseconds)
- [ ] Tap to pressed-feedback: ___ms (target < 100 ms) — **NOT RUN (needs device)**
- [ ] Tap to word audio start: ___ms (target < 300 ms) — **NOT RUN (needs device)**
- [x] Grid cells memoised; composer changes do not re-render the grid — **Pass (Jest)** 2026-11-08: `BoardGrid` is `React.memo` with a stable cell callback; `board.test.tsx` "grid memoisation (T-161)" counts 12 cell renders on mount and 0 more after two taps (48 without memo)
- [ ] getMeasures (30-day period, all measures): ___ms (target < 300 ms) — **NOT RUN (needs device)**; Jest: 25 ms for 365 days x 3 sessions x 40 events (T-128); tablet value still to be measured

## TalkBack
- [ ] Adult sign-in accessible with TalkBack — **NOT RUN (needs device)**
- [ ] Report screen accessible with TalkBack — **NOT RUN (needs device)**

## Restart robustness
- [ ] Kill during speaking → restart → no duplicate rows — **NOT RUN (needs device)**; restart rule covered by Jest (`upgrade.test.ts`)
- [ ] Kill during commit → restart → no partial rows — **NOT RUN (needs device)**; commit atomicity covered by Jest (`sessions.test.ts`, `upgrade.test.ts`)
- [ ] Kill during export → restart → no partial export — **NOT RUN (needs device)**

## PDF
- [ ] PDF opens on device after export — **NOT RUN (needs device)**
- [ ] Sinhala glyphs visible in PDF (T-141) — **NOT RUN (needs device)**


## Summary

Every line above is `NOT RUN (needs device)`: no tablet or emulator was available while building. Jest covers the logic noted next to the lines; nothing on this list has been seen working on hardware. Run this checklist on the target tablet with a development build before any use with a child.
