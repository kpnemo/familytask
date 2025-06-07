import React from 'react';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className = '' }: FormattedContentProps) {
  // Function to detect if content looks like a structured list/table
  const isStructuredContent = (text: string): boolean => {
    return (
      text.includes('Points:') ||
      text.includes('баллов:') ||
      text.includes('📋') ||
      text.includes('⏺') ||
      text.includes('- ') ||
      (text.includes('\n') && text.includes(':'))
    );
  };

  // Function to format content into a nice table/list structure
  const formatStructuredContent = (text: string): React.ReactNode => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const elements: React.ReactNode[] = [];
    let currentSection: string | null = null;
    let currentItems: string[] = [];

    const flushSection = () => {
      if (currentSection && currentItems.length > 0) {
        elements.push(
          <div key={elements.length} className="mb-4">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              {currentSection.includes('Points') || currentSection.includes('баллов') ? (
                <span className="mr-2 text-blue-600">🏆</span>
              ) : (
                <span className="mr-2">📋</span>
              )}
              {currentSection}
            </div>
            <div className="ml-6 space-y-1">
              {currentItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="mr-2 text-green-600 mt-1">•</span>
                  <span className="flex-1">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
        currentItems = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Check if this is a section header (ends with colon, contains "Points" or "баллов")
      if ((trimmed.includes('Points:') || trimmed.includes('баллов:')) && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
        flushSection();
        currentSection = trimmed;
      }
      // Check if this is a general header (like "📋 Completed Tasks...")
      else if ((trimmed.includes('📋') || trimmed.includes('⏺')) && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
        flushSection();
        elements.push(
          <div key={elements.length} className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-2">
              {trimmed}
            </h3>
          </div>
        );
      }
      // Check if this is a list item
      else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const cleanItem = trimmed.replace(/^[-•]\s*/, '');
        currentItems.push(cleanItem);
      }
      // Check if this looks like a total/summary line
      else if (trimmed.toLowerCase().includes('total') || trimmed.toLowerCase().includes('всего')) {
        flushSection();
        elements.push(
          <div key={elements.length} className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="font-semibold text-blue-900 dark:text-blue-100 flex items-center">
              <span className="mr-2">📊</span>
              {trimmed}
            </div>
          </div>
        );
      }
      // Regular content
      else {
        flushSection();
        elements.push(
          <div key={elements.length} className="mb-2 text-sm text-gray-700 dark:text-gray-300">
            {trimmed}
          </div>
        );
      }
    }

    // Flush any remaining section
    flushSection();

    return elements.length > 0 ? <div className="space-y-2">{elements}</div> : <span>{text}</span>;
  };

  // Function to format simple content with proper line breaks
  const formatSimpleContent = (text: string): React.ReactNode => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line.trim()}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Decide which formatting to use
  const formattedContent = isStructuredContent(content) 
    ? formatStructuredContent(content)
    : formatSimpleContent(content);

  return (
    <div className={`formatted-content ${className}`}>
      {formattedContent}
    </div>
  );
}

export default FormattedContent;