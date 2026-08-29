import { createContext, useContext } from "react";
import type { BlockSelectionState, SelectionRange } from "./types";

export interface BlockSelectionContextValue extends BlockSelectionState {
  setActiveBlock: (blockId: string | null) => void;
  setSelection: (selection: SelectionRange | null) => void;
}

export const BlockSelectionContext = createContext<BlockSelectionContextValue | null>(null);

export function useBlockSelection(): BlockSelectionContextValue {
  const context = useContext(BlockSelectionContext);

  if (!context) {
    throw new Error("useBlockSelection must be used within a BlockSelectionProvider");
  }

  return context;
}