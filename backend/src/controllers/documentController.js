import { Document } from '../models/Document.js';

import mongoose from 'mongoose';

const newNodeId = () => new mongoose.Types.ObjectId().toString();

const EMPTY_ROOT = () => ({
  nodeId: 'root',
  type: 'document',
  attrs: {},
  content: '',
  children: [
    {
      nodeId: newNodeId(),
      type: 'heading',
      attrs: { level: 1 },
      content: 'Untitled document',
      children: [],
    },
    {
      nodeId: newNodeId(),
      type: 'paragraph',
      attrs: {},
      content: 'Start typing…',
      children: [],
    },
  ],
});

/** GET /api/documents - list documents (Week 1: "browsing documents") */
export async function listDocuments(req, res) {
  const docs = await Document.find({}, 'title ownerId collaborators updatedAt createdAt')
    .sort({ updatedAt: -1 })
    .lean();
  res.json(docs);
}

/** GET /api/documents/:id - fetch one document's current AST snapshot */
export async function getDocument(req, res) {
  const doc = await Document.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
}

/** POST /api/documents - create a new document with a seed AST */
export async function createDocument(req, res) {
  const { title, ownerId } = req.body;
  if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });

  const doc = new Document({
    title: title || 'Untitled document',
    ownerId,
    collaborators: [ownerId],
    root: EMPTY_ROOT(),
  });
  await doc.save();
  res.status(201).json(doc);
}

/** DELETE /api/documents/:id */
export async function deleteDocument(req, res) {
  const deleted = await Document.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Document not found' });
  res.status(204).send();
}
