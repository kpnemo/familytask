import Anthropic from '@anthropic-ai/sdk';
import { FamilyContext } from '../mcp/family-context';

export type ConversationIntent = 
  | 'CREATE_TASKS'     // User wants to create new tasks
  | 'ANALYZE_DATA'     // User wants insights/analytics
  | 'QUERY_TASKS'      // User wants to check existing tasks
  | 'CLARIFICATION'    // Need more info to determine intent
  | 'GENERAL_CHAT';    // General conversation

export interface ConversationAnalysis {
  intent: ConversationIntent;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
}

export class ConversationRouter {
  private anthropic: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeIntent(
    userInput: string, 
    familyContext: FamilyContext,
    conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>,
    retryCount: number = 0
  ): Promise<ConversationAnalysis> {
    try {
      const prompt = this.buildIntentPrompt(userInput, familyContext, conversationHistory);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from AI');
      }

      return this.parseIntentResponse(content.text);
    } catch (error) {
      console.error(`Error analyzing conversation intent (attempt ${retryCount + 1}):`, error);
      
      // Retry once if this is the first attempt and the error is parsing-related
      if (retryCount === 0 && (error instanceof SyntaxError || error.message.includes('JSON'))) {
        console.log('Retrying intent analysis due to parsing error...');
        return this.analyzeIntent(userInput, familyContext, conversationHistory, 1);
      }
      
      // Default to clarification when uncertain
      return {
        intent: 'CLARIFICATION',
        confidence: 0.3,
        reasoning: 'Unable to analyze intent due to technical error',
        suggestedAction: 'Ask for clarification about what the user wants to do'
      };
    }
  }

  private buildIntentPrompt(
    userInput: string,
    familyContext: FamilyContext,
    conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>
  ): string {
    const familyMembers = familyContext.members
      .map(m => `${m.name} (${m.role})`)
      .join(', ');

    const activeTasks = familyContext.activeTasks.length;
    const completionHistory = familyContext.completionHistory.length;

    const historyContext = conversationHistory && conversationHistory.length > 0
      ? `\n\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}`
      : '';

    return `You are analyzing user intent in a family task management conversation. Determine what the user wants to do.

FAMILY CONTEXT:
- Family members: ${familyMembers}
- Active tasks: ${activeTasks}
- Recent completions: ${completionHistory}
- Current date: ${new Date().toISOString().split('T')[0]}

USER INPUT: "${userInput}"${historyContext}

INTENT CATEGORIES:
1. CREATE_TASKS - User wants to create new tasks
   - Keywords: "create", "add", "needs to", "should do", "tomorrow", "this week"
   - Examples: "Johnny needs to clean his room", "Add weekly chores", "Create a task for homework"

2. ANALYZE_DATA - User wants insights, reports, or analytics
   - Keywords: "show me", "how is", "analysis", "report", "performance", "progress"
   - Examples: "Show me Erik's progress", "How are the kids doing?", "Family completion report"

3. QUERY_TASKS - User wants to check existing tasks or status
   - Keywords: "what tasks", "check", "status", "what's pending", "who has"
   - Examples: "What tasks does Sarah have?", "Check overdue tasks", "Who's doing well?"

4. CLARIFICATION - Not enough information to determine intent
   - Ambiguous inputs, greetings, or unclear requests
   - Examples: "Hi", "Help", "What can you do?"

5. GENERAL_CHAT - Casual conversation not related to tasks
   - General questions, small talk, unrelated topics
   - Examples: "How's the weather?", "Tell me a joke"

ANALYSIS RULES:
- Look for action words and context clues
- Consider family context (if family has many overdue tasks, "help" might mean analysis)
- If multiple intents possible, choose the most likely one
- Confidence: 0.8+ = very clear, 0.5-0.8 = likely, <0.5 = uncertain

OUTPUT FORMAT (JSON only):
{
  "intent": "CREATE_TASKS|ANALYZE_DATA|QUERY_TASKS|CLARIFICATION|GENERAL_CHAT",
  "confidence": 0.85,
  "reasoning": "User wants to create tasks because they said 'Johnny needs to clean his room tomorrow'",
  "suggestedAction": "Parse the input for task creation with task parser"
}`;
  }

  private parseIntentResponse(response: string): ConversationAnalysis {
    try {
      // Clean up the response to extract JSON and remove control characters
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in intent analysis response');
      }

      // Clean control characters that can break JSON parsing
      const cleanedJson = jsonMatch[0]
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/\n/g, '\\n') // Escape remaining newlines
        .replace(/\r/g, '\\r') // Escape carriage returns
        .replace(/\t/g, '\\t'); // Escape tabs

      const parsed = JSON.parse(cleanedJson) as {
        intent: string;
        confidence: number;
        reasoning: string;
        suggestedAction: string;
      };

      // Validate intent
      const validIntents: ConversationIntent[] = [
        'CREATE_TASKS', 'ANALYZE_DATA', 'QUERY_TASKS', 'CLARIFICATION', 'GENERAL_CHAT'
      ];

      const intent = validIntents.includes(parsed.intent as ConversationIntent) 
        ? parsed.intent as ConversationIntent 
        : 'CLARIFICATION';

      return {
        intent,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        suggestedAction: parsed.suggestedAction || 'Default action'
      };
    } catch (error) {
      console.error('Error parsing intent response:', error);
      return {
        intent: 'CLARIFICATION',
        confidence: 0.3,
        reasoning: 'Could not parse intent from AI response',
        suggestedAction: 'Ask user to clarify what they want to do'
      };
    }
  }
}