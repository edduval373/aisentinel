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
      
      // 3. Final cleanup and enhancement
      processedText = enhanceMarkdownTables(processedText);
      
      return processedText;
    } catch (error) {
      console.error('Error processing structured content:', error);
      return text;
    }
  };

  // Process JSON content and convert to HTML tables
  const processJSONContent = (text: string): string => {
    const jsonPatterns = [
      /```json\s*\n([\s\S]*?)\n```/gi,
      /```\s*\n(\{[\s\S]*?\}|\[[\s\S]*?\])\n```/g,
    ];
    
    let result = text;
    
    jsonPatterns.forEach(pattern => {
      result = result.replace(pattern, (match, jsonContent) => {
        try {
          const parsedData = JSON.parse(jsonContent.trim());
          return convertToTable(parsedData, match);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          return match;
        }
      });
    });
    
    return result;
  };

  const processHTMLTables = (text: string): string => {
    try {
      return text.replace(/```html\s*\n([\s\S]*?<table[\s\S]*?<\/table>[\s\S]*?)\n```/gi, (match, htmlContent) => {
        try {
          // Add styling classes to HTML tables
          return htmlContent.replace(/<table([^>]*)>/gi, '<table class="json-table"$1>');
        } catch (error) {
          console.error('Error processing HTML table:', error);
          return match;
        }
      });
    } catch (error) {
      console.error('Error in processHTMLTables:', error);
      return text;
    }
  };

  const convertToTable = (data: any, originalMatch: string): string => {
    try {
      if (Array.isArray(data)) {
        if (data.length === 0) return originalMatch;
        
        const firstItem = data[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          // Array of objects - convert to table
          const headers = Object.keys(firstItem);
          const headerRow = headers.map(h => `<th>${h}</th>`).join('');
          const bodyRows = data.map(item => 
            headers.map(h => `<td>${item[h] || ''}</td>`).join('')
          ).map(row => `<tr>${row}</tr>`).join('');
          
          return `<table class="json-table"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
        } else {
          // Array of primitives
          const rows = data.map(item => `<tr><td>${item}</td></tr>`).join('');
          return `<table class="json-table"><thead><tr><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`;
        }
      } else if (typeof data === 'object' && data !== null) {
        // Single object - convert to key-value table
        const rows = Object.entries(data).map(([key, value]) => {
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return `<tr><td><strong>${key}</strong></td><td>${displayValue}</td></tr>`;
        }).join('');
        
        return `<table class="json-table"><thead><tr><th>Property</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`;
      }
      
      return originalMatch;
    } catch (error) {
      console.error('Error converting to table:', error);
      return originalMatch;
    }
  };

  const enhanceMarkdownTables = (text: string): string => {
    try {
      // Add responsive wrapper to markdown tables
      return text.replace(/(\|[\s\S]*?\|[\s\S]*?\n[\s\S]*?\|[\s\S]*?-[\s\S]*?\|[\s\S]*?)(?=\n\n|\n$|$)/gm, (match) => {
        return `<div class="table-container">\n\n${match}\n\n</div>`;
      });
    } catch (error) {
      console.error('Error enhancing markdown tables:', error);
      return text;
    }
  };

  try {
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
              <div className="table-container">
                <table className="json-table" {...props}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th className="bg-slate-50 font-semibold text-slate-900 border border-slate-200 px-3 py-2" {...props}>
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-slate-200 px-3 py-2 text-slate-700" {...props}>
                {children}
              </td>
            ),
            pre: ({ children, ...props }) => (
              <pre className="bg-slate-100 border rounded-md p-3 overflow-x-auto text-sm" {...props}>
                {children}
              </pre>
            ),
            code: ({ children, className, ...props }) => {
              const isInline = !className?.includes('language-');
              return (
                <code 
                  className={cn(
                    isInline 
                      ? "bg-slate-100 px-1 py-0.5 rounded text-sm font-mono text-slate-800" 
                      : "text-sm font-mono",
                    className
                  )} 
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p: ({ children, ...props }) => (
              <p className="mb-2 text-sm text-slate-700 leading-relaxed" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside mb-2 text-sm text-slate-700" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal list-inside mb-2 text-sm text-slate-700" {...props}>
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li className="mb-1" {...props}>
                {children}
              </li>
            ),
            h1: ({ children, ...props }) => (
              <h1 className="text-lg font-bold mb-2 text-slate-900" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-base font-semibold mb-2 text-slate-900" {...props}>
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
  } catch (error) {
    console.error('MessageRenderer error:', error);
    // Fallback to simple text rendering if there's an error
    return (
      <div className={cn("text-sm text-slate-700", className)}>
        <pre className="whitespace-pre-wrap">{content}</pre>
      </div>
    );
  }
}