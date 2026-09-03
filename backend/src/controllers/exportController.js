import { Document } from '../models/Document.js';
import { astToMarkdown, astToHtml } from '../utils/transformUtils.js';
import { astToPdfBuffer } from '../utils/pdfExport.js';

const SUPPORTED_FORMATS = new Set(['markdown', 'html', 'pdf']);

function slugify(title = 'document') {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'document';
}

/**
 * GET /api/documents/:id/export/:format
 * Week 3 "Transformation Engine": exports the durable AST snapshot
 * (Document.root) into Markdown, standalone HTML, or a PDF.
 */
export async function exportDocument(req, res) {
  const { id, format } = req.params;
  if (!SUPPORTED_FORMATS.has(format)) {
    return res.status(400).json({ error: `Unsupported export format "${format}". Use markdown, html, or pdf.` });
  }

  const doc = await Document.findById(id).lean();
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const filenameBase = slugify(doc.title);

  if (format === 'markdown') {
    const markdown = astToMarkdown(doc.root, doc.title);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.md"`);
    return res.send(markdown);
  }

  if (format === 'html') {
    const html = astToHtml(doc.root, doc.title);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.html"`);
    return res.send(html);
  }

  // format === 'pdf'
  try {
    const pdfBuffer = await astToPdfBuffer(doc.root, doc.title);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[export] PDF generation failed:', err.message);
    return res.status(500).json({ error: 'PDF generation failed' });
  }
}
