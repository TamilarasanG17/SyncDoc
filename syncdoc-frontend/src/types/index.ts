export interface Document {
  id: string;
  title: string;
  updatedAt: string;
}

export type BlockType = "heading" | "paragraph" | "code";


export type SyncStatus = "synced" | "syncing" | "offline" | "error";

export interface EditRange {
  start: number;
  end: number;
}

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: string;
  level?: number;
  children?: DocumentBlock[];
  lastEditRange?: EditRange;
}