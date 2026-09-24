import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  createDocument,
  deleteDocument,
  addCollaborator,
} from '../controllers/documentController.js';

import { exportDocument } from '../controllers/exportController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listDocuments);

router.post('/', requireAuth, createDocument);

router.get('/:id', requireAuth, getDocument);

router.delete('/:id', requireAuth, deleteDocument);

router.post('/:id/collaborators', requireAuth, addCollaborator);

router.get('/:id/export/:format', requireAuth, exportDocument);

export default router;