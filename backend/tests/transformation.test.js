const {
    transformNode,
    transformDocument
} = require("../src/utils/transformNode");

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
            content: "Hello SyncDoc"
        };

        const result = transformNode(node);

        expect(result).toEqual({
            type: "paragraph",
            content: "Hello SyncDoc",
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

    test("transforms a text node", () => {
        const node = {
            type: "text",
            content: "Hello"
        };

        const result = transformNode(node);

        expect(result).toEqual({
            type: "text",
            content: "Hello",
            children: []
        });
    });

    test("recursively transforms nested children", () => {
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
                    content: "SyncDoc is a collaborative editor."
                }
            ]
        };

        const result = transformNode(node);

        expect(result).toEqual({
            type: "section",
            content: "Introduction",
            children: [
                {
                    type: "heading",
                    content: "Overview",
                    children: []
                },
                {
                    type: "paragraph",
                    content: "SyncDoc is a collaborative editor.",
                    children: []
                }
            ]
        });
    });

    test("recursively transforms deeply nested nodes", () => {
        const node = {
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
        };

        const result = transformNode(node);

        expect(
            result.children[0]
                .children[0]
                .children[0]
        ).toEqual({
            type: "paragraph",
            content: "Deep content",
            children: []
        });
    });

    test("preserves child order during recursive transformation", () => {
        const node = {
            type: "section",
            content: "Section",
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
            result.children.map(
                (child) => child.content
            )
        ).toEqual([
            "First",
            "Second",
            "Third"
        ]);
    });

    test("preserves parent-child relationships", () => {
        const node = {
            type: "section",
            content: "Parent",
            children: [
                {
                    type: "section",
                    content: "Child",
                    children: [
                        {
                            type: "paragraph",
                            content: "Grandchild"
                        }
                    ]
                }
            ]
        };

        const result = transformNode(node);

        expect(result.type).toBe("section");

        expect(
            result.children[0].type
        ).toBe("section");

        expect(
            result.children[0].children[0].type
        ).toBe("paragraph");
    });

    test("ignores unsupported nodes safely", () => {
        const node = {
            type: "image",
            content: "image.png"
        };

        const result = transformNode(node);

        expect(result).toBeNull();
    });

    test("removes unsupported nested children without breaking hierarchy", () => {
        const node = {
            type: "section",
            content: "Section",
            children: [
                {
                    type: "paragraph",
                    content: "Valid paragraph"
                },
                {
                    type: "unsupported",
                    content: "Invalid node"
                },
                {
                    type: "code",
                    content: "const x = 10;"
                }
            ]
        };

        const result = transformNode(node);

        expect(result.children).toHaveLength(2);

        expect(
            result.children[0].type
        ).toBe("paragraph");

        expect(
            result.children[1].type
        ).toBe("code");
    });

    test("handles nodes without children", () => {
        const node = {
            type: "paragraph",
            content: "No children"
        };

        const result = transformNode(node);

        expect(result.children).toEqual([]);
    });

    test("handles empty children array", () => {
        const node = {
            type: "section",
            content: "Empty section",
            children: []
        };

        const result = transformNode(node);

        expect(result.children).toEqual([]);
    });

    test("does not modify the original AST", () => {
        const original = {
            type: "section",
            content: "Original",
            children: [
                {
                    type: "paragraph",
                    content: "Original child"
                }
            ]
        };

        const originalCopy =
            JSON.parse(
                JSON.stringify(original)
            );

        const result =
            transformNode(original);

        result.content = "Modified";

        result.children[0].content =
            "Modified child";

        expect(original).toEqual(
            originalCopy
        );
    });

    test("transforms a complete document recursively", () => {
        const document = {
            documentId: "document-123",
            title: "SyncDoc Document",
            nodes: [
                {
                    type: "heading",
                    content: "Introduction"
                },
                {
                    type: "section",
                    content: "Main Section",
                    children: [
                        {
                            type: "paragraph",
                            content: "Main content"
                        },
                        {
                            type: "section",
                            content: "Nested Section",
                            children: [
                                {
                                    type: "code",
                                    content: "const x = 10;"
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result =
            transformDocument(document);

        expect(result).toEqual({
            documentId: "document-123",
            title: "SyncDoc Document",
            nodes: [
                {
                    type: "heading",
                    content: "Introduction",
                    children: []
                },
                {
                    type: "section",
                    content: "Main Section",
                    children: [
                        {
                            type: "paragraph",
                            content: "Main content",
                            children: []
                        },
                        {
                            type: "section",
                            content: "Nested Section",
                            children: [
                                {
                                    type: "code",
                                    content: "const x = 10;",
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });

    test("handles invalid node input safely", () => {
        expect(
            transformNode(null)
        ).toBeNull();

        expect(
            transformNode(undefined)
        ).toBeNull();

        expect(
            transformNode("invalid")
        ).toBeNull();
    });

    test("handles invalid document input safely", () => {
        expect(
            transformDocument(null)
        ).toBeNull();

        expect(
            transformDocument(undefined)
        ).toBeNull();
    });
});