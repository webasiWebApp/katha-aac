import { on, emit, resetBus } from '../bus';

beforeEach(() => {
  resetBus();
});

test('handler receives emitted payload', async () => {
  const received: unknown[] = [];
  on('session_started', async (e) => { received.push(e); });

  await emit({ type: 'session_started', setting: 'home' });

  expect(received).toHaveLength(1);
  expect((received[0] as { setting: string }).setting).toBe('home');
});

test('multiple handlers run in registration order', async () => {
  const order: number[] = [];
  on('break_started', async () => { order.push(1); });
  on('break_started', async () => { order.push(2); });
  on('break_started', async () => { order.push(3); });

  await emit({ type: 'break_started' });

  expect(order).toEqual([1, 2, 3]);
});

test('a throwing handler does not prevent subsequent handlers from running', async () => {
  const ran: string[] = [];

  on('break_ended', async () => { ran.push('before'); throw new Error('boom'); });
  on('break_ended', async () => { ran.push('after'); });

  await expect(emit({ type: 'break_ended', durationMs: 5000 })).resolves.toBeUndefined();
  expect(ran).toEqual(['before', 'after']);
});

test('unsubscribe removes the handler', async () => {
  const calls: number[] = [];
  const unsub = on('message_replayed', async () => { calls.push(1); });

  unsub();
  await emit({ type: 'message_replayed', messageId: 'msg-1' });

  expect(calls).toHaveLength(0);
});

test('handlers for different event types do not interfere', async () => {
  const startRan: boolean[] = [];
  const endRan: boolean[] = [];

  on('session_started', async () => { startRan.push(true); });
  on('session_ended', async () => { endRan.push(true); });

  await emit({ type: 'session_started', setting: 'unknown' });

  expect(startRan).toHaveLength(1);
  expect(endRan).toHaveLength(0);
});

test('intent_answered bus-only event works', async () => {
  let received = false;
  on('intent_answered', async (e) => { received = e.answer; });

  await emit({ type: 'intent_answered', messageId: 'm1', answer: true });

  expect(received).toBe(true);
});
