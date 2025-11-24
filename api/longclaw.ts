import { LongclawOrchestrator } from '../src/agents/LongclawOrchestrator';
import type { ChaosInput } from '../src/agents/types';

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

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
    const body = (await request.json()) as { input?: string };
    const input = (body.input ?? '').trim();

    if (!input) {
      return new Response(
        JSON.stringify({ error: 'Missing input for Longclaw orchestrator.' }),
        {
          status: 400,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const agent = new LongclawOrchestrator();
    const chaosInput: ChaosInput = { input };
    const result = await agent.execute(chaosInput);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown Longclaw orchestrator error';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
}
