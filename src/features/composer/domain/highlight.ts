/**
 * Start offsets (ms) for highlighting message chips one by one, evenly spaced across the audio.
 * With reduced motion all chips highlight at once (all zeros).
 */
export function highlightSchedule(
  chipCount: number,
  durationMs: number,
  reducedMotion = false,
): number[] {
  if (chipCount <= 0) return [];
  if (reducedMotion) return new Array<number>(chipCount).fill(0);
  const step = durationMs / chipCount;
  return Array.from({ length: chipCount }, (_, i) => Math.round(i * step));
}
