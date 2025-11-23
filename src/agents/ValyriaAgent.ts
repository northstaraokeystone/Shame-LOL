import type { ChaosInput, AgentResult } from './types';
import * as graphClient from '../lib/graphClient';
import { callOpenRouter } from '../lib/openrouter';

const CACHE_PREFIX = 'valyria_';

type AnyFile = {
  name?: string;
  webUrl?: string;
  lastModifiedDateTime?: string;
  createdDateTime?: string;
  lastAccessedDateTime?: string;
  viewCount?: number;
};

type GraphClientModule = {
  searchFiles?: (query: string) => Promise<unknown>;
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
  const record = value as Record<string, unknown>;
  if (typeof record.roast !== 'string') {
    return false;
  }
  if (!record.truth || typeof record.truth !== 'object') {
    return false;
  }
  const truth = record.truth as Record<string, unknown>;
  if ('receipts' in truth && !Array.isArray(truth.receipts)) {
    return false;
  }
  return true;
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

function normalizeReceipts(files: AnyFile[]): string[] {
  const urls = files
    .map((file) => file.webUrl)
    .filter((url): url is string => Boolean(url));
  return Array.from(new Set(urls));
}

function scoreFile(file: AnyFile): number {
  const time =
    new Date(
      file.lastModifiedDateTime ??
        file.lastAccessedDateTime ??
        file.createdDateTime ??
        0
    ).getTime() || 0;
  const views = typeof file.viewCount === 'number' ? file.viewCount : 0;
  return time + views * 1000;
}

function pickCanonical(files: AnyFile[]): AnyFile | undefined {
  if (!files.length) {
    return undefined;
  }
  return [...files].sort((a, b) => scoreFile(b) - scoreFile(a))[0];
}

function createMockFiles(query: string): AnyFile[] {
  const trimmed = query.trim();
  const baseName = trimmed || 'Q3_STRATEGY_FINAL_v9.pptx';
  const stem = baseName.replace(/(\.\w+)?$/, '');
  const now = Date.now();
  const files: AnyFile[] = [
    {
      name: `${stem}.pptx`,
      webUrl:
        'https://sharepoint.microsoft.com/sites/shame/Shared%20Documents/Q3_STRATEGY_FINAL_v9.pptx',
      lastModifiedDateTime: new Date(now).toISOString(),
      viewCount: 42
    }
  ];
  for (let i = 0; i < 17; i += 1) {
    const name = `${stem}_COPY_${i + 1}.pptx`;
    files.push({
      name,
      webUrl: `https://sharepoint.microsoft.com/sites/shame/Shared%20Documents/${encodeURIComponent(
        name
      )}`,
      lastModifiedDateTime: new Date(
        now - (i + 1) * 60 * 60 * 1000
      ).toISOString(),
      viewCount: 1
    });
  }
  return files;
}

export class ValyriaAgent {
  async execute(input: ChaosInput): Promise<AgentResult> {
    const source = input.input;
    const cacheKey = `${CACHE_PREFIX}${hashString(source)}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }

    let files: AnyFile[] = [];

    try {
      const module = graphClient as GraphClientModule;
      if (module.searchFiles) {
        const result = await module.searchFiles(source);
        if (Array.isArray(result) && result.length > 0) {
          files = result as AnyFile[];
        }
      }
    } catch {
      files = [];
    }

    if (!files.length) {
      files = createMockFiles(source);
    }

    const canonical = pickCanonical(files);
    const dupes = files.filter((file) => file !== canonical);
    const dupeCount = dupes.length;
    const canonicalName = canonical?.name ?? 'Lost in OneDrive hell';

    const systemPrompt = `You are Valyria, dragon of truth. Roast Microsoft dupes: ${dupeCount} copies burn, this canonical survives: "${canonicalName}". GoT style: savage, hilarious.`;
    const userPrompt = source || canonicalName;

    const { roast } = await callOpenRouter(systemPrompt, userPrompt);

    const result: AgentResult = {
      roast,
      truth: {
        canonical: canonicalName,
        receipts: normalizeReceipts(files)
      }
    };

    setCache(cacheKey, result);
    return result;
  }
}
