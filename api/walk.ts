import type { ChaosInput, AgentResult } from '../src/agents/types';
import { WalkAgent } from '../src/agents/WalkAgent';

export const config = {
  runtime: 'edge'
};

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { input } = (parsed as { input?: string }) ?? {};

  if (typeof input !== 'string' || !input.trim()) {
    return jsonResponse({ error: 'Missing input' }, 400);
  }

  const chaosInput: ChaosInput = { input };
  const agent = new WalkAgent();

  try {
    const result: AgentResult = await agent.execute(chaosInput);
    return jsonResponse(result, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Walk error';
    return jsonResponse({ error: 'Internal Error', message }, 500);
  }
}
