import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function parseMarkdown(md: string): string {
  let html = md;

  html = html.replace(/^### (.+)$/gm, '<h3 id="$1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 id="$1">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  html = html.replace(/^---$/gm, '<hr/>');

  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre><code class="lang-${lang || 'text'}">${escaped}</code></pre>`;
  });

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Tables
  html = html.replace(
    /^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm,
    (_match, headerRow, bodyRows) => {
      const headers = headerRow
        .split('|')
        .map((h: string) => h.trim())
        .filter(Boolean);
      const rows = bodyRows
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((row: string) =>
          row
            .split('|')
            .map((c: string) => c.trim())
            .filter(Boolean),
        );
      const thead = `<thead><tr>${headers.map((h: string) => `<th>${h}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map(
          (row: string[]) =>
            `<tr>${row.map((c: string) => `<td>${c}</td>`).join('')}</tr>`,
        )
        .join('')}</tbody>`;
      return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
    },
  );

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isBlock =
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('<table') ||
      trimmed === '';

    if (isBlock) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(line);
    } else {
      if (!inParagraph) {
        result.push('<p>');
        inParagraph = true;
      }
      result.push(line);
    }
  }
  if (inParagraph) result.push('</p>');

  return result.join('\n');
}

export default function DocsPage() {
  const filePath = path.join(process.cwd(), 'API-DOCS.md');
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    content = '# API Documentation\n\nDocumentation file not found.';
  }

  const htmlContent = parseMarkdown(content);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            Activepieces License Key Manager — API Docs
          </h1>
          <a
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div
          className="api-docs prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </main>

      <style>{`
        .api-docs h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #111827;
          margin-bottom: 0.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e5e7eb;
        }
        .api-docs h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .api-docs h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .api-docs p {
          color: #4b5563;
          line-height: 1.7;
          margin-bottom: 1rem;
        }
        .api-docs strong {
          color: #1f2937;
        }
        .api-docs code {
          background: #f3f4f6;
          color: #dc2626;
          padding: 0.15rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .api-docs pre {
          background: #1f2937;
          color: #e5e7eb;
          padding: 1rem 1.25rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1.25rem;
          font-size: 0.8125rem;
          line-height: 1.6;
        }
        .api-docs pre code {
          background: none;
          color: inherit;
          padding: 0;
          font-size: inherit;
        }
        .api-docs hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 2.5rem 0;
        }
        .api-docs .table-wrap {
          overflow-x: auto;
          margin-bottom: 1.25rem;
        }
        .api-docs table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .api-docs th {
          text-align: left;
          padding: 0.625rem 0.75rem;
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
        }
        .api-docs td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
        }
        .api-docs tr:hover td {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}
