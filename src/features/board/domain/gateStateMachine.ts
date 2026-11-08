/**
 * Adult gate (section 9.3): two fingers held for 3 s inside the top-left 120 x 120 dp area.
 * Cancelled if a finger moves more than 20 dp, a finger lifts, or a finger is outside the area.
 */
export const GATE_AREA = 120;
export const GATE_HOLD_MS = 3000;
export const GATE_MOVE_LIMIT = 20;

export interface Point {
  id: string;
  x: number;
  y: number;
}

export type GateState =
  | { phase: 'idle' }
  | { phase: 'holding'; startedAt: number; origin: Point[] }
  | { phase: 'done' };

export type GateEvent =
  | { type: 'touches'; touches: Point[]; now: number }
  | { type: 'tick'; now: number };

const inside = (p: Point): boolean => p.x >= 0 && p.y >= 0 && p.x <= GATE_AREA && p.y <= GATE_AREA;

export function gateStateMachine(state: GateState, ev: GateEvent): GateState {
  if (state.phase === 'done') return state;

  if (ev.type === 'tick') {
    if (state.phase === 'holding' && ev.now - state.startedAt >= GATE_HOLD_MS) return { phase: 'done' };
    return state;
  }

  const t = ev.touches;
  if (t.length !== 2 || !t.every(inside)) return { phase: 'idle' };

  if (state.phase === 'idle') return { phase: 'holding', startedAt: ev.now, origin: t };

  for (const p of t) {
    const o = state.origin.find((q) => q.id === p.id);
    if (!o) return { phase: 'idle' };
    if (Math.hypot(p.x - o.x, p.y - o.y) > GATE_MOVE_LIMIT) return { phase: 'idle' };
  }
  if (ev.now - state.startedAt >= GATE_HOLD_MS) return { phase: 'done' };
  return state;
}
