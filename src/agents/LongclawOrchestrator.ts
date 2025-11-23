import type { ChaosInput, AgentResult, TruthOutput } from './types';
import { ValyriaAgent } from './ValyriaAgent';
import { WalkAgent } from './WalkAgent';
import { BellAgent } from './BellAgent';
import { callOpenRouter } from '../lib/openrouter';

const CACHE_PREFIX = 'longclaw_';

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

function detectType(input: ChaosInput): 'deck' | 'prd' | 'ticket' {
  if (input.type) {
    return input.type;
  }
  const lower = input.input.toLowerCase();
  if (lower.includes('deck') || lower.includes('.ppt')) {
    return 'deck';
  }
  if (lower.includes('prd') || lower.includes('spec')) {
    return 'prd';
  }
  return 'ticket';
}

export class LongclawOrchestrator {
  private readonly valyria: ValyriaAgent;
  private readonly walk: WalkAgent;
  private readonly bell: BellAgent;

  constructor() {
    this.valyria = new ValyriaAgent();
    this.walk = new WalkAgent();
    this.bell = new BellAgent();
  }

  async execute(input: ChaosInput): Promise<AgentResult> {
    const source = input.input.trim();

    if (!source) {
      return {
        roast:
          'Longclaw finds no chaos to cut, only an empty SharePoint page and a thousand pending approvals.',
        truth: {
          canonical: '',
          changes: [],
          resolution: '',
          receipts: []
        }
      };
    }

    const cacheKey = `${CACHE_PREFIX}${hashString(source)}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const kind = detectType(input);

    let roast = '';
    const truth: TruthOutput = {
      canonical: '',
      changes: [],
      resolution: '',
      receipts: []
    };

    if (kind === 'deck') {
      const v = await this.valyria.execute(input);
      roast += v.roast;
      truth.canonical = v.truth.canonical;
      truth.receipts = v.truth.receipts;
    } else if (kind === 'prd') {
      const w = await this.walk.execute(input);
      roast += w.roast;
      truth.changes = w.truth.changes;
      truth.receipts = w.truth.receipts;
    } else {
      const b = await this.bell.execute(input);
      roast += b.roast;
      truth.resolution = b.truth.resolution;
      truth.receipts = b.truth.receipts;
    }

    const canonical = truth.canonical ?? '';
    const changesText = (truth.changes ?? []).join(', ');
    const resolution = truth.resolution ?? '';

    const fusionPrompt = `You are Longclaw, Jon Snow's sword. Fuse the bells' truths into one immutable artifact. Roast the full chaos: SHAME. SHAME. SHAME. Valyria: ${canonical}, Walk: ${changesText}, Bell: ${resolution}. GoT style: final cut, perfect hair.`;

    const { roast: finalRoast } = await callOpenRouter(fusionPrompt, source);

    const combinedRoast = roast
      ? `${roast}\n\n${finalRoast}`
      : finalRoast;

    const result: AgentResult = {
      roast: combinedRoast,
      truth
    };

    setCache(cacheKey, result);
    return result;
  }
}
