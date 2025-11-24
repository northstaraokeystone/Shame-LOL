import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChaosInput } from '../src/agents/types';
import { LongclawOrchestrator } from '../src/agents/LongclawOrchestrator';

// Mocks for the three dragons
const valyriaExecuteMock = vi.fn(async () => ({
  roast: 'Deck dragon: SHAME. SHAME. SHAME.',
  truth: {
    canonical: 'v1.7 - Satya approved'
  }
}));

const walkExecuteMock = vi.fn(async () => ({
  roast: 'PRD dragon: Legal walked naked deleting ethics.',
  truth: {
    changes: 'Legal walked naked deleting ethics and punting to version graveyard.'
  }
}));

const bellExecuteMock = vi.fn(async () => ({
  roast: 'Ticket dragon: 400 pings wasted before intern #312 saved you.',
  truth: {
    resolution: 'Buried resolution in comment #312 by intern #312.'
  }
}));

// Wire mocks into agent classes
vi.mock('../src/agents/ValyriaAgent', () => ({
  ValyriaAgent: vi.fn().mockImplementation(() => ({
    execute: valyriaExecuteMock
  }))
}));

vi.mock('../src/agents/WalkAgent', () => ({
  WalkAgent: vi.fn().mockImplementation(() => ({
    execute: walkExecuteMock
  }))
}));

vi.mock('../src/agents/BellAgent', () => ({
  BellAgent: vi.fn().mockImplementation(() => ({
    execute: bellExecuteMock
  }))
}));

// Final Claude fusion mock (if orchestrator calls it)
const callOpenRouterMock = vi.fn(async () => ({
  roast: 'Longclaw fused the three dragons into one public execution.'
}));

vi.mock('../src/lib/openrouter', () => ({
  callOpenRouter: callOpenRouterMock
}));

beforeEach(() => {
  vi.clearAllMocks();

  const globalAny = globalThis as any;

  if (!globalAny.localStorage) {
    const store: Record<string, string> = {};

    globalAny.localStorage = {
      getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(store, key)
          ? store[key]
          : null;
      },
      setItem(key: string, value: string): void {
        store[key] = String(value);
      },
      removeItem(key: string): void {
        delete store[key];
      },
      clear(): void {
        Object.keys(store).forEach(existingKey => {
          delete store[existingKey];
        });
      },
      key(index: number): string | null {
        return Object.keys(store)[index] ?? null;
      },
      get length(): number {
        return Object.keys(store).length;
      }
    };
  } else {
    globalAny.localStorage.clear();
  }
});

describe('LongclawOrchestrator', () => {
  it('detects deck chaos and fuses Valyria result', async () => {
    const orchestrator = new LongclawOrchestrator();
    const input: ChaosInput = { input: 'Q4 deck chaos for the LT' };

    const result = (await orchestrator.execute(input)) as any;

    expect(result).toBeTruthy();
    expect(result.truth).toBeDefined();
    expect(result.truth.canonical).toBe('v1.7 - Satya approved');
    expect(String(result.roast)).toContain('SHAME. SHAME. SHAME.');

    expect(valyriaExecuteMock).toHaveBeenCalledTimes(1);
    expect(walkExecuteMock).not.toHaveBeenCalled();
    expect(bellExecuteMock).not.toHaveBeenCalled();
  });

  it('fuses PRD and ticket chaos correctly', async () => {
    const orchestrator = new LongclawOrchestrator();

    const prdInput: ChaosInput = { input: 'PRD ethics clause for review' };
    const ticketInput: ChaosInput = { input: 'AZ-69420 ticket thread' };

    const prdResult = (await orchestrator.execute(prdInput)) as any;
    const ticketResult = (await orchestrator.execute(ticketInput)) as any;

    expect(prdResult.truth).toBeDefined();
    expect(String(prdResult.truth.changes ?? '')).toContain(
      'Legal walked naked deleting ethics'
    );
    expect(String(prdResult.roast ?? '')).toContain('Legal walked naked');

    expect(ticketResult.truth).toBeDefined();
    expect(String(ticketResult.truth.resolution ?? '')).toContain(
      'comment #312'
    );
    expect(String(ticketResult.roast ?? '')).toContain('400 pings');

    expect(walkExecuteMock).toHaveBeenCalledTimes(1);
    expect(bellExecuteMock).toHaveBeenCalledTimes(1);
  });

  it('caches full execution so repeated deck chaos does not re-run agents', async () => {
    const orchestrator = new LongclawOrchestrator();
    const input: ChaosInput = { input: 'Q4 deck chaos for the LT' };

    await orchestrator.execute(input);
    await orchestrator.execute(input);

    expect(valyriaExecuteMock).toHaveBeenCalledTimes(1);
  });
});
