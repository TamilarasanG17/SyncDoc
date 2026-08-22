import type { ASTDocument } from "../data/astDocuments";
import { astDocuments } from "../data/astDocuments";

const API_BASE_URL = "http://localhost:5000/api";

export type { ASTDocument };

export async function fetchDocuments(): Promise<ASTDocument[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) throw new Error("Failed to fetch documents");
    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable, using local AST sample data:", error);
    return astDocuments;
  }
}

export async function fetchDocumentById(
  id: string
): Promise<ASTDocument | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`);
    if (!response.ok) throw new Error("Failed to fetch document");
    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable, using local AST sample data:", error);
    return astDocuments.find((doc) => doc.id === id);
  }
}