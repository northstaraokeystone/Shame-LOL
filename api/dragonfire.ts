const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

type SwarmRequestBody = {
  target?: string;
  mode?: string;
  swarmSize?: number;
};

type OpenRouterContent =
  | string
  | { type?: string; text?: string | null | undefined }[];

type OpenRouterChoice = {
  message?: {
    content?: OpenRouterContent | null;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

type GlyphPayload = {
  roast: string;
  target: string;
  timestamp: number;
  divergence: number;
};

type GlyphResult = {
  url: string;
  payload: GlyphPayload;
};

function getServerApiKey(): string | undefined {
  const env =
    (globalThis as unknown as { process?: { env?: Record<string, string> } })
      .process?.env;
  return env?.OPENROUTER_API_KEY ?? env?.VITE_OPENROUTER_API_KEY;
}

async function generateAnchorGlyph(payload: GlyphPayload): Promise<GlyphResult> {
  // Mocked glyph/notary: in a real build, sign with ed25519 and pin somewhere permanent.
  const suffix = Math.abs(payload.timestamp).toString(36);
  const url = `https://glyph.shame.lol/mock/${suffix}`;
  return { url, payload };
}

async function createPR(_body: string, _glyph: GlyphResult): Promise<string> {
  // Mocked GitHub PR integration.
  return 'https://github.com/mock/shame-lol/pull/1';
}

function extractRoastFromResponse(json: OpenRouterResponse): string | null {
  const choice = json.choices?.[0];
  const raw = choice?.message?.content;
  if (!raw) return null;

  if (typeof raw === 'string') {
    return raw.trim() || null;
  }

  if (Array.isArray(raw)) {
    const joined = raw
      .map(part =>
        typeof part.text === 'string' ? part.text : ''
      )
      .join('\n')
      .trim();
    return joined || null;
  }

  return null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_HEADERS,
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    const apiKey = getServerApiKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing OPENROUTER_API_KEY for DragonFire swarm.'
        }),
        {
          status: 500,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    let body: SwarmRequestBody;
    try {
      body = (await request.json()) as SwarmRequestBody;
    } catch {
      body = {};
    }

    const target = (body.target ?? 'Microsoft').trim() || 'Microsoft';
    const mode = (body.mode ?? 'roast').trim() || 'roast';
    const requestedSwarmSize =
      typeof body.swarmSize === 'number' && Number.isFinite(body.swarmSize)
        ? body.swarmSize
        : 663;

    const swarmSize =
      requestedSwarmSize > 0 ? Math.floor(requestedSwarmSize) : 663;

    const prompt = `Roast ${target} on ${mode}. Channel Jon Snow's deadpan or a White Walker's undead efficiency.\n\nOutput:\n- One savage, self-contained markdown receipt.\n- Then a compact JSON blob with keys { "theme", "crime", "verdict" } suitable for glyph notarization.\nNo preamble, no explanation, just roast + JSON.`;

    const swarmPromises: Promise<Response>[] = Array.from(
      { length: swarmSize },
      (_unused, index) => {
        const temperature = 0.8 + (index % 10) * 0.02;
        return fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            stream: false,
            temperature
          })
        });
      }
    );

    const settled = await Promise.allSettled(swarmPromises);

    const fulfilled = settled.filter(
      (result): result is PromiseFulfilledResult<Response> =>
        result.status === 'fulfilled'
    );

    const parsed = await Promise.all(
      fulfilled.map(async result => {
        try {
          const json = (await result.value.json()) as OpenRouterResponse;
          const roast = extractRoastFromResponse(json);
          return roast;
        } catch {
          return null;
        }
      })
    );

    const roasts = parsed.filter(
      (text): text is string => typeof text === 'string' && text.length > 0
    );

    if (roasts.length === 0) {
      throw new Error('No surviving roasts from the DragonFire swarm.');
    }

    const initialBest = { content: roasts[0], index: 0 };
    const best = roasts.reduce(
      (currentBest, roast, index) => {
        const bias =
          roast.toLowerCase().includes('ethics clause') ||
          roast.toLowerCase().includes('ethics');
        const isLonger = roast.length > currentBest.content.length;
        if (bias || isLonger) {
          return { content: roast, index };
        }
        return currentBest;
      },
      initialBest
    );

    const survivorsCount = roasts.length;
    const divergenceFraction =
      swarmSize > 0 ? 1 - survivorsCount / swarmSize : 1;
    const divergencePercent = Math.round(divergenceFraction * 100);

    const glyphPayload: GlyphPayload = {
      roast: best.content,
      target,
      timestamp: Date.now(),
      divergence: divergenceFraction
    };

    const glyph = await generateAnchorGlyph(glyphPayload);

    const prBody = [
      `🐉 **DragonFire report for ${target}**`,
      ``,
      `- Mode: \`${mode}\``,
      `- Swarm size: \`${swarmSize}\``,
      `- Survivors: \`${survivorsCount}\``,
      `- Divergence: \`${divergencePercent}%\``,
      ``,
      `### Crowned roast`,
      ``,
      best.content,
      ``,
      `### AnchorGlyph`,
      ``,
      `Glyph URL: ${glyph.url}`,
      ``,
      `> This PR is a mock "PR Trainwreck" chain head. In a real setup, each model would fork a branch, and Longclaw would merge the winner.`
    ].join('\n');

    const prUrl = await createPR(prBody, glyph);

    const payload = {
      status: 'Winter is roaring',
      roast: best.content,
      glyph: glyph.url,
      pr: prUrl,
      divergence: divergencePercent
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown DragonFire failure.';
    const payload = {
      error: 'Dragon ate the server. Try /shame?mode=gentle',
      fireLevel: 'low',
      detail: message
    };

    return new Response(JSON.stringify(payload), {
      status: 418,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
}
