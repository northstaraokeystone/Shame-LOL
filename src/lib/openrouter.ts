const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

type OpenRouterContentPart =
  | string
  | {
      type?: string;
      text?: string;
      [key: string]: unknown;
    };

type OpenRouterChoice = {
  message?: {
    content?: OpenRouterContentPart | OpenRouterContentPart[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
  [key: string]: unknown;
};

export async function callOpenRouter(
  systemPrompt: string,
  userInput: string
): Promise<{ roast: string }> {
  const env = (import.meta as unknown as {
    env?: { VITE_OPENROUTER_API_KEY?: string };
  }).env;

  const apiKey = env?.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'No API key for OpenRouter (VITE_OPENROUTER_API_KEY missing).'
    );
  }

  const referer =
    typeof window !== 'undefined' && window.location
      ? window.location.origin
      : 'https://shame.lol';

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,
      'X-Title': 'Shame'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      max_tokens: 4096
    })
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  const choice = data.choices?.[0];
  const rawContent = choice?.message?.content;

  let content: string | undefined;

  if (Array.isArray(rawContent)) {
    content = rawContent
      .map(part =>
        typeof part === 'string'
          ? part
          : typeof part.text === 'string'
          ? part.text
          : ''
      )
      .filter(Boolean)
      .join('\n\n')
      .trim();
  } else if (typeof rawContent === 'string') {
    content = rawContent.trim();
  } else if (rawContent && typeof rawContent === 'object') {
    const maybeText = (rawContent as { text?: string }).text;
    if (typeof maybeText === 'string') {
      content = maybeText.trim();
    }
  }

  if (!content) {
    throw new Error('Empty response from Claude via OpenRouter.');
  }

  return { roast: content };
}
