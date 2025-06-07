import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FamilyContextBuilder } from '@/lib/mcp/family-context';
import { OpenAIConversationHandler } from '@/lib/ai/openai-conversation-handler';

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}

interface ChatResponse {
  success: boolean;
  data?: {
    message: string;
    intent: string;
    language: string;
    data?: unknown;
    followUpActions?: string[];
    confidence: number;
    timestamp: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ChatResponse,
        { status: 401 }
      );
    }

    // Role check - only parents can use AI chat for now
    if (session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Only parents can use AI chat' } as ChatResponse,
        { status: 403 }
      );
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { message, conversationHistory } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' } as ChatResponse,
        { status: 400 }
      );
    }

    // Get user's family context
    const contextBuilder = new FamilyContextBuilder();
    
    // Validate family access
    const hasAccess = await contextBuilder.validateFamilyAccess(
      session.user.id, 
      session.user.familyId
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Family access denied' } as ChatResponse,
        { status: 403 }
      );
    }

    // Get user's family role
    const userRole = await contextBuilder.getUserFamilyRole(
      session.user.id,
      session.user.familyId
    );

    if (!userRole || !['ADMIN_PARENT', 'PARENT'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' } as ChatResponse,
        { status: 403 }
      );
    }

    // Build family context for AI
    const familyContext = await contextBuilder.buildContext(
      session.user.familyId,
      userRole
    );

    // Convert conversation history to the format expected by conversation handler
    const formattedHistory = conversationHistory?.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp)
    })) || [];

    // Handle conversation with AI (now using OpenAI)
    const conversationHandler = new OpenAIConversationHandler();
    const result = await conversationHandler.handleConversation(
      message,
      familyContext,
      formattedHistory
    );

    // Log AI usage (for monitoring and cost tracking)
    console.log(`AI Chat (OpenAI) - Family: ${session.user.familyId}, User: ${session.user.id}, Intent: ${result.intent}, Language: ${result.language}`);

    const response: ChatResponse = {
      success: true,
      data: {
        message: result.message,
        intent: result.intent,
        language: result.language,
        data: result.data,
        followUpActions: result.followUpActions,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI chat error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      } as ChatResponse,
      { status: 500 }
    );
  }
}