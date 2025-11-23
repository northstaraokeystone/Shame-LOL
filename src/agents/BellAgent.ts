import type { ChaosInput, AgentResult } from './types';
import * as graphClient from '../lib/graphClient';
import { callOpenRouter } from '../lib/openrouter';

const CACHE_PREFIX = 'bell_';

type CommentItem = {
  id?: string;
  body?: {
    content?: string;
  };
  createdDateTime?: string;
  from?: {
    user?: {
      displayName?: string;
    };
  };
};

type GraphCommentsModule = {
  getComments?: (identifier: string) => Promise<unknown>;
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

function unwrapComments(raw: unknown): CommentItem[] {
  if (Array.isArray(raw)) {
    return raw as CommentItem[];
  }
  if (raw && typeof raw === 'object') {
    const record = raw as { value?: unknown };
    if (Array.isArray(record.value)) {
      return record.value as CommentItem[];
    }
  }
  return [];
}

async function fetchCommentsFromGraph(source: string): Promise<CommentItem[]> {
  try {
    const module = graphClient as GraphCommentsModule;
    if (!module.getComments) {
      return [];
    }
    const result = await module.getComments(source);
    return unwrapComments(result);
  } catch {
    return [];
  }
}

function createMockComments(ticketId: string): CommentItem[] {
  const base = ticketId.trim() || 'AZ-666666';
  const now = Date.now();
  const comments: CommentItem[] = [];

  for (let i = 1; i <= 400; i += 1) {
    const id = String(i);
    const isResolution = i === 312;
    const isManagerPing = !isResolution && i % 40 === 0;

    const displayName = isResolution
      ? 'Overworked Intern'
      : isManagerPing
      ? 'Manager asking "any update?"'
      : 'Random stakeholder';

    const content = isResolution
      ? 'Intern quietly fixed it in prod, wrote "resolved on call"; nobody read.'
      : isManagerPing
      ? '"Any update?" (sent from mobile, no context).'
      : 'Added another screenshot and tagged four teams.';

    comments.push({
      id,
      body: { content: `[${base}] ${content}` },
      createdDateTime: new Date(
        now - (400 - i) * 5 * 60 * 1000
      ).toISOString(),
      from: { user: { displayName } }
    });
  }

  return comments;
}

function normalizeReceipts(comments: CommentItem[]): string[] {
  const stamps = comments
    .map((c) => c.createdDateTime)
    .filter((stamp): stamp is string => Boolean(stamp));
  return Array.from(new Set(stamps));
}

export class BellAgent {
  constructor() {}

  async execute(input: ChaosInput): Promise<AgentResult> {
    const source = input.input.trim();

    if (!source) {
      return {
        roast:
          'The bell tolls for an empty ticket: 0 repro steps, 0 logs, 400 pings of pure anxiety.',
        truth: {
          resolution: 'No ticket, only Teams ghosts.',
          receipts: []
        }
      };
    }

    const cacheKey = `${CACHE_PREFIX}${hashString(source)}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }

    let comments = await fetchCommentsFromGraph(source);
    if (!comments.length) {
      comments = createMockComments(source);
    }

    const resolutionComment = comments.find((c) => c.id === '312');
    const resolutionText =
      resolutionComment?.body?.content ?? 'buried by intern who left';

    const summary = `Resolution from comment #312: ${resolutionText}. 400 pings wasted.`;

    const systemPrompt =
      'You are the Bell, tolling for Microsoft\'s undead tickets. Roast the 400-comment hell: resolution buried, close it forever. GoT style: executioner\'s mercy.';
    const userPrompt =
      comments
        .slice(-10)
        .map((c) => {
          const label = c.id ?? '?';
          const author =
            c.from?.user?.displayName ?? 'anonymous Teams ping';
          const content = c.body?.content ?? '';
          return `#${label} by ${author}: ${content}`;
        })
        .join('\n') || source;

    const { roast } = await callOpenRouter(systemPrompt, userPrompt);

    const receipts = normalizeReceipts(comments);

    const result: AgentResult = {
      roast,
      truth: {
        resolution: summary,
        receipts
      }
    };

    setCache(cacheKey, result);
    return result;
  }
}
