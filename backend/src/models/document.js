import mongoose from 'mongoose';
import { documentNodeSchema, traceBlockRelationships } from './DocumentNode.js';

const { Schema } = mongoose;

/**
 * Document schema (Week 1 - "AST Database" module).
 *
 * `root` holds the human-readable/structural AST — this is what Week 3's
 * transformation pipeline (Markdown/PDF export) will walk.
 *
 * `yState` holds the latest binary Yjs update (Y.encodeStateAsUpdate),
 * persisted by the Week 2 sync layer so a document's live CRDT state
 * survives server restarts and new clients can bootstrap instantly
 * instead of replaying history from scratch.
 */
const documentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, default: 'Untitled document' },
    ownerId: { type: String, required: true },
    collaborators: [{ type: String }],
    root: { type: documentNodeSchema, required: true },
    yState: { type: Buffer, default: null },
    lastEditedBy: { type: String, default: null },
  },
  { timestamps: true }
);

// Recursive AST validation/repair, run every time a document is saved
// directly through Mongoose (used for document creation and for the
// periodic AST snapshot the sync layer writes back after CRDT edits).
documentSchema.pre('save', function preSaveDocument(next) {
  if (this.root) {
    traceBlockRelationships(this.root, null, 0);
  }
  next();
});

documentSchema.index({ ownerId: 1, updatedAt: -1 });

export const Document = mongoose.model('Document', documentSchema);
