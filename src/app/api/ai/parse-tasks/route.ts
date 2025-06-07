import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FamilyContextBuilder } from '@/lib/mcp/family-context';
import { OpenAITaskParser } from '@/lib/ai/openai-task-parser';
import { AIParseTasksRequest, AIParseTasksResponse } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Role check - only parents can use AI task parsing
    if (session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Only parents can use AI task parsing' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: AIParseTasksRequest = await request.json();
    const { input, targetDate, defaultPoints } = body;

    if (!input || input.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Input text is required' },
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
        { success: false, error: 'Family access denied' },
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
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Build family context for AI
    const familyContext = await contextBuilder.buildContext(
      session.user.familyId,
      userRole
    );

    // Parse tasks using AI (now using OpenAI)
    const taskParser = new OpenAITaskParser();
    const result = await taskParser.parseNaturalLanguage(
      input,
      familyContext,
      targetDate,
      defaultPoints
    );

    // Generate session ID for potential clarification follow-ups
    const sessionId = `ai_parse_${Date.now()}_${session.user.id}`;

    const response: AIParseTasksResponse = {
      success: true,
      data: {
        parsedTasks: result.parsedTasks,
        clarificationQuestions: result.clarificationQuestions,
        sessionId: result.clarificationQuestions.length > 0 ? sessionId : undefined,
      },
    };

    // Log AI usage (for monitoring and cost tracking)
    console.log(`AI Task Parsing (OpenAI) - Family: ${session.user.familyId}, User: ${session.user.id}, Tasks: ${result.parsedTasks.length}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI parse tasks error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}