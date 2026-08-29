const {
  transformNodeForPdf,
  transformDocumentForPdf,
  createPdfOutput,
} = require("../src/utils/pdfGenerator");

describe("PDF output transformation", () => {
  test("transforms a heading for PDF output", () => {
    const node = {
      type: "heading",
      content: "Introduction",
    };

    const result = transformNodeForPdf(node);

    expect(result).toEqual({
      type: "heading",
      content: "Introduction",
      children: [],
      pdf: {
        element: "heading",
      },
    });
  });

  test("transforms a paragraph for PDF output", () => {
    const node = {
      type: "paragraph",
      content: "SyncDoc is a collaborative editor.",
    };

    const result = transformNodeForPdf(node);

    expect(result).toEqual({
      type: "paragraph",
      content: "SyncDoc is a collaborative editor.",
      children: [],
      pdf: {
        element: "paragraph",
      },
    });
  });

  test("transforms a code block for PDF output", () => {
    const node = {
      type: "code",
      content: "const value = 10;",
    };

    const result = transformNodeForPdf(node);

    expect(result).toEqual({
      type: "code",
      content: "const value = 10;",
      children: [],
      pdf: {
        element: "code",
      },
    });
  });

  test("transforms nested nodes recursively", () => {
    const node = {
      type: "section",
      content: "Introduction",
      children: [
        {
          type: "heading",
          content: "Overview",
        },
        {
          type: "paragraph",
          content: "SyncDoc document.",
        },
        {
          type: "code",
          content: "const x = 10;",
        },
      ],
    };

    const result = transformNodeForPdf(node);

    expect(result.type).toBe("section");
    expect(result.content).toBe("Introduction");

    expect(result.pdf.element).toBe("container");

    expect(result.children).toHaveLength(3);

    expect(result.children[0].type).toBe("heading");
    expect(result.children[1].type).toBe("paragraph");
    expect(result.children[2].type).toBe("code");
  });

  test("preserves node order", () => {
    const document = {
      documentId: "doc-1",
      title: "Test Document",
      nodes: [
        {
          type: "heading",
          content: "First",
        },
        {
          type: "paragraph",
          content: "Second",
        },
        {
          type: "code",
          content: "Third",
        },
      ],
    };

    const result =
      transformDocumentForPdf(document);

    expect(result.nodes[0].content).toBe("First");
    expect(result.nodes[1].content).toBe("Second");
    expect(result.nodes[2].content).toBe("Third");
  });

  test("preserves document metadata", () => {
    const document = {
      documentId: "doc-123",
      title: "SyncDoc Test",
      nodes: [],
    };

    const result =
      transformDocumentForPdf(document);

    expect(result.documentId).toBe("doc-123");
    expect(result.title).toBe("SyncDoc Test");
    expect(result.format).toBe("pdf");
  });

  test("ignores unsupported leaf nodes safely", () => {
    const node = {
      type: "image",
      content: "image-data",
    };

    const result = transformNodeForPdf(node);

    expect(result).toBeNull();
  });

  test("preserves supported children inside an unsupported parent", () => {
    const node = {
      type: "custom-container",
      children: [
        {
          type: "heading",
          content: "Nested Heading",
        },
      ],
    };

    const result = transformNodeForPdf(node);

    expect(result).not.toBeNull();
    expect(result.type).toBe("custom-container");
    expect(result.pdf.element).toBe("container");
    expect(result.children).toHaveLength(1);
    expect(result.children[0].type).toBe("heading");
  });

  test("does not modify the original AST", () => {
    const document = {
      documentId: "doc-1",
      title: "Original",
      nodes: [
        {
          type: "section",
          content: "Section",
          children: [
            {
              type: "paragraph",
              content: "Original content",
            },
          ],
        },
      ],
    };

    const original =
      JSON.parse(JSON.stringify(document));

    createPdfOutput(document);

    expect(document).toEqual(original);
  });

  test("creates PDF output from raw AST nodes", () => {
    const document = {
      documentId: "doc-10",
      title: "Export Test",
      nodes: [
        {
          type: "heading",
          content: "Hello",
        },
        {
          type: "section",
          content: "Body",
          children: [
            {
              type: "paragraph",
              content: "SyncDoc content",
            },
          ],
        },
      ],
    };

    const result = createPdfOutput(document);

    expect(result.documentId).toBe("doc-10");
    expect(result.title).toBe("Export Test");
    expect(result.format).toBe("pdf");

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].type).toBe("heading");
    expect(result.nodes[1].type).toBe("section");
    expect(result.nodes[1].children[0].type).toBe(
      "paragraph"
    );
  });
});