const {
    transformNode,
    SUPPORTED_NODE_TYPES
} = require("../src/utils/transformNode");

const {
    transformDocument
} = require("../src/utils/transformDocument");

describe("AST Transformation Utilities", () => {
    test("transforms a heading node", () => {
        const node = {
            type: "heading",
            content: "Introduction"
        };

        const result = transformNode(node);

        expect(result).toEqual({
            type: "heading",
            content: "Introduction",
            children: []
        });
    });

    test("transforms a paragraph node", () => {
        const node = {
            type: "paragraph",
            content: "This is a paragraph."
        };

        const result = transformNode(node);

        expect(result).toEqual({
            type: "paragraph",
            content: "This is a paragraph.",
            children: []
        });
    });

    test("transforms a code node", () => {
        const node = {
            type: "code",
            content: "const x = 10;"
        };

        const result = transformNode(node);

        expect(result).toEqual({
            type: "code",
            content: "const x = 10;",
            children: []
        });
    });

    test("transforms nested child nodes recursively", () => {
        const node = {
            type: "section",
            content: "Introduction",
            children: [
                {
                    type: "heading",
                    content: "Overview"
                },
                {
                    type: "paragraph",
                    content: "SyncDoc is a collaborative document engine."
                },
                {
                    type: "section",
                    content: "Details",
                    children: [
                        {
                            type: "paragraph",
                            content: "Nested content."
                        }
                    ]
                }
            ]
        };

        const result = transformNode(node);

        expect(result.children).toHaveLength(3);

        expect(result.children[0]).toEqual({
            type: "heading",
            content: "Overview",
            children: []
        });

        expect(result.children[1]).toEqual({
            type: "paragraph",
            content:
                "SyncDoc is a collaborative document engine.",
            children: []
        });

        expect(result.children[2].children[0]).toEqual({
            type: "paragraph",
            content: "Nested content.",
            children: []
        });
    });

    test("ignores unsupported nodes safely", () => {
        const node = {
            type: "image",
            content: "image.png"
        };

        const result = transformNode(node);

        expect(result).toBeNull();
    });

    test("handles invalid nodes safely", () => {
        expect(transformNode(null)).toBeNull();
        expect(transformNode(undefined)).toBeNull();
        expect(transformNode("invalid")).toBeNull();
    });

    test("does not modify the original AST node", () => {
        const node = {
            type: "section",
            content: "Original",
            children: [
                {
                    type: "paragraph",
                    content: "Child"
                }
            ]
        };

        const originalNode = JSON.parse(
            JSON.stringify(node)
        );

        transformNode(node);

        expect(node).toEqual(originalNode);
    });

    test("preserves node order", () => {
        const node = {
            type: "section",
            content: "Document",
            children: [
                {
                    type: "heading",
                    content: "First"
                },
                {
                    type: "paragraph",
                    content: "Second"
                },
                {
                    type: "code",
                    content: "Third"
                }
            ]
        };

        const result = transformNode(node);

        expect(
            result.children.map((child) => child.content)
        ).toEqual([
            "First",
            "Second",
            "Third"
        ]);
    });

    test("transforms a complete document", () => {
        const document = {
            _id: "document-123",
            title: "SyncDoc Test Document",
            nodes: [
                {
                    type: "heading",
                    content: "Introduction"
                },
                {
                    type: "paragraph",
                    content: "Document content."
                }
            ]
        };

        const result = transformDocument(document);

        expect(result).toEqual({
            documentId: "document-123",
            title: "SyncDoc Test Document",
            nodes: [
                {
                    type: "heading",
                    content: "Introduction",
                    children: []
                },
                {
                    type: "paragraph",
                    content: "Document content.",
                    children: []
                }
            ]
        });
    });

    test("ignores unsupported document nodes", () => {
        const document = {
            _id: "document-456",
            title: "Test",
            nodes: [
                {
                    type: "heading",
                    content: "Valid"
                },
                {
                    type: "unsupported",
                    content: "Invalid"
                },
                {
                    type: "paragraph",
                    content: "Valid paragraph"
                }
            ]
        };

        const result = transformDocument(document);

        expect(result.nodes).toHaveLength(2);

        expect(
            result.nodes.map((node) => node.type)
        ).toEqual([
            "heading",
            "paragraph"
        ]);
    });

    test("preserves deeply nested hierarchy", () => {
        const document = {
            _id: "document-789",
            title: "Nested Document",
            nodes: [
                {
                    type: "section",
                    content: "Level 1",
                    children: [
                        {
                            type: "section",
                            content: "Level 2",
                            children: [
                                {
                                    type: "section",
                                    content: "Level 3",
                                    children: [
                                        {
                                            type: "paragraph",
                                            content: "Deep content"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = transformDocument(document);

        expect(
            result.nodes[0].children[0].children[0].children[0]
        ).toEqual({
            type: "paragraph",
            content: "Deep content",
            children: []
        });
    });

    test("exports all required node types", () => {
        expect(SUPPORTED_NODE_TYPES).toEqual([
            "heading",
            "paragraph",
            "code",
            "text",
            "section"
        ]);
    });
});