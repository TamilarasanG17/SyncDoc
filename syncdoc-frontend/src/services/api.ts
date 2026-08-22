// import type { ASTDocument } from "../data/astDocuments";
// import { astDocuments } from "../data/astDocuments";

// const API_BASE_URL = "http://localhost:5000/api";

// export type { ASTDocument };

// export async function fetchDocuments(): Promise<ASTDocument[]> {
//   try {
//     const response = await fetch(`${API_BASE_URL}/documents`);
//     if (!response.ok) throw new Error("Failed to fetch documents");
//     return await response.json();
//   } catch (error) {
//     console.warn("Backend unavailable, using local AST sample data:", error);
//     return astDocuments;
//   }
// }

// export async function fetchDocumentById(
//   id: string
// ): Promise<ASTDocument | undefined> {
//   try {
//     const response = await fetch(`${API_BASE_URL}/documents/${id}`);
//     if (!response.ok) throw new Error("Failed to fetch document");
//     return await response.json();
//   } catch (error) {
//     console.warn("Backend unavailable, using local AST sample data:", error);
//     return astDocuments.find((doc) => doc.id === id);
//   }
// }

import type { DocumentBlock } from "../types";
import { astDocuments } from "../data/astDocuments";

const API_BASE_URL = "http://localhost:5000/api";

export interface ASTDocument {
  id: string;
  title: string;
  updatedAt: string;
  blocks: DocumentBlock[];
}

// Backend's raw shape: _id, nodes (populated Node docs OR unpopulated ObjectId
// strings, depending on which endpoint returned them), no `level` field.
interface RawNode {
  _id: string;
  type: string;
  content: string;
  children?: (RawNode | string)[];
}

interface RawDocument {
  _id: string;
  title: string;
  updatedAt: string;
  nodes?: (RawNode | string)[];
}

function nodeToBlock(node: RawNode | string): DocumentBlock | null {
  if (typeof node === "string") {
    console.warn("Encountered unpopulated node reference:", node);
    return null;
  }

  return {
    id: node._id,
    type: node.type as DocumentBlock["type"],
    content: node.content,
    children: node.children
      ?.map(nodeToBlock)
      .filter((b): b is DocumentBlock => b !== null),
  };
}

function documentToASTDocument(doc: RawDocument): ASTDocument {
  return {
    id: doc._id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    blocks: (doc.nodes ?? [])
      .map(nodeToBlock)
      .filter((b): b is DocumentBlock => b !== null),
  };
}

export async function fetchDocuments(): Promise<ASTDocument[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) throw new Error("Failed to fetch documents");
    const raw: RawDocument[] = await response.json();
    return raw.map(documentToASTDocument);
  } catch (error) {
    console.warn("Falling back to local AST sample data:", error);
    return astDocuments;
  }
}

export async function fetchDocumentById(id: string): Promise<ASTDocument | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`);
    if (!response.ok) throw new Error("Failed to fetch document");
    const raw: RawDocument = await response.json();
    return documentToASTDocument(raw);
  } catch (error) {
    console.warn("Falling back to local AST sample data:", error);
    return astDocuments.find((doc) => doc.id === id);
  }
}

export async function createDocument(title: string): Promise<ASTDocument> {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error("Failed to create document");
  const raw: RawDocument = await response.json();
  return documentToASTDocument(raw);
}

export async function createNode(
  documentId: string,
  node: { type: string; content: string; children?: string[] }
): Promise<{ _id: string }> {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/nodes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(node),
  });
  if (!response.ok) throw new Error("Failed to create node");
  const result = await response.json();
  return result.node;
}