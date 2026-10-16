import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agent-orchestrator';

export async function POST(req: Request) {
  try {
    const { query, apiKey, language } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const response = await AgentOrchestrator.processQuery(query, apiKey, language || 'en');
    return NextResponse.json({ success: true, ...response });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Agent error' },
      { status: 500 }
    );
  }
}
