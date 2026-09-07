import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  createDocument,
  deleteDocument,
} from '../controllers/documentController.js';
import { exportDocument } from '../controllers/exportController.js';

const router = Router();

router.get('/', listDocuments);
router.post('/', createDocument);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);
router.get('/:id/export/:format', exportDocument);

export default router;
