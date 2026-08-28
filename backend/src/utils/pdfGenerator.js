const { transformNode } = require("./transformNode");

/**
 * Converts a transformed AST node into a PDF-oriented structure.
 *
 * The function does not modify the original AST node.
 *
 * Supported node types:
 * - heading
 * - paragraph
 * - code
 * - text
 * - container / parent nodes
 */
const transformNodeForPdf = (node) => {
  if (!node || typeof node !== "object") {
    return null;
  }

  const type =
    typeof node.type === "string"
      ? node.type.trim().toLowerCase()
      : "";

  if (!type) {
    return null;
  }

  const content =
    typeof node.content === "string"
      ? node.content
      : "";

  const children = Array.isArray(node.children)
    ? node.children
        .map(transformNodeForPdf)
        .filter(Boolean)
    : [];

  switch (type) {
    case "heading":
      return {
        type: "heading",
        content,
        children,
        pdf: {
          element: "heading",
        },
      };

    case "paragraph":
      return {
        type: "paragraph",
        content,
        children,
        pdf: {
          element: "paragraph",
        },
      };

    case "code":
      return {
        type: "code",
        content,
        children,
        pdf: {
          element: "code",
        },
      };

    case "text":
      return {
        type: "text",
        content,
        children,
        pdf: {
          element: "text",
        },
      };

    default:
      if (children.length > 0) {
        return {
          type,
          content,
          children,
          pdf: {
            element: "container",
          },
        };
      }

      return null;
  }
};

/**
 * Converts a normalized SyncDoc document
 * into a PDF-oriented document structure.
 *
 * Expected input:
 *
 * {
 *   documentId: "document-id",
 *   title: "Document Title",
 *   nodes: [...]
 * }
 */
const transformDocumentForPdf = (document) => {
  if (!document || typeof document !== "object") {
    return null;
  }

  const documentId =
    typeof document.documentId === "string"
      ? document.documentId
      : "";

  const title =
    typeof document.title === "string"
      ? document.title
      : "";

  const nodes = Array.isArray(document.nodes)
    ? document.nodes
        .map(transformNodeForPdf)
        .filter(Boolean)
    : [];

  return {
    documentId,
    title,
    nodes,
    format: "pdf",
  };
};

/**
 * Converts raw AST document data into
 * normalized data first, then prepares it
 * for PDF output.
 *
 * This keeps the PDF layer independent
 * from MongoDB/Mongoose models.
 */
const createPdfOutput = (document) => {
  if (!document || typeof document !== "object") {
    return null;
  }

  const normalizedNodes = Array.isArray(document.nodes)
    ? document.nodes
        .map(transformNode)
        .filter(Boolean)
    : [];

  const normalizedDocument = {
    documentId:
      typeof document.documentId === "string"
        ? document.documentId
        : "",

    title:
      typeof document.title === "string"
        ? document.title
        : "",

    nodes: normalizedNodes,
  };

  return transformDocumentForPdf(
    normalizedDocument
  );
};

module.exports = {
  transformNodeForPdf,
  transformDocumentForPdf,
  createPdfOutput,
};