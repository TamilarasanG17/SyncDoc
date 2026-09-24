import PDFDocument from 'pdfkit';
import { astToPrintRuns } from './transformUtils.js';

/**
 * Renders an AST tree into a PDF buffer using pdfkit - a pure-JS PDF
 * generator (no headless browser / native binary needed), which keeps
 * this transformation self-contained inside the Node.js backend.
 *
 * Returns a Promise<Buffer> so the export controller can just stream it
 * straight into the HTTP response.
 */
export function astToPdfBuffer(root, title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    if (title) {
      doc.font('Helvetica-Bold').fontSize(22).text(title, { align: 'left' });
      doc.moveDown(1);
    }

    const runs = astToPrintRuns(root);
    for (const run of runs) {
      switch (run.type) {
        case 'heading': {
          const size = Math.max(20 - (run.level - 1) * 3, 11);
          doc.font('Helvetica-Bold').fontSize(size).text(run.text || '');
          doc.moveDown(0.5);
          break;
        }
        case 'code': {
          doc.moveDown(0.25);
          const startY = doc.y;
          const boxHeight = doc.font('Courier').fontSize(10).heightOfString(run.text || '', {
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 16,
          });
          doc
            .rect(doc.page.margins.left, startY, doc.page.width - doc.page.margins.left - doc.page.margins.right, boxHeight + 16)
            .fill('#F4F4F6');
          doc
            .fillColor('#14171F')
            .font('Courier')
            .fontSize(10)
            .text(run.text || '', doc.page.margins.left + 8, startY + 8, {
              width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 16,
            });
          doc.moveDown(1);
          break;
        }
        case 'listItem':
          doc.font('Helvetica').fontSize(11).text(`•  ${run.text || ''}`, { indent: 12 });
          doc.moveDown(0.25);
          break;
        case 'paragraph':
        default:
          doc.font('Helvetica').fontSize(11).text(run.text || '');
          doc.moveDown(0.5);
      }
    }

    doc.end();
  });
}
