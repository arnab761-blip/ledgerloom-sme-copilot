import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agent-orchestrator';

export async function POST(req: Request) {
  try {
    const { query, apiKey, language, currency } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const response = await AgentOrchestrator.processQuery(
      query,
      apiKey,
      language || 'en',
      currency || 'BDT'
    );
    return NextResponse.json({ success: true, ...response });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Agent error' },
      { status: 500 }
    );
  }
}
