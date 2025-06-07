import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

interface IconGenerationRequest {
  title: string;
  description?: string;
}

interface IconGenerationResponse {
  success: boolean;
  data?: {
    iconUrl: string;
    prompt: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as IconGenerationResponse,
        { status: 401 }
      );
    }

    // Only parents can generate icons for now (can be changed later)
    if (session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Only parents can generate task icons' } as IconGenerationResponse,
        { status: 403 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Icon generation is not configured' } as IconGenerationResponse,
        { status: 500 }
      );
    }

    // Parse request body
    const body: IconGenerationRequest = await request.json();
    const { title, description } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task title is required for icon generation' } as IconGenerationResponse,
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a descriptive prompt for the task icon
    const iconPrompt = createIconPrompt(title, description);

    console.log(`Generating icon for task: "${title}" with prompt: "${iconPrompt}"`);

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: iconPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid"
    });

    const iconUrl = response.data[0]?.url;

    if (!iconUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate icon' } as IconGenerationResponse,
        { status: 500 }
      );
    }

    console.log(`Successfully generated icon for task: "${title}"`);

    const result: IconGenerationResponse = {
      success: true,
      data: {
        iconUrl,
        prompt: iconPrompt
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Icon generation error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('billing')) {
        return NextResponse.json(
          { success: false, error: 'Icon generation temporarily unavailable (billing issue)' } as IconGenerationResponse,
          { status: 503 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'Icon generation rate limit reached. Please try again later.' } as IconGenerationResponse,
          { status: 429 }
        );
      }

      if (error.message.includes('content policy')) {
        return NextResponse.json(
          { success: false, error: 'Cannot generate icon for this task content. Please try a different description.' } as IconGenerationResponse,
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate task icon. Please try again.' 
      } as IconGenerationResponse,
      { status: 500 }
    );
  }
}

function createIconPrompt(title: string, description?: string): string {
  const taskText = title;
  const taskDescription = description ? `: ${description}` : '';
  
  return `You are a visual designer for a family task app.

Step 1: Read the following task:
"${taskText}${taskDescription}"

Step 2: Convert the task into one clear, visual noun — a single physical object that best represents the task. 
Examples: 
- "убрать комнату" → "швабра"
- "делать уроки" → "книжка"
- "мыть посуду" → "чистая тарелка"
- "почистить зубы" → "зубная щетка"
- "стирать белье" → "стиральная машина"
- "погулять с собакой" → "собака"

Step 3: Based on that noun, generate a minimal high contrast icon.

The image should:
- Show only one centered object (the noun from Step 2)
Output image`;
}