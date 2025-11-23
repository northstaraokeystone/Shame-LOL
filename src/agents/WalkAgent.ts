import type { ChaosInput, AgentResult } from './types';
import * as graphClient from '../lib/graphClient';
import { callOpenRouter } from '../lib/openrouter';

const CACHE_PREFIX = 'walk_';

type VersionItem = {
  id?: string;
  lastModifiedDateTime?: string;
  lastModifiedBy?: {
    user?: {
      displayName?: string;
    };
  };
  sizeDelta?: string | number;
};

type GraphVersionsModule = {
  getVersions?: (query: string) => Promise<unknown>;
};

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function isAgentResult(value: unknown): value is AgentResult {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as {
    roast?: unknown;
    truth?: { receipts?: unknown };
  };
  return (
    typeof record.roast === 'string' &&
    !!record.truth &&
    Array.isArray(record.truth.receipts)
  );
}

function getCache(key: string): AgentResult | null {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (isAgentResult(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function setCache(key: string, value: AgentResult): void {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function unwrapVersions(raw: unknown): VersionItem[] {
  if (Array.isArray(raw)) {
    return raw as VersionItem[];
  }
  if (raw && typeof raw === 'object') {
    const record = raw as { value?: unknown };
    if (Array.isArray(record.value)) {
      return record.value as VersionItem[];
    }
  }
  return [];
}

async function fetchVersions(source: string): Promise<VersionItem[]> {
  try {
    const module = graphClient as GraphVersionsModule;
    if (!module.getVersions) {
      return [];
    }
    const result = await module.getVersions(source);
    return unwrapVersions(result);
  } catch {
    return [];
  }
}

function createMockVersions(subject: string): VersionItem[] {
  const base = subject.trim() || 'Q3_Prd_Dark_Patterns.md';
  const now = Date.now();
  const actors = [
    'Legal',
    'Growth PM',
    'VP of Engagement',
    'Random Director',
    'Security'
  ];
  const deltas = [
    'Legal removed "no dark patterns" clause',
    'Growth PM added 3 extra nudges',
    'VP swapped "opt-in" for "pre-ticked box"',
    'Director inserted 4 review gates and 0 owners',
    'Security added one sentence nobody read'
  ];

  return actors.map((actor, index) => ({
    id: `${base}-v${index + 1}`,
    lastModifiedDateTime: new Date(
      now - (actors.length - index) * 60 * 60 * 1000
    ).toISOString(),
    lastModifiedBy: { user: { displayName: actor } },
    sizeDelta: deltas[index]
  }));
}

function buildDiffs(versions: VersionItem[]): { user: string; change: string }[] {
  const tail = versions.slice(-3);
  if (!tail.length) {
    return [];
  }

  return tail.map((v) => {
    const user =
      v.lastModifiedBy?.user?.displayName ?? 'anonymous PM in Redmond';
    let change: string;
    if (typeof v.sizeDelta === 'number') {
      change = `${v.sizeDelta} bytes of shame`;
    } else if (typeof v.sizeDelta === 'string') {
      change = v.sizeDelta;
    } else {
      change = 'ethics clause deleted';
    }
    return { user, change };
  });
}

export class WalkAgent {
  constructor() {}

  async execute(input: ChaosInput): Promise<AgentResult> {
    const source = input.input.trim();

    if (!source) {
      return {
        roast:
          'The Septa sees no PRD, only an empty Confluence page and a thousand unchecked boxes.',
        truth: {
          changes: [],
          receipts: []
        }
      };
    }

    const cacheKey = `${CACHE_PREFIX}${hashString(source)}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }

    let versions = await fetchVersions(source);
    if (!versions.length) {
      versions = createMockVersions(source);
    }

    const diffs = buildDiffs(versions);
    const systemPrompt = `You are the Septa, forcing Microsoft liars to walk naked. Roast changes: ${diffs.length} versions, blame the guilty. GoT style: brutal, sexual shame.`;
    const userPrompt =
      diffs
        .map((d) => `${d.user} walked: ${d.change}`)
        .join('\n') || source;

    const { roast } = await callOpenRouter(systemPrompt, userPrompt);

    const receipts = versions
      .map((v) => v.lastModifiedDateTime)
      .filter((value): value is string => typeof value === 'string');

    const result: AgentResult = {
      roast,
      truth: {
        changes: diffs.map((d) => `${d.user} walked: ${d.change}`),
        receipts
      }
    };

    setCache(cacheKey, result);
    return result;
  }
}
