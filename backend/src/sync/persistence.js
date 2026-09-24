import * as Y from 'yjs';
import { Document } from '../models/Document.js';
import { yBlocksToAst, astToYBlocks } from '../utils/astUtils.js';

const SAVE_DEBOUNCE_MS = 1500;
const timers = new Map(); // docName -> Timeout

/**
 * Loads a document's persisted state into a freshly-created Y.Doc.
 * Prefers the raw binary `yState` (exact CRDT history) when present, since
 * that reproduces the document byte-for-byte. Falls back to rebuilding the
 * Y.Doc from the structural AST for documents that predate any live
 * editing session (or were created purely through the REST API).
 */
export async function loadIntoYDoc(docName, ydoc) {
  const doc = await Document.findById(docName).lean();
  if (!doc) return false;

  if (doc.yState && doc.yState.length) {
    Y.applyUpdate(ydoc, new Uint8Array(doc.yState));
  } else if (doc.root) {
    astToYBlocks(ydoc, doc.root);
  }
  return true;
}

/**
 * Persists the current Y.Doc state back to MongoDB:
 *  - `yState`: exact binary CRDT snapshot (fast, lossless bootstrap)
 *  - `root`: re-derived AST tree (keeps the "AST Database" module live so
 *    the transformation pipeline / document browser always reflect the
 *    latest collaborative edits, not just the initial seed)
 */
async function persistNow(docName, ydoc, editorId) {
  const update = Y.encodeStateAsUpdate(ydoc);
  const astRoot = yBlocksToAst(ydoc);
  await Document.findByIdAndUpdate(docName, {
    yState: Buffer.from(update),
    root: astRoot,
    lastEditedBy: editorId || null,
  });
}

/**
 * Debounced persistence: called on every Yjs update, but only actually
 * writes to Mongo after edits settle for SAVE_DEBOUNCE_MS. Keeps the
 * "AST Database" durable without hammering MongoDB on every keystroke.
 */
export function schedulePersist(docName, ydoc, editorId) {
  clearTimeout(timers.get(docName));
  const timeout = setTimeout(() => {
    persistNow(docName, ydoc, editorId).catch((err) =>
      console.error(`[persistence] failed to save ${docName}:`, err.message)
    );
  }, SAVE_DEBOUNCE_MS);
  timers.set(docName, timeout);
}

/** Flushes immediately - used when the last client disconnects from a document. */
export async function flushPersist(docName, ydoc, editorId) {
  clearTimeout(timers.get(docName));
  timers.delete(docName);
  await persistNow(docName, ydoc, editorId);
}
