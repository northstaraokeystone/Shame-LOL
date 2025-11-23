export async function callClaudeJSON<T>(
  systemPrompt: string,
  userPayload: unknown,
  fallback: T
): Promise<T> {
  const key = (process.env as any).OPENROUTER_API_KEY;
  if (!key || typeof fetch === 'undefined') return fallback;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://shame.lol',
        'X-Title': 'Shame.lol'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userPayload) }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data: any = await res.json();
    const raw =
      data?.choices?.[0]?.message?.content?.[0]?.text ??
      data?.choices?.[0]?.message?.content ??
      '';

    if (typeof raw !== 'string') return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
