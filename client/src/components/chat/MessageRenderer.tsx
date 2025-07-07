import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface MessageRendererProps {
  content: string;
  className?: string;
}

export default function MessageRenderer({ content, className }: MessageRendererProps) {
  // Enhanced detection for various structured data formats
  const detectContentType = (text: string): { hasJSON: boolean; hasHTML: boolean; hasMarkdownTable: boolean } => {
    try {
      const detectors = {
        hasJSON: [
          /```json\s*\n([\s\S]*?)\n```/i,  // JSON code blocks
          /```\s*\n(\{[\s\S]*?\}|\[[\s\S]*?\])\n```/,  // Generic code blocks with JSON
          /(?:^|\n)(\{[\s\S]*?\})(?:\n|$)/,  // Objects
          /(?:^|\n)(\[[\s\S]*?\])(?:\n|$)/,  // Arrays
        ],
        hasHTML: [
          /```html\s*\n([\s\S]*?<table[\s\S]*?<\/table>[\s\S]*?)\n```/i,  // HTML tables in code blocks
          /<table[\s\S]*?<\/table>/i,  // Raw HTML tables
        ],
        hasMarkdownTable: [
          /\|[\s\S]*?\|[\s\S]*?\n[\s\S]*?\|[\s\S]*?-[\s\S]*?\|/,  // Markdown tables (| header | format)
          /^\s*\|.*\|\s*$/m,  // Simple markdown table row detection
        ]
      };
      
      return {
        hasJSON: detectors.hasJSON.some(pattern => pattern.test(text)),
        hasHTML: detectors.hasHTML.some(pattern => pattern.test(text)),
        hasMarkdownTable: detectors.hasMarkdownTable.some(pattern => pattern.test(text))
      };
    } catch {
      return { hasJSON: false, hasHTML: false, hasMarkdownTable: false };
    }
  };

  // Enhanced content processor for multiple formats
  const processStructuredContent = (text: string): string => {
    let processedText = text;
    
    try {
      // 1. Process JSON content (including nested structures)
      processedText = processJSONContent(processedText);
      
      // 2. Process HTML tables in code blocks
      processedText = processHTMLTables(processedText);
      
      // 3. Leave markdown tables to be handled by ReactMarkdown with remarkGfm
      
      return processedText;
    } catch {
      return text;
    }
  };

  const processJSONContent = (text: string): string => {
    const jsonRegexes = [
      /```json\s*\n([\s\S]*?)\n```/gi,  // JSON code blocks
      /```\s*\n(\{[\s\S]*?\}|\[[\s\S]*?\])\n```/g,  // Generic code blocks with JSON
      /(?:^|\n)(\{[\s\S]*?\})(?=\n|$)/g,  // Standalone JSON objects
      /(?:^|\n)(\[[\s\S]*?\])(?=\n|$)/g,  // Standalone JSON arrays
    ];
    
    let result = text;
    
    jsonRegexes.forEach(regex => {
      result = result.replace(regex, (match, ...groups) => {
        try {
          // Extract JSON content
          let jsonContent = groups.find(group => group && (group.startsWith('{') || group.startsWith('['))) || match;
          
          if (match.includes('```')) {
            const codeMatch = match.match(/```(?:json)?\s*\n([\s\S]*?)\n```/i);
            if (codeMatch) jsonContent = codeMatch[1];
          }
          
          const parsed = JSON.parse(jsonContent.trim());
          return convertToTable(parsed, match);
        } catch {
          return match; // Return original if parsing fails
        }
      });
    });
    
    return result;
  };

  const processHTMLTables = (text: string): string => {
    return text.replace(/```html\s*\n([\s\S]*?<table[\s\S]*?<\/table>[\s\S]*?)\n```/gi, (match, htmlContent) => {
      // Add styling classes to HTML tables
      return htmlContent.replace(/<table([^>]*)>/gi, '<table class="json-table"$1>');
    });
  };

  const convertToTable = (data: any, originalMatch: string): string => {
    try {
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        // Array of objects -> table
        const keys = Object.keys(data[0]);
        return generateTableHTML(keys, data);
      } else if (typeof data === 'object' && data !== null) {
        // Check for nested arrays of objects (like Perplexity's format)
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            const keys = Object.keys(value[0]);
            return generateTableHTML(keys, value);
          }
        }
        
        // Single object -> key-value table
        const entries = Object.entries(data);
        return `
<table class="json-table">
  <tbody>
    ${entries.map(([key, value]) => `
      <tr>
        <th>${key}</th>
        <td>${formatCellValue(value)}</td>
      </tr>
    `).join('')}
  </tbody>
</table>`;
      }
      
      return originalMatch; // Return original if no table conversion possible
    } catch {
      return originalMatch;
    }
  };

  const generateTableHTML = (keys: string[], data: any[]): string => {
    return `
<table class="json-table">
  <thead>
    <tr>
      ${keys.map(key => `<th>${key}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${data.map(item => `
      <tr>
        ${keys.map(key => `<td>${formatCellValue(item[key])}</td>`).join('')}
      </tr>
    `).join('')}
  </tbody>
</table>`;
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.replace(/"/g, '');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Process the content based on detected types
  const contentTypes = detectContentType(content);
  const processedContent = (contentTypes.hasJSON || contentTypes.hasHTML) 
    ? processStructuredContent(content) 
    : content;

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table 
                className="json-table min-w-full border-collapse border border-slate-300 text-sm"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-slate-50" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th 
              className="border border-slate-300 px-3 py-2 text-left font-medium text-slate-700"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td 
              className="border border-slate-300 px-3 py-2 text-slate-600"
              {...props}
            >
              {children}
            </td>
          ),
          tbody: ({ children, ...props }) => (
            <tbody {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="hover:bg-slate-50" {...props}>
              {children}
            </tr>
          ),
          code: ({ inline, children, ...props }) => {
            if (inline) {
              return (
                <code 
                  className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-slate-100 p-3 rounded-lg overflow-x-auto">
                <code className="text-slate-800 text-xs font-mono" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          p: ({ children, ...props }) => (
            <p className="mb-2 last:mb-0" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-2 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-slate-700" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-2"
              {...props}
            >
              {children}
            </blockquote>
          ),
          h1: ({ children, ...props }) => (
            <h1 className="text-lg font-bold mb-2 text-slate-800" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-md font-semibold mb-2 text-slate-800" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-sm font-semibold mb-1 text-slate-800" {...props}>
              {children}
            </h3>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}