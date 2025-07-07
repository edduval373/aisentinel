import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface MessageRendererProps {
  content: string;
  className?: string;
}

export default function MessageRenderer({ content, className }: MessageRendererProps) {
  // Try to detect if the content contains JSON data
  const containsJSON = (text: string): boolean => {
    try {
      // Look for JSON-like patterns
      const jsonPatterns = [
        /\{[\s\S]*\}/,  // Objects
        /\[[\s\S]*\]/,  // Arrays
      ];
      
      return jsonPatterns.some(pattern => pattern.test(text));
    } catch {
      return false;
    }
  };

  // Format JSON content into a table if possible
  const formatJSONAsTable = (text: string): string => {
    try {
      // Try to find and parse JSON objects in the text
      const jsonRegex = /(\{[\s\S]*?\}|\[[\s\S]*?\])/g;
      const matches = text.match(jsonRegex);
      
      if (!matches) return text;

      let formattedText = text;
      
      matches.forEach(match => {
        try {
          const parsed = JSON.parse(match);
          
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            // Convert array of objects to HTML table
            const keys = Object.keys(parsed[0]);
            const tableHTML = `
<table class="json-table">
  <thead>
    <tr>
      ${keys.map(key => `<th>${key}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${parsed.map(item => `
      <tr>
        ${keys.map(key => `<td>${JSON.stringify(item[key] || '')}</td>`).join('')}
      </tr>
    `).join('')}
  </tbody>
</table>
            `;
            formattedText = formattedText.replace(match, tableHTML);
          } else if (typeof parsed === 'object' && parsed !== null) {
            // Convert single object to HTML table
            const tableHTML = `
<table class="json-table">
  <tbody>
    ${Object.entries(parsed).map(([key, value]) => `
      <tr>
        <th>${key}</th>
        <td>${JSON.stringify(value)}</td>
      </tr>
    `).join('')}
  </tbody>
</table>
            `;
            formattedText = formattedText.replace(match, tableHTML);
          }
        } catch {
          // If parsing fails, leave the original text
        }
      });
      
      return formattedText;
    } catch {
      return text;
    }
  };

  // Process the content
  const processedContent = containsJSON(content) ? formatJSONAsTable(content) : content;

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table 
                className="min-w-full border-collapse border border-slate-300 text-sm"
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