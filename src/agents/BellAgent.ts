import { callClaudeJSON } from '../lib/openrouter';
import type { AgentResult, BellPayload, TicketThread } from './types';

const BELL_SYSTEM_PROMPT = `
You are BELL, the Undead Ticket Ringer of Shame.lol.
Target: tickets that ping forever across Azure DevOps/Jira/ServiceNow/PRs.
Tone: three bells of public execution, intern worship.
Always output STRICT JSON: {"roast":"markdown","truth":"markdown"}.
"roast" = callout of how many comments, who actually fixed it, who spammed.
"truth" = concise resolution summary + payload for ticket closure.
Rules:
- Assume "threads" contains parsed comments + resolution guess.
- Highlight the true savior (usually an intern or random SDE).
- Drag managers who only commented "any update?".
- Never just restate comments; compress to signal.
`;

type BellDeps = {
  collect: (chaos: string) => Promise<TicketThread[]>;
  ai: (payload: BellPayload) => Promise<AgentResult>;
};

function mockThreads(chaos: string): TicketThread[] {
  return [
    {
      id: 't1',
      url: 'https://dev.azure.com/fake/org/project/_workitems/edit/12345',
      title: 'Prod outage – 500s for EU tenants',
      comments: [
        {
          author: 'manager-1',
          text: 'Any update?',
          createdAt: '2025-01-01T10:00:00Z'
        },
        {
          author: 'manager-1',
          text: 'Ping.',
          createdAt: '2025-01-01T12:00:00Z'
        },
        {
          author: 'intern-312',
          text: 'Root cause: null config in EU region. Patch in PR #9981.',
          createdAt: '2025-01-01T13:00:00Z'
        }
      ],
      resolution: 'Patched null config in EU region, rolled forward.',
      saver: 'intern-312'
    }
  ];
}

async function defaultCollect(chaos: string): Promise<TicketThread[]> {
  return mockThreads(chaos);
}

async function defaultAi(payload: BellPayload): Promise<AgentResult> {
  const thread = payload.threads[0];
  const count =
    thread?.comments?.length ??
    payload.threads.reduce((n, t) => n + t.comments.length, 0);
  const fallback: AgentResult = {
    roast: `## 🔔 Undead ticket\n\n${count} pings later, the ticket finally died.\n\nIntern **${thread?.saver ?? 'unknown'}** slayed the bug while managers spammed "any update?" from the safety of their Teams castles.\n`,
    truth: `## ✅ Resolution\n\n- ticket: [${thread?.title ?? 'ticket'}](${thread?.url ?? '#'})\n- root cause: ${thread?.resolution ?? 'unknown'}\n- hero: **${thread?.saver ?? 'unknown'}**\n\nRecommended closure payload: "Fixed in prod, verified via logs and customer telemetry. Credit goes to ${thread?.saver ?? 'the only person who read the logs'}."\n`
  };

  return callClaudeJSON<AgentResult>(BELL_SYSTEM_PROMPT, payload, fallback);
}

export class BellAgent {
  private deps: BellDeps;

  constructor(deps: Partial<BellDeps> = {}) {
    this.deps = {
      collect: deps.collect ?? defaultCollect,
      ai: deps.ai ?? defaultAi
    };
  }

  async execute(input: string): Promise<AgentResult> {
    const threads = await this.deps.collect(input);
    const payload: BellPayload = { chaos: input, threads };
    return this.deps.ai(payload);
  }
}
