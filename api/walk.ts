import { describe, it, expect, vi } from 'vitest';
import type { ChaosInput } from '../src/agents/types';
import { WalkAgent } from '../src/agents/WalkAgent';

type MockVersion = {
  id: string;
  itemId: string;
  lastModifiedDateTime: string;
  editor: string;
  changeSummary: string;
};

const MOCK_VERSIONS: MockVersion[] = [
  {
    id: 'v1',
    itemId: 'prd-ethics',
    lastModifiedDateTime: '2025-01-01T10:00:00Z',
    editor: 'pm-original',
    changeSummary:
      'Initial PRD with strict ethics + explicit consent and hard launch gates.'
  },
  {
    id: 'v2',
    itemId: 'prd-ethics',
    lastModifiedDateTime: '2025-01-03T12:30:00Z',
    editor: 'legal-1',
    changeSummary:
      'Legal walked naked through the PRD deleting the ethics clause and softening telemetry language.'
  },
  {
    id: 'v3',
    itemId: 'prd-ethics',
    lastModifiedDateTime: '2025-01-05T09:15:00Z',
    editor: 'vp-delivery',
    changeSummary:
      'VP converted all MUST requirements to SHOULD and punted ethics review to post-GA version graveyard.'
  }
];

const getVersionsMock = vi.fn(
  async (_itemId: string): Promise<MockVersion[]> => MOCK_VERSIONS
);

vi.mock('../src/lib/graphClient', () => {
  class GraphClientMock {
    // eslint-disable-next-line class-methods-use-this
    async getVersions(itemId: string): Promise<MockVersion[]> {
      return getVersionsMock(itemId);
    }

    // eslint-disable-next-line class-methods-use-this
    async searchFiles(): Promise<[]> {
      return [];
    }

    // eslint-disable-next-line class-methods-use-this
    async getComments(): Promise<[]> {
      return [];
    }
  }

  return { GraphClient: GraphClientMock };
});

const callOpenRouterMock = vi.fn(
  async (): Promise<{ roast: string }> => ({
    roast:
      'Legal walked naked deleting ethics, leaving a version graveyard the Seven would refuse to audit.'
  })
);

vi.mock('../src/lib/openrouter', () => ({
  callOpenRouter: callOpenRouterMock
}));

describe('WalkAgent', () => {
  it('builds change tree and blames deletions', async () => {
    getVersionsMock.mockClear();
    callOpenRouterMock.mockClear();

    const agent = new WalkAgent();
    const input: ChaosInput = { input: 'PRD ethics clause' };

    const result = (await agent.execute(input)) as any;

    expect(result).toBeTruthy();
    expect(result.truth).toBeDefined();

    const changesText = String(result.truth.changes ?? '');
    expect(changesText).toContain('Legal walked naked');
    expect(result.roast).toContain('version graveyard');

    expect(getVersionsMock).toHaveBeenCalledTimes(1);
    expect(callOpenRouterMock).toHaveBeenCalledTimes(1);
  });

  it('caches versions so repeated runs reuse change tree', async () => {
    getVersionsMock.mockClear();

    const agent = new WalkAgent();
    const input: ChaosInput = { input: 'PRD ethics clause' };

    await agent.execute(input);
    await agent.execute(input);

    expect(getVersionsMock).toHaveBeenCalledTimes(1);
  });
});
