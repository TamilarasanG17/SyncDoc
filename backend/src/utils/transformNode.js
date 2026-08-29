const SUPPORTED_NODE_TYPES = new Set([
    "heading",
    "paragraph",
    "code",
    "text",
    "section"
]);

const transformNode = (node) => {
    if (!node || typeof node !== "object") {
        return null;
    }

    if (!SUPPORTED_NODE_TYPES.has(node.type)) {
        return null;
    }

    const transformedNode = {
        type: node.type,
        content:
            typeof node.content === "string"
                ? node.content
                : ""
    };

    if (Array.isArray(node.children)) {
        transformedNode.children = node.children
            .map((child) => transformNode(child))
            .filter(Boolean);
    } else {
        transformedNode.children = [];
    }

    return transformedNode;
};

const transformDocument = (document) => {
    if (!document || typeof document !== "object") {
        return null;
    }

    const transformedDocument = {
        documentId:
            document.documentId ||
            document._id?.toString() ||
            null,

        title:
            typeof document.title === "string"
                ? document.title
                : "",

        nodes: []
    };

    if (Array.isArray(document.nodes)) {
        transformedDocument.nodes = document.nodes
            .map((node) => transformNode(node))
            .filter(Boolean);
    }

    return transformedDocument;
};

module.exports = {
    transformNode,
    transformDocument
};