import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import ShameButton from './components/ShameButton';

const HERO_IMAGE =
  'https://wallpaper-mania.com/wp-content/uploads/2018/09/1273633.jpg';

type AgentResult = {
  roast: string;
};

type MockShameState = {
  mutate: (input: string) => void;
  isLoading: boolean;
  data: AgentResult | null;
  error: Error | null;
};

function buildRoast(
  kind: 'deck' | 'prd' | 'ticket' | 'unknown',
  chaos: string
): string {
  const preview =
    chaos.length > 280 ? `${chaos.slice(0, 277).trimEnd()}…` : chaos.trim();

  const baseHeader = `# 🗡️ Shame.lol\n\n> Immutable public execution transcript\n\n## Chaos fed to the dragon\n\n\`\`\`text\n${preview || '<< empty chaos, like a SharePoint search result >>'}\n\`\`\`\n`;

  if (kind === 'deck') {
    return (
      baseHeader +
      `\n## 🔥 Valyria decrees\n\nThe North counted **17 duplicate decks** before the dragon got bored.\n\n- Canonical deck: \`Q3_STRATEGY_FINAL_v9.pptx\`\n- All earlier versions exiled to the recycle bin beyond the Wall.\n- Satya saw exactly one copy. You presented six.\n\n> _"Next time, rename it **final** only when the dragon signs off."_`
    );
  }

  if (kind === 'prd') {
    return (
      baseHeader +
      `\n## 🚶 Walk of PRD\n\nYour spec staggered through Redmond like Cersei on a Monday standup.\n\n- Legal quietly stripped the ethics section while pretending to read the diff.\n- A VP replaced every hard requirement with "nice to have".\n- The original author now denies ever having written this.\n\n> _"Every clause removed became another bell of shame."_`
    );
  }

  if (kind === 'ticket') {
    return (
      baseHeader +
      `\n## 🔔 Bell of Undead Tickets\n\nThis ticket survived **400 pings** and three re-orgs.\n\n- Managers commented "any update?" more times than lines of code were changed.\n- An intern identified the root cause in a single log line.\n- The ticket closure note still says: "monitoring in prod".\n\n> _"The intern should own the service. The rest can join the backlog of the dead."_`
    );
  }

  return (
    baseHeader +
    `\n## ❄️ Longclaw's judgment\n\nThe chaos you fed the dragon is so mixed even SharePoint search gave up.\n\n- Smells like a deck that became a PRD that became a ticket.\n- Every tool touched it, none of them own it.\n- Classic Microsoft: infinite process, zero single source of truth.\n\n> _"Longclaw suggests starting again, this time with one document and half as many PMs."_`
  );
}

function useMockShame(): MockShameState {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AgentResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mutate = (input: string) => {
    const chaos = input.trim();
    if (!chaos) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    setTimeout(() => {
      try {
        const lower = chaos.toLowerCase();
        let kind: 'deck' | 'prd' | 'ticket' | 'unknown' = 'unknown';

        if (lower.includes('deck') || lower.includes('.ppt')) {
          kind = 'deck';
        } else if (lower.includes('prd') || lower.includes('spec')) {
          kind = 'prd';
        } else if (
          lower.includes('ticket') ||
          lower.includes('dev.azure') ||
          lower.includes('jira') ||
          lower.includes('servicenow')
        ) {
          kind = 'ticket';
        }

        const roast = buildRoast(kind, chaos);
        setData({ roast });
      } catch (err) {
        const safeError =
          err instanceof Error
            ? err
            : new Error('Dragon choked on a mysterious mock error.');
        setError(safeError);
      } finally {
        setIsLoading(false);
      }
    }, 2000);
  };

  return { mutate, isLoading, data, error };
}

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [bellsRung, setBellsRung] = useState(0);

  const { mutate, isLoading, data, error } = useMockShame();

  useEffect(() => {
    if (data?.roast) {
      setResult(data.roast);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      setResult(error.message || 'Dragon slept instead of roasting.');
    }
  }, [error]);

  useEffect(() => {
    setBellsRung(isLoading ? 3 : 0);
  }, [isLoading]);

  const handleShame = () => {
    const chaos = input.trim();
    if (!chaos || isLoading) return;
    setResult('');
    mutate(chaos);
  };

  const handleDownload = () => {
    if (!result.trim()) return;

    const blob = new Blob([result], {
      type: 'text/markdown;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shame-${Date.now()}.shame.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasResult = result.trim().length > 0;
  const disabled = !input.trim() || isLoading;

  return (
    <div className="min-h-screen bg-black text-red-50 flex">
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 md:py-16 space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-red-900/70 shadow-[0_0_120px_rgba(220,38,38,0.55)]">
          <img
            src={HERO_IMAGE}
            alt="Jon Snow facing a dragon"
            className="w-full h-64 md:h-80 lg:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center space-y-3 px-4">
            <div className="flex items-center gap-2 text-xs md:text-sm tracking-[0.35em] uppercase text-red-200/80">
              <Flame className="w-4 h-4 text-red-400" />
              <span>the north remembers</span>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif tracking-[0.35em] text-red-500 drop-shadow-[0_0_40px_rgba(248,113,113,0.9)]">
              SHAME
            </h1>
            <p className="text-lg md:text-2xl text-red-100/80 text-center max-w-3xl">
              trinity swarm dragons that publicly execute your microsoft decks,
              prds, and undead tickets.
            </p>
          </div>
        </section>

        <section className="space-y-6 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(event.target.value)
            }
            placeholder="Paste the deck link, PRD fragment, or undead ticket thread here for public execution…"
            className="w-full h-64 md:h-80 rounded-2xl bg-gray-900 border border-gray-700 px-5 py-4 text-base md:text-lg text-red-50 placeholder:text-red-400/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500/80 shadow-[0_0_60px_rgba(0,0,0,0.9)]"
          />

          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center justify-center gap-12 md:gap-16 text-6xl md:text-7xl lg:text-8xl">
              {[0, 1, 2].map(index => (
                <motion.span
                  key={index}
                  className="text-yellow-300 drop-shadow-[0_0_25px_rgba(250,204,21,0.95)]"
                  animate={
                    bellsRung > index
                      ? { scale: [1, 1.25, 1], rotate: [-12, 12, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{
                    duration: 0.45,
                    repeat: bellsRung > index ? Infinity : 0,
                    ease: 'easeInOut',
                    delay: index * 0.12
                  }}
                >
                  🔔
                </motion.span>
              ))}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-5">
              <ShameButton onClick={handleShame} disabled={disabled} />
              {isLoading && (
                <div className="text-3xl md:text-4xl text-red-400/90 animate-pulse text-center">
                  dragon roars…
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm md:text-base text-red-200/80">
              public execution log · immutable markdown built for maximum teams
              shame.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!hasResult}
              className="flex items-center gap-2 px-5 md:px-6 py-2 rounded-xl bg-red-900 hover:bg-red-800 disabled:bg-red-950/80 disabled:text-red-400/60 text-lg md:text-2xl font-semibold border border-red-400/70 shadow-[0_0_40px_rgba(185,28,28,0.8)] transition-colors"
            >
              download .shame
            </button>
          </div>

          <pre className="w-full bg-gray-900 border border-red-900/80 rounded-2xl px-6 md:px-10 py-6 md:py-10 text-sm md:text-lg font-serif whitespace-pre-wrap leading-relaxed text-red-100/90 shadow-[0_0_80px_rgba(0,0,0,1)]">
            {hasResult
              ? result
              : 'Awaiting your chaos. The dragon is hungry.'}
          </pre>
        </section>
      </main>
    </div>
  );
};

export default App;
