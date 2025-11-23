/// <reference types="vite/client" />

export async function callOpenRouter(
  systemPrompt: string,
  userInput: string
): Promise<{ roast: string }> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'No API key for OpenRouter (VITE_OPENROUTER_API_KEY missing).'
    );
  }

  const referer =
    typeof window !== 'undefined' && window.location
      ? window.location.origin
      : 'https://shame.lol';

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
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
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  interface OpenRouterContentBlock {
    type?: string;
    text?: string;
  }

  interface OpenRouterMessage {
    content?: string | OpenRouterContentBlock[];
  }

  interface OpenRouterChoice {
    message?: OpenRouterMessage;
  }

  interface OpenRouterResponse {
    choices?: OpenRouterChoice[];
  }

  const data = (await response.json()) as OpenRouterResponse;
  const rawContent = data.choices?.[0]?.message?.content;

  let text: string | null = null;

  if (typeof rawContent === 'string') {
    text = rawContent.trim();
  } else if (Array.isArray(rawContent)) {
    text = rawContent
      .map(block => block.text ?? '')
      .join('\n')
      .trim();
  }

  if (!text) {
    throw new Error('No content returned from OpenRouter.');
  }

  return { roast: text };
}
