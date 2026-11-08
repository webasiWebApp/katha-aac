import type { AttemptRow, EventRow, MeaningfulUse } from './types';

/**
 * Meaningful use (section 7.1): a symbol the child selected (source grid or core)
 * in the submitted draft that is still in the final message.
 * Template words inserted by the app are not selections.
 * Stored phrases produce no word uses (they count as one use of the phrase).
 */
export function computeMeaningfulUses(attempts: AttemptRow[], events: EventRow[]): MeaningfulUse[] {
  const byDraft = new Map<string, EventRow[]>();
  for (const e of events) {
    if (e.draft_id && (e.type === 'symbol_selected' || e.type === 'undo')) {
      const list = byDraft.get(e.draft_id) ?? [];
      list.push(e);
      byDraft.set(e.draft_id, list);
    }
  }
  const out: MeaningfulUse[] = [];
  for (const a of attempts) {
    if (a.kind !== 'built' || !a.draft_id) continue;
    const draftEvents = byDraft.get(a.draft_id) ?? [];
    const childCount = new Map<string, number>();
    for (const e of draftEvents) {
      if (!e.symbol_id) continue;
      if (e.type === 'symbol_selected' && (e.source === 'grid' || e.source === 'core')) {
        childCount.set(e.symbol_id, (childCount.get(e.symbol_id) ?? 0) + 1);
      } else if (e.type === 'undo') {
        childCount.set(e.symbol_id, (childCount.get(e.symbol_id) ?? 0) - 1);
      }
    }
    const finalIds = JSON.parse(a.symbol_ids_json) as string[];
    const finalCount = new Map<string, number>();
    for (const id of finalIds) finalCount.set(id, (finalCount.get(id) ?? 0) + 1);
    for (const [symbolId, n] of finalCount) {
      const uses = Math.min(n, Math.max(0, childCount.get(symbolId) ?? 0));
      for (let i = 0; i < uses; i++) {
        out.push({
          symbolId,
          messageId: a.id,
          sessionId: a.session_id,
          at: a.submitted_at,
          offsetMin: a.offset_min,
        });
      }
    }
  }
  return out;
}
