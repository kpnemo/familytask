'use client';

import { useState, useRef, useEffect } from 'react';
import { Icons } from '@/components/ui/icons';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  tasks?: ParsedTask[];
  clarificationQuestions?: ClarificationQuestion[];
}

interface ParsedTask {
  title: string;
  description?: string;
  suggestedPoints: number;
  suggestedAssignee?: string;
  suggestedDueDate: string;
  confidence: number;
}

interface ClarificationQuestion {
  id: string;
  question: string;
  taskIndex: number;
  field: string;
  suggestedAnswers?: string[];
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  familyId: string;
}

interface AIAssistantClientProps {
  user: User;
}

interface FamilyMember {
  id: string;
  name: string;
  role: string;
}

export function AIAssistantClient({ user }: AIAssistantClientProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hi ${user.name}! 👋 I'm your AI Assistant. I can help you create tasks for your family just by describing what needs to be done. Try something like: "Tomorrow the kids need to clean their rooms and do homework"`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<ParsedTask[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch family members on component mount
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const response = await fetch('/api/families/members');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setFamilyMembers(data.data.map((member: any) => ({
              id: member.user.id,
              name: member.user.name,
              role: member.user.role,
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching family members:', error);
      }
    };

    fetchFamilyMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call AI parsing endpoint
      const response = await fetch('/api/ai/parse-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        let aiResponseContent = '';
        
        if (data.data.parsedTasks && data.data.parsedTasks.length > 0) {
          const tasksCount = data.data.parsedTasks.length;
          aiResponseContent = `Great! I found ${tasksCount} task${tasksCount > 1 ? 's' : ''} from your message. `;
          
          if (data.data.clarificationQuestions && data.data.clarificationQuestions.length > 0) {
            aiResponseContent += `I have a few questions to make sure I get the details right. `;
          } else {
            aiResponseContent += `The tasks look ready to create! Review them below and click "Create Tasks" when you're satisfied.`;
          }

          setPendingTasks(data.data.parsedTasks);
        } else {
          aiResponseContent = "I couldn't find any clear tasks in your message. Could you try being more specific? For example: 'Tomorrow Johnny needs to clean his room and do homework'";
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponseContent,
          timestamp: new Date(),
          tasks: data.data.parsedTasks,
          clarificationQuestions: data.data.clarificationQuestions,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: `Sorry, I encountered an error: ${data.error || 'Unknown error'}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map assignee name to user ID
  const mapAssigneeNameToId = (assigneeName?: string): string => {
    if (!assigneeName) return '';
    
    // Find family member by name (case-insensitive)
    const member = familyMembers.find(
      m => m.name.toLowerCase() === assigneeName.toLowerCase()
    );
    
    return member ? member.id : '';
  };

  // Helper function to validate and fix date strings
  // Convert to YYYY-MM-DD format (same as UI form input type="date")
  const validateAndFixDate = (dateString: string): string => {
    const date = new Date(dateString);
    
    // If invalid date, return tomorrow's date only
    if (isNaN(date.getTime())) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0]; // Return YYYY-MM-DD only
    }
    
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD only
  };

  const createTasks = async () => {
    if (pendingTasks.length === 0) return;

    setIsLoading(true);
    let successCount = 0;
    let errors: string[] = [];

    try {
      // Create each task individually
      for (const task of pendingTasks) {
        try {
          // Map assignee name to actual user ID
          const assignedToId = mapAssigneeNameToId(task.suggestedAssignee);
          
          // Validate and fix the due date
          const validDueDate = validateAndFixDate(task.suggestedDueDate);
          
          const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: task.title,
              description: task.description || '',
              points: task.suggestedPoints,
              dueDate: validDueDate,
              assignedTo: assignedToId,
              isBonusTask: task.isBonusTask || !assignedToId, // Use AI suggestion or fall back to unassigned logic
              isRecurring: task.isRecurring || false,
              recurrencePattern: task.recurrencePattern,
              dueDateOnly: task.dueDateOnly || false,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            errors.push(`${task.title}: ${errorData.error || 'Failed to create'}`);
          }
        } catch (error) {
          errors.push(`${task.title}: Network error`);
        }
      }

      // Add success/error message
      let resultMessage = '';
      if (successCount > 0) {
        resultMessage += `✅ Successfully created ${successCount} task${successCount > 1 ? 's' : ''}! `;
      }
      if (errors.length > 0) {
        resultMessage += `❌ ${errors.length} task${errors.length > 1 ? 's' : ''} failed to create: ${errors.join(', ')}`;
      }

      const systemMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: resultMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, systemMessage]);
      
      if (successCount > 0) {
        setPendingTasks([]);
        
        // Add helpful follow-up message
        const followUpMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `The tasks are now live! Your family members can see them in their dashboards. What else would you like me to help you with?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, followUpMessage]);
      }

    } catch (error) {
      console.error('Task creation error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Failed to create tasks. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearPendingTasks = () => {
    setPendingTasks([]);
    const clearMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'Tasks cleared! Feel free to describe what you\'d like your family to do and I\'ll help you create new tasks.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, clearMessage]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-[600px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'ai'
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Pending Tasks Preview */}
        {pendingTasks.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                Ready to Create ({pendingTasks.length} tasks)
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={createTasks}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Tasks'}
                </button>
                <button
                  onClick={clearPendingTasks}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {pendingTasks.map((task, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded p-3 border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-gray-500">
                        <span className={`${mapAssigneeNameToId(task.suggestedAssignee) ? 'text-green-600' : 'text-red-600'}`}>
                          👤 {task.suggestedAssignee || (task.isBonusTask ? 'Bonus Task' : 'Unassigned')}
                          {task.suggestedAssignee && !mapAssigneeNameToId(task.suggestedAssignee) && ' (⚠️ Not found)'}
                        </span>
                        <span>⭐ {task.suggestedPoints} points</span>
                        <span>📅 {new Date(validateAndFixDate(task.suggestedDueDate)).toLocaleDateString()}</span>
                        {task.isRecurring && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            🔄 {task.recurrencePattern}
                          </span>
                        )}
                        {task.isBonusTask && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded">
                            💰 Bonus
                          </span>
                        )}
                        {task.dueDateOnly && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            ⏰ Due Date Only
                          </span>
                        )}
                        <span>🎯 {Math.round(task.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Icons.spinner className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want your family to do..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Icons.send className="h-4 w-4" />
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          💡 Try: "Tomorrow Johnny clean room and Sarah do homework" or "This weekend everyone help with chores"
        </div>
      </div>
    </div>
  );
}