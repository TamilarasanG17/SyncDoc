const Document = require("../models/document");

const createDocument = async (req, res) => {
    try {
        const { title } = req.body;

        const document = await Document.create({
            title
        });

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create document",
            error: error.message
        });
    }
};

const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find().sort({ createdAt: -1 });

        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve documents",
            error: error.message
        });
    }
};

const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.status(200).json(document);
    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve document",
            error: error.message
        });
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocumentById
};