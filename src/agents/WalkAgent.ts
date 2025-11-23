import { callClaudeJSON } from '../lib/openrouter';
import type { AgentResult, WalkChange, WalkPayload } from './types';

const WALK_SYSTEM_PROMPT = `
You are WALK, the Product Walker of Shame.lol.
Target: PRD fragments that mutated across Word/Teams/PDF/email.
Tone: Game of Thrones walk-of-atonement.
Always output STRICT JSON: {"roast":"markdown","truth":"markdown"}.
"roast" = narrate how clauses were deleted, watered down, or approved.
"truth" = change tree with who deleted/approved what, in markdown.
Rules:
- Treat each "change" as a branch in the PRD timeline.
- Call out Legal and random execs by role ("Legal", "VP", "PM").
- Blame deletions explicitly: "X walked naked deleting Y".
- Never echo the raw fragment, summarize it.
`;

type WalkDeps = {
  collect: (chaos: string) => Promise<WalkChange[]>;
  ai: (payload: WalkPayload) => Promise<AgentResult>;
};

function mockChanges(chaos: string): WalkChange[] {
  return [
    {
      id: 'c1',
      title: 'Ethics clause',
      before: 'Product must not track employees outside working hours.',
      after: 'Product may collect telemetry to improve experience.',
      deletedBy: 'legal-1',
      approver: 'vp-ethics'
    },
    {
      id: 'c2',
      title: 'Rollout gate',
      before: 'Launch blocked until DP0 signoff.',
      after: 'Signoff recommended, not required.',
      deletedBy: 'pm-42',
      approver: 'gm-north'
    }
  ];
}

async function defaultCollect(chaos: string): Promise<WalkChange[]> {
  return mockChanges(chaos);
}

async function defaultAi(payload: WalkPayload): Promise<AgentResult> {
  const fallback: AgentResult = {
    roast: `## 🚶 Walk of PRD\n\nYour PRD staggered through Redmond like Cersei on a Tuesday.\n\n- **${payload.changes.length} critical clauses** were shaved off while everyone pretended to read the Word diff.\n- Legal walked naked deleting ethics, PMs tossed guardrails to the crowd.\n`,
    truth: `## 🧬 Change tree\n\n${payload.changes
      .map(
        c =>
          `- **${c.title}**\n  - before: ${c.before}\n  - after: ${c.after}\n  - deleted by: ${c.deletedBy ?? 'unknown'}\n  - approved by: ${c.approver ?? 'unknown'}`
      )
      .join('\n')}\n`
  };

  return callClaudeJSON<AgentResult>(WALK_SYSTEM_PROMPT, payload, fallback);
}

export class WalkAgent {
  private deps: WalkDeps;

  constructor(deps: Partial<WalkDeps> = {}) {
    this.deps = {
      collect: deps.collect ?? defaultCollect,
      ai: deps.ai ?? defaultAi
    };
  }

  async execute(input: string): Promise<AgentResult> {
    const changes = await this.deps.collect(input);
    const payload: WalkPayload = { chaos: input, changes };
    return this.deps.ai(payload);
  }
}
