const { transformNode } = require("./transformNode");

const transformDocument = (document) => {
    if (!document || typeof document !== "object") {
        return null;
    }

    const transformedDocument = {
        documentId: document._id
            ? document._id.toString()
            : document.documentId || "",
        title:
            typeof document.title === "string"
                ? document.title
                : "",
        nodes: []
    };

    if (Array.isArray(document.nodes)) {
        transformedDocument.nodes = document.nodes
            .map(transformNode)
            .filter(Boolean);
    }

    return transformedDocument;
};

module.exports = {
    transformDocument
};