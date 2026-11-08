# Katha AAC — Blockers

The human asked for the whole task list to be completed in one pass without stops. Per instruction 5 these are recorded with two options each. None blocked the code; each blocks a **verification** step. Work continued on every other task.

## BLOCKER-001: No physical tablet or emulator available
- **Task:** T-009, T-031, T-081, T-095, T-139, T-141, T-161, T-164, T-170, T-171
- **Tried:** wrote the code against the documented APIs, covered all logic with Jest, wrote Maestro flows in `e2e/`.
- **Error:** none; there is no device in this environment, so device spikes, Maestro runs, TalkBack, PDF rendering and timings could not be executed.
- **Option A:** the human runs `docs/DEVICE_CHECKLIST.md` and `e2e/*.yaml` on the target tablet with a development build and records Pass/Fail.
- **Option B:** provide an Android emulator image (tablet profile, 1280x800) in CI so the Maestro flows run automatically; the device-only checks stay manual.

## BLOCKER-002: Sinhala voice and recordings not available
- **Task:** T-060, T-095 (OB-5), T-152
- **Tried:** implemented the order clip, then Sinhala voice, then unsupported (D-08); manifest is empty until H-03.
- **Error:** not applicable until a device is tested; without recordings and without an installed Sinhala voice the child hears nothing.
- **Option A:** deliver H-03 recordings named per section 6.6 and run `npm run gen:audio`.
- **Option B:** install a Sinhala TTS voice on the tablet (Android Settings > Languages > Text-to-speech) and re-run OB-5.

## BLOCKER-003: Figma tools not used
- **Task:** T-031, T-043
- **Tried:** relied on the specs in sections 5 and 9 and on the existing components; existing pictograms (45 SVGs) and icon paths were accepted as T-043 output.
- **Error:** none; no Figma comparison (`get_screenshot`) was run, so "design comparison" is unverified.
- **Option A:** run T-031 with the Figma MCP tools connected and list differences in `docs/ISSUES.md`.
- **Option B:** the designer reviews the component gallery on the tablet (H-05).
