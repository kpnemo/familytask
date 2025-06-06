import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasDatabaseUrl = !!process.env.DATABASE_URL;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ai: {
        anthropic: hasAnthropicKey ? 'configured' : 'missing_key',
      },
      mcp: {
        database: hasDatabaseUrl ? 'configured' : 'missing_url',
      },
      features: {
        taskParsing: hasAnthropicKey && hasDatabaseUrl,
        familyContext: hasDatabaseUrl,
      },
    };

    return NextResponse.json({
      success: true,
      data: health,
    });

  } catch (error) {
    console.error('AI health check error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}