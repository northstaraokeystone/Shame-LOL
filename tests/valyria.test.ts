// @ts-ignore - vitest runtime provides these imports; TS types are optional here
import { describe, it, expect, vi } from 'vitest';
import type { ChaosInput } from '../src/agents/types';
import { ValyriaAgent } from '../src/agents/ValyriaAgent';

type MockDeck = {
  id: string;
  name: string;
  path: string;
  lastModifiedDateTime: string;
  views: number;
  webUrl: string;
};

const MOCK_DECKS: MockDeck[] = Array.from({ length: 17 }, (_, index) => {
  const n = index + 1;
  const isCanonical = n === 17;

  return {
    id: `deck-${n}`,
    name: isCanonical
      ? 'v1.7 - Satya approved'
      : `Q4 strategy v1.${n}.pptx`,
    path: isCanonical
      ? '/LT/Executive/Strategy/'
      : `/Teams/DeckGraveyard/v${n}/`,
    lastModifiedDateTime: new Date(
      2025,
      0,
      isCanonical ? 31 : n
    ).toISOString(),
    views: isCanonical ? 999 : n,
    webUrl: `https://contoso.sharepoint.com/decks/q4-strategy-v${n}`
  };
});

const searchFilesMock = vi.fn(
  async (_query: string): Promise<MockDeck[]> => MOCK_DECKS
);

vi.mock('../src/lib/graphClient', () => {
  class GraphClientMock {
    async searchFiles(query: string): Promise<MockDeck[]> {
      return searchFilesMock(query);
    }
  }

  return {
    GraphClient: GraphClientMock
  };
});

const callOpenRouterMock = vi.fn(
  async (): Promise<{ roast: string }> => ({
    roast:
      'The North remembers your 17 copies. 17 copies burn, Satya saw this one.'
  })
);

vi.mock('../src/lib/openrouter', () => ({
  callOpenRouter: callOpenRouterMock
}));

describe('ValyriaAgent', () => {
  it('finds canonical deck from dupes', async () => {
    searchFilesMock.mockClear();
    callOpenRouterMock.mockClear();

    const agent = new ValyriaAgent();
    const input: ChaosInput = { input: 'Q4 deck chaos' };

    const result = await agent.execute(input);

    expect((result as any).truth).toBeDefined();
    expect((result as any).truth.canonical).toBe('v1.7 - Satya approved');
    expect((result as any).roast).toContain('17 copies burn');

    expect(searchFilesMock).toHaveBeenCalledTimes(1);
    expect(callOpenRouterMock).toHaveBeenCalledTimes(1);
  });

  it('caches search so duplicate chaos does not re-hit graph', async () => {
    searchFilesMock.mockClear();

    const agent = new ValyriaAgent();
    const input: ChaosInput = { input: 'Q4 deck chaos' };

    await agent.execute(input);
    await agent.execute(input);

    expect(searchFilesMock).toHaveBeenCalledTimes(1);
  });
});
