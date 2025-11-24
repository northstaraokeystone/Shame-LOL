import { describe, it, expect, vi } from 'vitest';
import type { ChaosInput } from '../src/agents/types';
import { BellAgent } from '../src/agents/BellAgent';

type MockComment = {
  id: string;
  ticketId: string;
  author: string;
  createdDateTime: string;
  text: string;
};

const MOCK_COMMENTS: MockComment[] = [
  {
    id: 'c1',
    ticketId: 'AZ-69420',
    author: 'manager-1',
    createdDateTime: '2025-02-01T09:00:00Z',
    text: 'Any update? Customer is asking.'
  },
  {
    id: 'c2',
    ticketId: 'AZ-69420',
    author: 'manager-1',
    createdDateTime: '2025-02-01T11:00:00Z',
    text: 'Ping.'
  },
  {
    id: 'c312',
    ticketId: 'AZ-69420',
    author: 'intern-312',
    createdDateTime: '2025-02-01T13:03:00Z',
    text: 'Comment #312 by intern: fixed null region bug in AZ-69420 by correcting shard config.'
  },
  {
    id: 'c400',
    ticketId: 'AZ-69420',
    author: 'manager-2',
    createdDateTime: '2025-02-02T08:00:00Z',
    text: 'Closing after 400 pings and 24h of "monitoring in prod".'
  }
];

const getCommentsMock = vi.fn(
  async (_ticketId: string): Promise<MockComment[]> => MOCK_COMMENTS
);

const callOpenRouterMock = vi.fn(
  async (): Promise<{ roast: string }> => ({
    roast:
      '400 pings wasted before the intern wrote comment #312 and saved your ticket.'
  })
);

vi.mock('../src/lib/graphClient', () => ({
  GraphClient: vi.fn().mockImplementation(() => ({
    getComments: getCommentsMock
  }))
}));

vi.mock('../src/lib/openrouter', () => ({
  callOpenRouter: callOpenRouterMock
}));

describe('BellAgent', () => {
  it('extracts buried resolution from ticket thread', async () => {
    getCommentsMock.mockClear();
    callOpenRouterMock.mockClear();

    const agent = new BellAgent();
    const input: ChaosInput = { input: 'AZ-69420 ticket' };

    const result = (await agent.execute(input)) as any;

    expect(result).toBeTruthy();
    expect(result.truth).toBeDefined();

    const resolutionText = String(result.truth.resolution ?? '');
    expect(resolutionText.toLowerCase()).toContain('comment #312');
    expect(resolutionText.toLowerCase()).toContain('intern');

    expect(String(result.roast)).toContain('400 pings');
    expect(getCommentsMock).toHaveBeenCalledTimes(1);
    expect(callOpenRouterMock).toHaveBeenCalledTimes(1);
  });

  it('caches comments so repeated runs reuse thread', async () => {
    getCommentsMock.mockClear();

    const agent = new BellAgent();
    const input: ChaosInput = { input: 'AZ-69420 ticket' };

    await agent.execute(input);
    await agent.execute(input);

    expect(getCommentsMock).toHaveBeenCalledTimes(1);
  });
});
