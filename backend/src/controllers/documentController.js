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

/**
 * GET /api/documents
 * List documents accessible to the logged-in user.
 *
 * User can see:
 * 1. Documents they own
 * 2. Documents where they are a collaborator
 */
export async function listDocuments(req, res) {
  try {
    const userId = req.user.id;

    const docs = await Document.find(
      {
        $or: [
          { ownerId: userId },
          { collaborators: userId },
        ],
      },
      'title ownerId collaborators updatedAt createdAt'
    )
      .sort({ updatedAt: -1 })
      .lean();

    res.json(docs);
  } catch (error) {
    console.error('[documents] list error:', error);

    res.status(500).json({
      error: 'Unable to fetch documents',
    });
  }
}

/**
 * GET /api/documents/:id
 * Fetch one document's current AST snapshot.
 *
 * Only the owner or a collaborator can access it.
 */
export async function getDocument(req, res) {
  try {
    const userId = req.user.id;

    const doc = await Document.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: userId },
        { collaborators: userId },
      ],
    }).lean();

    if (!doc) {
      return res.status(404).json({
        error: 'Document not found',
      });
    }

    res.json(doc);
  } catch (error) {
    console.error('[documents] get error:', error);

    res.status(500).json({
      error: 'Unable to fetch document',
    });
  }
}

/**
 * POST /api/documents
 * Create a new document with a seed AST.
 *
 * IMPORTANT:
 * ownerId is taken from the authenticated JWT,
 * NOT from req.body.
 */
export async function createDocument(req, res) {
  try {
    const { title } = req.body;

    // Get the owner from the authenticated user.
    const ownerId = req.user.id;

    const doc = new Document({
      title: title || 'Untitled document',
      ownerId,
      collaborators: [ownerId],
      root: EMPTY_ROOT(),
    });

    await doc.save();

    res.status(201).json(doc);
  } catch (error) {
    console.error('[documents] create error:', error);

    res.status(500).json({
      error: 'Unable to create document',
    });
  }
}

/**
 * DELETE /api/documents/:id
 *
 * Only the owner can delete a document.
 * Collaborators cannot delete it.
 */
/**
 * POST /api/documents/:id/collaborators
 *
 * Owner can share a document with another registered user.
 */
export async function addCollaborator(req, res) {
  try {
    const ownerId = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Collaborator email is required',
      });
    }

    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId,
    });

    if (!doc) {
      return res.status(404).json({
        error: 'Document not found or you are not the owner',
      });
    }

    const { User } = await import('../models/User.js');

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).lean();

    if (!user) {
      return res.status(404).json({
        error: 'User with this email does not exist',
      });
    }

    if (doc.collaborators.includes(user._id.toString())) {
      return res.status(400).json({
        error: 'User is already a collaborator',
      });
    }

    doc.collaborators.push(user._id.toString());

    await doc.save();

    res.json({
      message: 'Collaborator added successfully',
      collaborator: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[documents] add collaborator error:', error);

    res.status(500).json({
      error: 'Unable to add collaborator',
    });
  }
}
export async function deleteDocument(req, res) {
  try {
    const userId = req.user.id;

    const deleted = await Document.findOneAndDelete({
      _id: req.params.id,
      ownerId: userId,
    });
    

    if (!deleted) {
      return res.status(404).json({
        error: 'Document not found or you are not the owner',
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('[documents] delete error:', error);

    res.status(500).json({
      error: 'Unable to delete document',
    });
    
  }
  
}