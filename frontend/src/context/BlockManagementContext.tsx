import { createContext, useContext } from 'react';
import type { BlockType } from '../types/document';

export interface BlockManagementActions {
  moveBlockUp: (blockId: string) => void;
  moveBlockDown: (blockId: string) => void;
  deleteBlock: (blockId: string) => void;
  changeBlockType: (blockId: string, type: BlockType) => void;
}

/**
 * Week 3 "Block Management": a small context carrying imperative block
 * commands down to each row, so BlockRenderer doesn't need blocks/indices
 * threaded through props by hand. Kept deliberately narrow (just command
 * functions, no data) - the per-block *data* subscriptions live in
 * blockSelectionStore.ts instead, so this context updates rarely and never
 * causes the cursor-tracking re-renders context alone would cause.
 */
export const BlockManagementContext = createContext<BlockManagementActions | null>(null);

export function useBlockManagement(): BlockManagementActions {
  const ctx = useContext(BlockManagementContext);
  if (!ctx) throw new Error('useBlockManagement must be used within a BlockManagementContext.Provider');
  return ctx;
}
