import React, { useState } from 'react';
import { Icons } from '@/components/ui/icons';

interface TaskIconProps {
  iconUrl?: string | null;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGenerateButton?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
  className?: string;
}

export function TaskIcon({ 
  iconUrl, 
  title, 
  size = 'md', 
  showGenerateButton = false, 
  onGenerate,
  isGenerating = false,
  className = '' 
}: TaskIconProps) {
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const iconSize = sizeClasses[size];

  // If we have a valid icon URL and no error, show the custom icon
  if (iconUrl && !imageError) {
    return (
      <div className={`relative inline-block ${className}`}>
        <img 
          src={iconUrl}
          alt={`Icon for ${title}`}
          className={`${iconSize} rounded-lg object-cover shadow-sm`}
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
        {showGenerateButton && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shadow-sm disabled:opacity-50"
            title="Regenerate icon"
          >
            {isGenerating ? (
              <Icons.spinner className="w-3 h-3 animate-spin" />
            ) : (
              <Icons.refresh className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Fallback: Show default icon with optional generate button
  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${iconSize} bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center`}>
        <Icons.task className={`${getSmallerIconSize(size)} text-gray-400 dark:text-gray-500`} />
      </div>
      
      {showGenerateButton && (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs shadow-sm disabled:opacity-50"
          title={iconUrl && imageError ? "Regenerate icon" : "Generate icon"}
        >
          {isGenerating ? (
            <Icons.spinner className="w-3 h-3 animate-spin" />
          ) : (
            <Icons.plus className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
}

function getSmallerIconSize(size: 'sm' | 'md' | 'lg' | 'xl'): string {
  const smallerSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7', 
    xl: 'w-10 h-10'
  };
  return smallerSizes[size];
}

// Hook for icon generation logic
export function useTaskIconGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIcon = async (title: string, description?: string): Promise<{ iconUrl: string; prompt: string } | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks/generate-icon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate icon');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate icon';
      setError(errorMessage);
      console.error('Icon generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateIcon,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
}

export default TaskIcon;