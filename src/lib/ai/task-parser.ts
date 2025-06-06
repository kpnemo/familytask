import Anthropic from '@anthropic-ai/sdk';
import { FamilyContext } from '../mcp/family-context';
import { ParsedTask, ClarificationQuestion } from '../../types/ai';

export class TaskParser {
  private anthropic: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async parseNaturalLanguage(
    input: string, 
    familyContext: FamilyContext,
    targetDate?: string,
    defaultPoints?: number,
    retryCount: number = 0
  ): Promise<{
    parsedTasks: ParsedTask[];
    clarificationQuestions: ClarificationQuestion[];
  }> {
    try {
      const prompt = this.buildParsingPrompt(input, familyContext, targetDate, defaultPoints);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
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

      return this.parseAIResponse(content.text);
    } catch (error) {
      console.error(`Error parsing natural language (attempt ${retryCount + 1}):`, error);
      
      // Retry once if this is the first attempt and the error is parsing-related
      if (retryCount === 0 && (error instanceof SyntaxError || error.message.includes('JSON'))) {
        console.log('Retrying task parsing due to parsing error...');
        return this.parseNaturalLanguage(input, familyContext, targetDate, defaultPoints, 1);
      }
      
      throw new Error('Failed to parse natural language input');
    }
  }

  private buildParsingPrompt(
    input: string, 
    familyContext: FamilyContext,
    targetDate?: string,
    defaultPoints?: number
  ): string {
    const familyMembers = familyContext.members
      .filter(m => m.role === 'CHILD')
      .map(m => m.name)
      .join(', ');

    const averagePoints = this.calculateAverageTaskPoints(familyContext);
    const points = defaultPoints || averagePoints;

    // Get today's date for reference
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    return `You are an AI assistant helping a parent create tasks for their family. Parse the following natural language input into structured tasks.

FAMILY CONTEXT:
- Available children: ${familyMembers || 'No children found'}
- Family task history shows average task points: ${averagePoints}
- Default points to suggest: ${points}
- Today's date: ${today.toISOString()}
- Default target date: ${targetDate || tomorrow.toISOString()}

INPUT TO PARSE: "${input}"

CRITICAL SCHEMA REQUIREMENTS - THESE ARE MANDATORY:
1. suggestedDueDate MUST be valid date in YYYY-MM-DD format (date only, no time)
   - NEVER use "Invalid Date" or any invalid date strings
   - ALWAYS use concrete dates like "${tomorrow.toISOString().split('T')[0]}"
   - If unsure, use "${tomorrow.toISOString().split('T')[0]}" as default
2. suggestedAssignee MUST exactly match one of these names: ${familyMembers || 'None'}
3. suggestedPoints MUST be integer between 1-10
4. confidence MUST be decimal between 0.0-1.0
5. title MUST be concise (max 50 characters)
6. description is optional but helpful
7. isBonusTask MUST be boolean (default false)
8. isRecurring MUST be boolean (default false)
9. recurrencePattern MUST be "DAILY", "WEEKLY", or "MONTHLY" (only if isRecurring is true)
10. dueDateOnly MUST be boolean (default false)

PARSING RULES:
1. Extract individual tasks from the input
2. For assignee: use exact name match from available children, or leave empty for unassigned
3. For dates: 
   - "tomorrow" = ${tomorrow.toISOString().split('T')[0]}
   - "today" = ${today.toISOString().split('T')[0]}
   - "weekend" = next Saturday as YYYY-MM-DD format
   - ONLY return date part (YYYY-MM-DD), NO time component
4. For points: consider task complexity (cleaning=2-4, homework=3-5, chores=1-3)
5. For task types:
   - BONUS TASKS: Unassigned tasks anyone can claim (set isBonusTask: true, no assignee)
   - RECURRING TASKS: Tasks that repeat (set isRecurring: true + recurrencePattern)
   - DUE DATE ONLY: Tasks that can only be completed on the exact due date (set dueDateOnly: true)

TASK TYPE DETECTION:
- Look for keywords: "daily", "weekly", "monthly", "every day", "each week", "recurring"
- Look for "bonus", "anyone can do", "extra credit", "optional"
- Look for "only on", "exactly on", "must be done on", "due date only"
- For recurring household chores like "take out trash weekly" or "daily dishes"

OUTPUT FORMAT (JSON only, no additional text):
{
  "parsedTasks": [
    {
      "title": "Clean room",
      "description": "Organize toys and make bed",
      "suggestedPoints": 3,
      "suggestedAssignee": "Johnny",
      "suggestedDueDate": "${tomorrow.toISOString().split('T')[0]}",
      "confidence": 0.95,
      "isBonusTask": false,
      "isRecurring": false,
      "recurrencePattern": null,
      "dueDateOnly": false
    }
  ],
  "clarificationQuestions": [
    {
      "id": "q1",
      "question": "How many points should this task be worth?",
      "taskIndex": 0,
      "field": "points",
      "suggestedAnswers": ["2", "3", "4"]
    }
  ]
}

EXAMPLES:
- "tomorrow Johnny clean room" → regular task, assignee: "Johnny"
- "daily dishes for Sarah" → isRecurring: true, recurrencePattern: "DAILY", assignee: "Sarah"
- "weekly trash pickup bonus task" → isBonusTask: true, isRecurring: true, recurrencePattern: "WEEKLY"
- "vacuum on Saturday only" → dueDateOnly: true, specific Saturday date
- "anyone can organize garage for extra points" → isBonusTask: true, no assignee

VALIDATION CHECKLIST:
✓ All dates are valid YYYY-MM-DD format (NEVER "Invalid Date")
✓ All assignees match available children names exactly (or empty for bonus tasks)
✓ All points are integers 1-10
✓ All confidence scores are 0.0-1.0
✓ Titles are concise and clear
✓ isBonusTask is boolean
✓ isRecurring is boolean
✓ recurrencePattern is "DAILY", "WEEKLY", or "MONTHLY" (only if isRecurring is true)
✓ dueDateOnly is boolean

COMMON MISTAKES TO AVOID:
❌ "suggestedDueDate": "Invalid Date" 
❌ "suggestedDueDate": "tomorrow"
❌ "suggestedDueDate": "2024-12-07T18:00:00.000Z"
✅ "suggestedDueDate": "${tomorrow.toISOString().split('T')[0]}"
❌ Assigning bonus tasks to specific people
❌ Setting recurrencePattern without isRecurring: true
❌ Using invalid recurrence patterns

Remember: Use ONLY date part (YYYY-MM-DD), NO time component!`;
  }

  private calculateAverageTaskPoints(familyContext: FamilyContext): number {
    if (familyContext.activeTasks.length === 0) return 3;
    
    const totalPoints = familyContext.activeTasks.reduce((sum, task) => sum + task.points, 0);
    const average = totalPoints / familyContext.activeTasks.length;
    
    return Math.round(average);
  }

  private parseAIResponse(response: string): {
    parsedTasks: ParsedTask[];
    clarificationQuestions: ClarificationQuestion[];
  } {
    try {
      // Clean up the response to extract JSON and remove control characters
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      // Clean control characters that can break JSON parsing
      const cleanedJson = jsonMatch[0]
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/\n/g, '\\n') // Escape remaining newlines
        .replace(/\r/g, '\\r') // Escape carriage returns
        .replace(/\t/g, '\\t'); // Escape tabs

      const parsed = JSON.parse(cleanedJson) as {
        parsedTasks: unknown[];
        clarificationQuestions?: unknown[];
      };
      
      // Validate the structure
      if (!parsed.parsedTasks || !Array.isArray(parsed.parsedTasks)) {
        throw new Error('Invalid parsedTasks structure');
      }

      // Ensure clarificationQuestions exists
      if (!parsed.clarificationQuestions) {
        parsed.clarificationQuestions = [];
      }

      // Validate and clean up parsed tasks
      const validatedTasks = parsed.parsedTasks.map((task: unknown) => {
        const taskObj = task as Record<string, unknown>;
        if (!taskObj.title || typeof taskObj.title !== 'string') {
          throw new Error('Task missing valid title');
        }

        return {
          title: taskObj.title.trim(),
          description: taskObj.description && typeof taskObj.description === 'string' ? taskObj.description.trim() : undefined,
          suggestedPoints: Math.max(1, Math.min(10, parseInt(String(taskObj.suggestedPoints)) || 3)),
          suggestedAssignee: taskObj.suggestedAssignee && typeof taskObj.suggestedAssignee === 'string' ? taskObj.suggestedAssignee.trim() : undefined,
          suggestedDueDate: this.validateAndFixDate(taskObj.suggestedDueDate),
          confidence: Math.max(0, Math.min(1, parseFloat(String(taskObj.confidence)) || 0.5)),
          // New task type fields
          isBonusTask: Boolean(taskObj.isBonusTask),
          isRecurring: Boolean(taskObj.isRecurring),
          recurrencePattern: taskObj.isRecurring && taskObj.recurrencePattern && 
            ['DAILY', 'WEEKLY', 'MONTHLY'].includes(String(taskObj.recurrencePattern)) 
            ? String(taskObj.recurrencePattern) as 'DAILY' | 'WEEKLY' | 'MONTHLY'
            : undefined,
          dueDateOnly: Boolean(taskObj.dueDateOnly),
        };
      });

      return {
        parsedTasks: validatedTasks,
        clarificationQuestions: parsed.clarificationQuestions || [],
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback: try to extract at least basic task info
      return this.fallbackParsing(response);
    }
  }

  private fallbackParsing(input: string): {
    parsedTasks: ParsedTask[];
    clarificationQuestions: ClarificationQuestion[];
  } {
    // Simple fallback: split by common separators and create basic tasks
    const taskKeywords = ['clean', 'do', 'wash', 'organize', 'read', 'study', 'homework'];
    const sentences = input.split(/[,.;]|\sand\s/i);
    
    const tasks: ParsedTask[] = [];
    
    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      if (trimmed.length > 3 && taskKeywords.some(keyword => 
        trimmed.toLowerCase().includes(keyword)
      )) {
        tasks.push({
          title: trimmed,
          suggestedPoints: 3,
          suggestedDueDate: this.getDefaultDueDate(),
          confidence: 0.3, // Low confidence for fallback
          isBonusTask: false,
          isRecurring: false,
          dueDateOnly: false,
        });
      }
    });

    return {
      parsedTasks: tasks,
      clarificationQuestions: [],
    };
  }

  private validateAndFixDate(dateInput: unknown): string {
    if (!dateInput || typeof dateInput !== 'string') {
      return this.getDefaultDueDate();
    }

    // Try to parse the date
    const date = new Date(dateInput);
    
    // If invalid date, return default
    if (isNaN(date.getTime())) {
      console.warn(`AI generated invalid date: "${dateInput}", using default`);
      return this.getDefaultDueDate();
    }
    
    // Return date-only string (YYYY-MM-DD) to match UI form format
    return date.toISOString().split('T')[0];
  }

  private getDefaultDueDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Return date-only string (YYYY-MM-DD) to match UI form format
    return tomorrow.toISOString().split('T')[0];
  }
}