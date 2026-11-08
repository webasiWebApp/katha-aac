# Katha AAC — Device Checklist

Device: TODO  
Android version: TODO  
Build type: TODO  

## Sinhala rendering
- [ ] Sinhala labels on child board are legible
- [ ] Sinhala sentence in message bar renders correctly
- [ ] Sinhala in reports (MixedText) renders with correct script
- [ ] PDF export: Sinhala glyphs visible in exported PDF

## Audio
- [ ] Word clip plays when a symbol is tapped
- [ ] Message clip plays when Speak is pressed
- [ ] Sinhala TTS voice: `PASS / FAIL / NOT AVAILABLE` — note voice name if available
- [ ] Audio outcome indicator (dot) appears for failed/unsupported audio

## Child mode lock
- [ ] Two-finger 3-second gate opens adult sign-in
- [ ] Cancelling gate returns to board without message
- [ ] Android back button is blocked in child mode
- [ ] Immersive mode (system bars hidden) active in child mode
- [ ] Screen stays awake in child mode (expo-keep-awake)

## Idle return
- [ ] Idle timer fires and returns to home after the configured time
- [ ] Idle timer resets on touch

## Break overlay
- [ ] Break overlay appears on break key tap
- [ ] Home key appears after 3 s
- [ ] Tapping home closes overlay and emits page_opened

## Touch targets
- [ ] All adult controls ≥ 48 dp
- [ ] Child cells ≥ 72 dp on 3×4 grid

## Reduced motion
- [ ] Animations absent when reduced motion is on
- [ ] Chip highlights are instant

## Screen pinning
- [ ] Screen pinning guide in OB-5 is correct for this Android version

## Performance (record milliseconds)
- [ ] Tap to pressed-feedback: ___ms (target < 100 ms)
- [ ] Tap to word audio start: ___ms (target < 300 ms)
- [ ] getMeasures (30-day period, all measures): ___ms (target < 300 ms)

## TalkBack
- [ ] Adult sign-in accessible with TalkBack
- [ ] Report screen accessible with TalkBack

## Restart robustness
- [ ] Kill during speaking → restart → no duplicate rows
- [ ] Kill during commit → restart → no partial rows
- [ ] Kill during export → restart → no partial export

## PDF
- [ ] PDF opens on device after export
- [ ] Sinhala glyphs visible in PDF (T-141)
