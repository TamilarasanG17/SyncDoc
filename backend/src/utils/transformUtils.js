import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window, {
  ALLOWED_TAGS: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'pre',
    'code',
    'ul',
    'li'
  ],
  ALLOWED_ATTR: []
});

/**
 * Week 3 "Transformation Engine": pure, dependency-free functions that
 * walk an AST tree (see models/DocumentNode.js) and render it into other
 * formats. These feed both the Markdown/HTML export endpoints and the
 * PDF renderer in pdfExport.js. DOMPurify-based sanitization of untrusted
 * HTML fragments is a Week 4 concern (Security Hardening) and is
 * intentionally not part of this file - this module only ever reads
 * structured AST content, and escapes it for safe embedding regardless.
 */

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renders one AST node (and its children) as a Markdown fragment. */
function nodeToMarkdown(node, listDepth = 0) {
  switch (node.type) {
    case 'document':
      return (node.children || []).map((child) => nodeToMarkdown(child)).join('\n\n');
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 1, 1), 6);
      return `${'#'.repeat(level)} ${node.content || ''}`;
    }
    case 'codeBlock': {
      const lang = node.attrs?.language || '';
      return `\`\`\`${lang}\n${node.content || ''}\n\`\`\``;
    }
    case 'list':
      return (node.children || [])
        .map((child) => nodeToMarkdown(child, listDepth + 1))
        .join('\n');
    case 'listItem':
      return `${'  '.repeat(Math.max(listDepth - 1, 0))}- ${node.content || ''}`;
    case 'paragraph':
    case 'text':
    default:
      return node.content || '';
  }
}

/** Converts a full AST root into a Markdown document string. */
export function astToMarkdown(root, title) {
  const body = nodeToMarkdown(root);
  return title ? `# ${title}\n\n${body}` : body;
}

/** Renders one AST node (and its children) as an HTML fragment. */
function nodeToHtml(node) {
  switch (node.type) {
    case 'document':
      return (node.children || []).map(nodeToHtml).join('\n');
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 1, 1), 6);
      return `<h${level}>${escapeHtml(node.content)}</h${level}>`;
    }
    case 'codeBlock':
      return `<pre><code>${escapeHtml(node.content)}</code></pre>`;
    case 'list':
      return `<ul>${(node.children || []).map(nodeToHtml).join('')}</ul>`;
    case 'listItem':
      return `<li>${escapeHtml(node.content)}</li>`;
    case 'paragraph':
    case 'text':
    default:
      return `<p>${escapeHtml(node.content)}</p>`;
  }
}

/** Converts a full AST root into a standalone HTML document string. */
export function astToHtml(root, title) {
  const body = purify.sanitize(nodeToHtml(root));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title || 'SyncDoc export')}</title>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title || 'SyncDoc export')}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 720px; margin: 40px auto; color: #14171F; line-height: 1.6; }
  pre { background: #f4f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; }
  code { font-family: 'SFMono-Regular', Consolas, monospace; }
</style>
</head>
<body>
${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
${body}
</body>
</html>`;
}

/**
 * Flattens an AST tree into a linear list of { type, content, level }
 * "print runs" - a format-agnostic intermediate representation that the
 * PDF renderer (pdfkit works line-by-line, not tree-by-tree) can consume
 * without needing to know about AST structure itself.
 */
export function astToPrintRuns(root, runs = []) {
  for (const child of root.children || []) {
    if (child.type === 'heading') {
      runs.push({ type: 'heading', level: Number(child.attrs?.level) || 1, text: child.content || '' });
    } else if (child.type === 'codeBlock') {
      runs.push({ type: 'code', text: child.content || '' });
    } else if (child.type === 'list') {
      for (const item of child.children || []) {
        runs.push({ type: 'listItem', text: item.content || '' });
      }
    } else {
      runs.push({ type: 'paragraph', text: child.content || '' });
    }
    if (child.children && child.type !== 'list') {
      // headings/paragraphs aren't expected to nest further in this
      // schema, but walk defensively in case future block types do.
    }
  }
  return runs;
}
