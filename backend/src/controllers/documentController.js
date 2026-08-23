const Document = require("../models/document");
const Node = require("../models/node");

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
        const documents = await Document.find()
            .populate({
                path: "nodes",
                populate: {
                    path: "children",
                    populate: {
                        path: "children"
                    }
                }
            })
            .sort({ createdAt: -1 });

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
        const document = await Document.findById(req.params.id)
            .populate({
                path: "nodes",
                populate: {
                    path: "children",
                    populate: {
                        path: "children"
                    }
                }
            });

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

const createNodeForDocument = async (req, res) => {
    try {
        const { type, content, children } = req.body;

        const document = await Document.findById(
            req.params.documentId
        );

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        const node = await Node.create({
            type,
            content,
            children
        });

        document.nodes.push(node._id);

        await document.save();

        res.status(201).json({
            message: "Node created and attached to document",
            node
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create node",
            error: error.message
        });
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocumentById,
    createNodeForDocument
};