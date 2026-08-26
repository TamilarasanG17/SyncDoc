const SUPPORTED_NODE_TYPES = [
    "heading",
    "paragraph",
    "code",
    "text",
    "section"
];

const transformNode = (node) => {
    if (!node || typeof node !== "object") {
        return null;
    }

    if (!SUPPORTED_NODE_TYPES.includes(node.type)) {
        return null;
    }

    const transformedNode = {
        type: node.type,
        content:
            typeof node.content === "string"
                ? node.content
                : "",
        children: []
    };

    if (Array.isArray(node.children)) {
        transformedNode.children = node.children
            .map(transformNode)
            .filter(Boolean);
    }

    return transformedNode;
};

module.exports = {
    transformNode,
    SUPPORTED_NODE_TYPES
};