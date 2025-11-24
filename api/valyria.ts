import { describe, it, expect, vi } from 'vitest';
import type { ChaosInput } from '../src/agents/types';
import { ValyriaAgent } from '../src/agents/ValyriaAgent';

type Deck = {
  id: string;
  name: string;
  path: string;
  lastModifiedDateTime: string;
  views: number;
  webUrl: string;
};

type ValyriaResult = {
  truth?: {
    canonical?: { name?: string } | string;
  };
  roast?: string;
};

const TOTAL_DECKS = 17;
const CANONICAL_DECK_INDEX = TOTAL_DECKS;
const CANONICAL_DECK_NAME = 'v1.7 - Satya approved';
const CANONICAL_DECK_VIEWS = 777;

const MOCK_DECKS: Deck[] = Array.from({ length: TOTAL_DECKS }, (_, index) => {
  const n = index + 1;
  const isCanonical = n === CANONICAL_DECK_INDEX;

  return {
    id: `deck-${n}`,
    name: isCanonical ? CANONICAL_DECK_NAME : `Q4_strategy_copy_${n}.pptx`,
    path: `/Teams/DeckGraveyard/${n}/`,
    lastModifiedDateTime: new Date(2025, 5, n).toISOString(),
    views: isCanonical ? CANONICAL_DECK_VIEWS : n,
    webUrl: `https://contoso.sharepoint.com/decks/q4-v${n}`
  };
});

const searchFilesMock = vi.fn<
  [query: string],
  Promise<Deck[]>
>();

const callOpenRouterMock = vi.fn<
  [systemPrompt: string, userInput: string],
  Promise<{ roast: string }>
>();

vi.mock('../src/lib/graphClient', () => ({
  __esModule: true,
  GraphClient: vi.fn().mockImplementation(() => ({
    searchFiles: searchFilesMock
  }))
}));

vi.mock('../src/lib/openrouter', () => ({
  __esModule: true,
  callOpenRouter: callOpenRouterMock
}));

describe('ValyriaAgent', () => {
  it('finds canonical deck from dupes', async () => {
    searchFilesMock.mockResolvedValue(MOCK_DECKS);
    callOpenRouterMock.mockResolvedValue({
      roast:
        'The North counted 17 copies. 17 copies burn while Satya only saw the canonical deck.'
    });

    const agent = new ValyriaAgent();
    const input: ChaosInput = { input: 'Q4 deck' };

    const result = (await agent.execute(input)) as ValyriaResult;

    expect(result).toBeTruthy();
    expect(result.truth).toBeDefined();

    const canonical = result.truth?.canonical;
    const canonicalName =
      typeof canonical === 'string' ? canonical : canonical?.name ?? '';

    expect(canonicalName).toContain(CANONICAL_DECK_NAME);
    expect(result.roast ?? '').toContain(`${TOTAL_DECKS} copies`);
    expect(searchFilesMock).toHaveBeenCalledTimes(1);
    expect(callOpenRouterMock).toHaveBeenCalledTimes(1);
  });

  it('caches search so subsequent calls reuse results', async () => {
    searchFilesMock.mockResolvedValue(MOCK_DECKS);
    callOpenRouterMock.mockResolvedValue({
      roast: 'Cached roast for duplicated decks.'
    });

    const agent = new ValyriaAgent();
    const input: ChaosInput = { input: 'Q4 deck' };

    await agent.execute(input);
    await agent.execute(input);

    expect(searchFilesMock).toHaveBeenCalledTimes(1);
  });
});
