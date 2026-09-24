export type BlockType = 'document' | 'heading' | 'paragraph' | 'codeBlock' | 'list' | 'listItem' | 'text';

export interface AstNode {
  nodeId: string;
  type: BlockType;
  attrs: Record<string, unknown>;
  content: string;
  order?: number;
  children: AstNode[];
}

export interface DocumentSummary {
  _id: string;
  title: string;
  ownerId: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  root: AstNode;
}

export interface PeerUser {
  clientId: number;
  name: string;
  color: string;
  editingBlockId: string | null;
  selection: {
    blockId: string;
    start: number;
    end: number;
  } | null;
}