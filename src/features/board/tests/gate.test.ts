import { gateStateMachine, type GateState, type Point } from '../domain/gateStateMachine';

const two = (dx = 0): Point[] => [
  { id: 'a', x: 30 + dx, y: 30 },
  { id: 'b', x: 70 + dx, y: 40 },
];
const idle: GateState = { phase: 'idle' };

describe('gateStateMachine', () => {
  it('two fingers inside the area start holding; 3 s completes', () => {
    let s = gateStateMachine(idle, { type: 'touches', touches: two(), now: 0 });
    expect(s.phase).toBe('holding');
    s = gateStateMachine(s, { type: 'tick', now: 2999 });
    expect(s.phase).toBe('holding');
    s = gateStateMachine(s, { type: 'tick', now: 3000 });
    expect(s.phase).toBe('done');
  });
  it('one finger or three fingers never start', () => {
    expect(gateStateMachine(idle, { type: 'touches', touches: [two()[0]!], now: 0 }).phase).toBe('idle');
    expect(gateStateMachine(idle, { type: 'touches', touches: [...two(), { id: 'c', x: 5, y: 5 }], now: 0 }).phase).toBe('idle');
  });
  it('a finger outside the 120 dp area does not start', () => {
    expect(gateStateMachine(idle, { type: 'touches', touches: [{ id: 'a', x: 10, y: 10 }, { id: 'b', x: 150, y: 10 }], now: 0 }).phase).toBe('idle');
  });
  it('cancels when a finger lifts', () => {
    let s = gateStateMachine(idle, { type: 'touches', touches: two(), now: 0 });
    s = gateStateMachine(s, { type: 'touches', touches: [two()[0]!], now: 500 });
    expect(s.phase).toBe('idle');
  });
  it('cancels when a finger moves more than 20 dp, tolerates smaller moves', () => {
    const s = gateStateMachine(idle, { type: 'touches', touches: two(), now: 0 });
    expect(gateStateMachine(s, { type: 'touches', touches: two(15), now: 100 }).phase).toBe('holding');
    expect(gateStateMachine(s, { type: 'touches', touches: two(25), now: 100 }).phase).toBe('idle');
  });
  it('a move event after 3 s also completes', () => {
    const s = gateStateMachine(idle, { type: 'touches', touches: two(), now: 0 });
    expect(gateStateMachine(s, { type: 'touches', touches: two(2), now: 3100 }).phase).toBe('done');
  });
  it('done is terminal', () => {
    expect(gateStateMachine({ phase: 'done' }, { type: 'touches', touches: [], now: 0 }).phase).toBe('done');
  });
});
