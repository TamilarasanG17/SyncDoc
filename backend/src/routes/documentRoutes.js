const express = require("express");

const {
    createDocument,
    getDocuments,
    getDocumentById,
    createNodeForDocument
} = require("../controllers/documentController");

const router = express.Router();

router.post("/", createDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.post("/:documentId/nodes", createNodeForDocument);

module.exports = router;