import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AIAssistantClient } from '@/components/features/ai/ai-assistant-client';
import { AppHeader } from '@/components/layout/app-header';

export default async function AIAssistantPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Only parents can access AI Assistant
  if (session.user.role !== 'PARENT') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader user={session.user} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
              <div className="flex items-center space-x-2">
                <p className="text-gray-600 dark:text-gray-400">Create tasks naturally with AI</p>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Beta</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l3.847-1.539a.75.75 0 01.53 0l3.847 1.539a.75.75 0 001.063-.853l-.708-2.836a.75.75 0 011.063-.852L22.5 9.75l-1.539-3.847a.75.75 0 00-.853-1.063l-2.836.708a.75.75 0 01-.852-1.063L15.75 1.5 11.25 11.25Z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">How to use AI Assistant</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Simply type what you want your family to do: "Tomorrow Johnny should clean his room and Sarah needs to do homework". 
                  The AI will create structured tasks for you!
                </p>
              </div>
            </div>
          </div>
        </div>

        <AIAssistantClient user={session.user} />
      </div>
    </div>
  );
}