/**
 * T-014 acceptance test: error inside child renders fallback and writes one error_log row.
 */
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderThemed } from '@/core/theme/testUtils';
import { openDatabase, resetDatabase } from '../../db/__mocks__/sqliteMemory';
import { runMigrations } from '../../db/migrate';
import { initErrorLog } from '../errorLog';
import { ErrorBoundary } from '../ErrorBoundary';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function Bomb(): React.ReactElement {
  throw new Error('intentional test error');
}

// Silence React's console.error output during throw tests.
let origConsoleError: typeof console.error;
beforeAll(() => {
  origConsoleError = console.error;
  console.error = () => {};
});
afterAll(() => {
  console.error = origConsoleError;
});

let db: ReturnType<typeof openDatabase>;

beforeEach(async () => {
  resetDatabase();
  db = openDatabase(':memory:');
  await runMigrations(db, []);
  initErrorLog(db, '1.0.0');
});

test('renders children when no error', async () => {
  const { getByText } = await renderThemed(<Wrapper><Text>OK</Text></Wrapper>);
  expect(getByText('OK')).toBeTruthy();
});

test('renders fallback when child throws', async () => {
  const { getByText, getByRole } = await renderThemed(<Wrapper><Bomb /></Wrapper>);
  expect(getByText(/Something went wrong/)).toBeTruthy();
  expect(getByRole('button', { name: /Try again/i })).toBeTruthy();
});

test('writes one row to error_log when child throws', async () => {
  await renderThemed(<Wrapper><Bomb /></Wrapper>);

  const rows = db.all<{ code: string; area: string }>('SELECT * FROM error_log');
  expect(rows).toHaveLength(1);
  expect(rows[0]?.area).toBe('ErrorBoundary');
  expect(rows[0]?.code).toBe('unhandled_component_error');
});

test('retry button clears error state', async () => {
  let shouldThrow = true;

  function MaybeThrow() {
    if (shouldThrow) throw new Error('boom');
    return <Text>Recovered</Text>;
  }

  const { getByText, getByRole } = await renderThemed(<Wrapper><MaybeThrow /></Wrapper>);
  expect(getByText(/Something went wrong/)).toBeTruthy();

  shouldThrow = false;
  fireEvent.press(getByRole('button', { name: /Try again/i }));
  await waitFor(() => expect(getByText('Recovered')).toBeTruthy());
});
