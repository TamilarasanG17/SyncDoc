export interface Document {
  id: string;
  title: string;
  updatedAt: string;
}

export type BlockType = "heading" | "paragraph" | "code";

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: string;
  level?: number;
  children?: DocumentBlock[]; // NEW: nested AST child nodes
}

export type SyncStatus = "synced" | "syncing" | "offline" | "error";